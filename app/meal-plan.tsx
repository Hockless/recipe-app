import { BackButton } from '@/components/BackButton';
import { shared } from '@/styles/theme';
import { loadPantry, PantryItem, parseAmount, savePantry } from '@/utils/pantry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import { Alert, Modal, PanResponder, Platform, ScrollView, StyleSheet, ToastAndroid, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions?: string;
  imageUri?: string;
  dateCreated: string;
  serves?: number;
  tags?: string[]; // e.g., ['Keto','Mediterranean']
}

interface MealPlan {
  date: string;
  recipeId: string;
  recipeTitle: string;
  serves?: number; // target serves for this meal (2 or 4). Default 4.
}

// New: Two-person rota types
type CookPerson = 'Jimmy' | 'Liddy';

type RotaPausedMap = Record<string, boolean>; // key: YYYY-MM-DD

type RotaWeekStartMap = Record<string, CookPerson>; // key: week start YYYY-MM-DD

export default function WeeklyTimelineScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedServes, setSelectedServes] = useState<2 | 4>(4);
  // Tag filter for recipe picker
  const [activeTagFilter, setActiveTagFilter] = useState<string>('All'); // 'All' | 'Keto' | 'Mediterranean'
  // New: rota state
  const [rotaPaused, setRotaPaused] = useState<RotaPausedMap>({});
  const [rotaWeekStartMap, setRotaWeekStartMap] = useState<RotaWeekStartMap>({});
  const [cookedMap, setCookedMap] = useState<Record<string, boolean>>({});
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  // Track pause-shift history to restore on unpause of the same day
  const [pauseShiftHistory, setPauseShiftHistory] = useState<Record<string, { before: MealPlan[]; after: MealPlan[] }>>({});

  // Get start of week (Monday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // New: week key for storing start person per-week
  const getWeekKey = (date: Date) => {
    const start = getStartOfWeek(date);
    return start.toISOString().split('T')[0]; // YYYY-MM-DD of Monday
  };

  // Get week days
  const getWeekDays = () => {
    const startOfWeek = getStartOfWeek(currentWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  };

  const loadData = async () => {
    try {
      // Load recipes
      const storedRecipes = await AsyncStorage.getItem('recipes');
      const parsedRecipes = storedRecipes ? JSON.parse(storedRecipes) : [];
      setRecipes(parsedRecipes);

      // Load meal plan
      const storedMealPlan = await AsyncStorage.getItem('mealPlan');
      if (storedMealPlan) {
        const parsedMealPlan = JSON.parse(storedMealPlan) as MealPlan[];
        
        // Clean up meal plan - remove entries for recipes that no longer exist
        const validRecipeIds = new Set(parsedRecipes.map((recipe: Recipe) => recipe.id));
        let cleanedMealPlan = parsedMealPlan.filter((meal: MealPlan) => validRecipeIds.has(meal.recipeId));
        
        // Migration: ensure serves exists (default 4)
        let mutated = false;
        cleanedMealPlan = cleanedMealPlan.map((m) => {
          if (typeof m.serves !== 'number') { mutated = true; return { ...m, serves: 4 as const }; }
          return m;
        });
        
        // If we removed any orphaned entries or mutated serves, save the cleaned meal plan
        if (cleanedMealPlan.length !== parsedMealPlan.length || mutated) {
          await AsyncStorage.setItem('mealPlan', JSON.stringify(cleanedMealPlan));
          if (cleanedMealPlan.length !== parsedMealPlan.length) {
            console.log(`Cleaned up meal plan: removed ${parsedMealPlan.length - cleanedMealPlan.length} orphaned entries`);
          }
        }
        
        setMealPlan(cleanedMealPlan);
      }

      // New: load rota paused days
      const pausedRaw = await AsyncStorage.getItem('rotaPaused');
      setRotaPaused(pausedRaw ? JSON.parse(pausedRaw) : {});

      // New: load weekly start person map
  const startMapRaw = await AsyncStorage.getItem('rotaWeekStartMap');
  setRotaWeekStartMap(startMapRaw ? JSON.parse(startMapRaw) : {});
  const cookedRaw = await AsyncStorage.getItem('cookedMeals');
  setCookedMap(cookedRaw ? JSON.parse(cookedRaw) : {});
  setPantry(await loadPantry());
  // Load pause-shift history
  const historyRaw = await AsyncStorage.getItem('pauseShiftHistory');
  setPauseShiftHistory(historyRaw ? JSON.parse(historyRaw) : {});
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveMealPlan = async (newMealPlan: MealPlan[]) => {
    try {
      console.log('Saving meal plan with', newMealPlan.length, 'items');
      await AsyncStorage.setItem('mealPlan', JSON.stringify(newMealPlan));
      setMealPlan(newMealPlan);
      console.log('Meal plan saved successfully');
    } catch (error) {
      console.error('Error saving meal plan:', error);
      Alert.alert('Error', 'Failed to save meal plan');
    }
  };

  // Export current week's meal plan recipes (with ingredients) to JSON file and share
  const exportCurrentWeek = async () => {
    try {
      const days = getWeekDays();
      const dateSet = new Set(days.map(d => formatDate(d)));
      const weekMeals = mealPlan.filter(m => dateSet.has(m.date));
      if (!weekMeals.length) {
        Alert.alert('No Meals', 'No recipes assigned for this week.');
        return;
      }
      const exportRecipes = weekMeals.map(m => {
        const r = recipes.find(rp => rp.id === m.recipeId);
        return {
          date: m.date,
            title: m.recipeTitle,
            serves: m.serves || 4,
            ingredients: r?.ingredients || [],
            instructions: r?.instructions || ''
        };
      }).sort((a,b)=> a.date.localeCompare(b.date));
      const payload = {
        generatedAt: new Date().toISOString(),
        weekStart: formatDate(getStartOfWeek(currentWeek)),
        count: exportRecipes.length,
        meals: exportRecipes
      };
      const json = JSON.stringify(payload, null, 2);
      const fileName = `meal-plan-${payload.weekStart}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      if (Platform.OS === 'web') {
        // Web fallback: create downloadable link
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        setTimeout(()=> URL.revokeObjectURL(url), 5000);
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Share Weekly Meal Plan' });
      } else {
        Alert.alert('Exported', `Saved to: ${fileUri}`);
      }
      if (Platform.OS === 'android') ToastAndroid.show('Meal plan exported', ToastAndroid.SHORT);
    } catch (e) {
      console.error('Export failed', e);
      Alert.alert('Export Failed', 'Could not export meal plan.');
    }
  };

  // New: helpers for rota
  const other = (p: CookPerson): CookPerson => (p === 'Jimmy' ? 'Liddy' : 'Jimmy');

  const getWeekStartPerson = (weekDate: Date): CookPerson => {
    const key = getWeekKey(weekDate);
    return rotaWeekStartMap[key] || 'Jimmy';
  };

  const toggleWeekStart = async () => {
    const key = getWeekKey(currentWeek);
    const newStart = other(getWeekStartPerson(currentWeek));
    const updated = { ...rotaWeekStartMap, [key]: newStart };
    setRotaWeekStartMap(updated);
    await AsyncStorage.setItem('rotaWeekStartMap', JSON.stringify(updated));
  };

  const isPaused = (dateStr: string) => !!rotaPaused[dateStr];

  const togglePause = async (dateStr: string) => {
    const willPause = !rotaPaused[dateStr];
    const updated: RotaPausedMap = { ...rotaPaused, [dateStr]: willPause };
    // Clean false to avoid clutter
    if (!updated[dateStr]) delete updated[dateStr];
    setRotaPaused(updated);
    await AsyncStorage.setItem('rotaPaused', JSON.stringify(updated));

    // If we just paused this day, shift meals down one non-paused day starting from this date
    if (willPause) {
      try {
        const result = shiftMealsFromDate(mealPlan, dateStr, updated);
        if (result) {
          // Save new plan
          await saveMealPlan(result.plan);
          // Record history for restoration on unpause of this date
          const nextHistory = { ...pauseShiftHistory, [dateStr]: { before: result.before, after: result.after } };
          setPauseShiftHistory(nextHistory);
          await AsyncStorage.setItem('pauseShiftHistory', JSON.stringify(nextHistory));
        }
      } catch (e) {
        console.error('Failed to shift meals after pause:', e);
      }
      return;
    }

    // If we unpaused this day, and we have history, restore order
    try {
            <TouchableOpacity onPress={exportCurrentWeek} style={styles.exportBtn}>
              <ThemedText style={styles.exportBtnText}>Export Week</ThemedText>
            </TouchableOpacity>
      const hist = pauseShiftHistory[dateStr];
      if (hist) {
        // Start from current plan
        let restored = [...mealPlan];
        // Remove entries that were placed by the shift (match by date and recipeId)
        const afterKeySet = new Set(hist.after.map(a => `${a.date}__${a.recipeId}`));
        restored = restored.filter(m => !afterKeySet.has(`${m.date}__${m.recipeId}`));
        // Also ensure we clear target dates for restoration to avoid collisions
        const beforeDates = new Set(hist.before.map(b => b.date));
        restored = restored.filter(m => !beforeDates.has(m.date));
        // Add back the original entries (before snapshot)
        restored.push(...hist.before);
        // Sort by date asc
        restored.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        await saveMealPlan(restored);
        // Clear history for this date
        const { [dateStr]: _, ...remaining } = pauseShiftHistory;
        setPauseShiftHistory(remaining);
        await AsyncStorage.setItem('pauseShiftHistory', JSON.stringify(remaining));
      }
    } catch (e) {
      console.error('Failed to restore meals after unpause:', e);
    }
  };

  // Helper: add N days to YYYY-MM-DD
  const addDaysStr = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return formatDate(d);
  };

  // Helper: next non-paused day strictly after the given date
  const nextNonPausedAfter = (dateStr: string, pausedMap: RotaPausedMap): string => {
    let attempts = 0;
    let ds = addDaysStr(dateStr, 1);
    while (pausedMap[ds]) {
      ds = addDaysStr(ds, 1);
      if (++attempts > 366) break; // safety
    }
    return ds;
  };

  // Shift all meals on or after startDate one non-paused day forward, preserving order and avoiding collisions.
  const shiftMealsFromDate = (
    plan: MealPlan[],
    startDate: string,
    pausedMap: RotaPausedMap,
  ): { plan: MealPlan[]; before: MealPlan[]; after: MealPlan[] } | null => {
    // Collect affected entries (>= startDate) sorted by date asc
    const affected = plan
      .filter((m) => m.date >= startDate)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    if (affected.length === 0) return null; // nothing to shift

    // Build new targets without collisions
    const targets: { orig: MealPlan; newDate: string }[] = [];
    let lastPlaced: string | null = null;
    for (const m of affected) {
      // Desired date is next non-paused AFTER original date
      let desired = nextNonPausedAfter(m.date, pausedMap);
      // Ensure strictly increasing to avoid collisions
      if (lastPlaced && desired <= lastPlaced) {
        // place after lastPlaced
        desired = nextNonPausedAfter(lastPlaced, pausedMap);
      }
      targets.push({ orig: m, newDate: desired });
      lastPlaced = desired;
    }

    // Rebuild plan: remove affected originals, then add shifted entries
    const unaffected = plan.filter((m) => m.date < startDate);
    const shiftedEntries = targets.map(({ orig, newDate }) => ({ ...orig, date: newDate }));
    const shifted: MealPlan[] = [
      ...unaffected,
      ...shiftedEntries,
    ];
    // Sort final plan by date asc for consistency
    shifted.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return { plan: shifted, before: affected, after: shiftedEntries };
  };

  const assignRecipeToDay = async (recipeId: string, recipeTitle: string) => {
    if (!selectedDate) return;

    const newMealPlan = mealPlan.filter(meal => meal.date !== selectedDate);
    newMealPlan.push({
      date: selectedDate,
      recipeId,
      recipeTitle,
      serves: selectedServes || 4
    });

    await saveMealPlan(newMealPlan);
    setShowRecipeModal(false);
    setSelectedDate(null);
    setSelectedServes(4);
  };

  const removeRecipeFromDay = async (date: string) => {
    // Web confirm fallback
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm('Remove this recipe from this day?')
        : true;
      if (!ok) return;
      const newMealPlan = mealPlan.filter(meal => meal.date !== date);
      await saveMealPlan(newMealPlan);
      return;
    }

    Alert.alert(
      'Remove Recipe',
      'Are you sure you want to remove this recipe from this day?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const newMealPlan = mealPlan.filter(meal => meal.date !== date);
            await saveMealPlan(newMealPlan);
          }
        }
      ]
    );
  };

  // Pick a random recipe, optionally by tag
  const pickRandomRecipe = (tag?: 'Keto' | 'Mediterranean'): Recipe | null => {
    const pool = tag ? recipes.filter(r => r.tags && r.tags.includes(tag)) : recipes;
    if (!pool || pool.length === 0) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  };

  // Assign a random recipe to a given date, replacing any existing assignment
  const assignRandomForDate = async (dateStr: string, tag?: 'Keto' | 'Mediterranean') => {
    if (isPaused(dateStr)) {
      const msg = 'This day is paused. Resume the day to assign a recipe.';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') window.alert(msg);
      } else {
        Alert.alert('Paused', msg);
      }
      return;
    }
    const recipe = pickRandomRecipe(tag);
    if (!recipe) {
      const msg = tag ? `No ${tag} recipes available.` : 'No recipes available.';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') window.alert(msg);
      } else {
        Alert.alert('No Recipes', msg);
      }
      return;
    }
    const newPlan = mealPlan.filter(m => m.date !== dateStr);
    newPlan.push({ date: dateStr, recipeId: recipe.id, recipeTitle: recipe.title, serves: 4 });
    await saveMealPlan(newPlan);
  };

  // Update serves for a specific day (2 or 4)
  const updateMealServes = async (dateStr: string, newServes: 2 | 4) => {
    try {
      const updated = mealPlan.map(m => m.date === dateStr ? { ...m, serves: newServes } : m);
      await saveMealPlan(updated);
    } catch (e) {
      console.error('Failed to update serves:', e);
      Alert.alert('Error', 'Could not update serves for this meal.');
    }
  };

  const getRecipeForDate = (date: string) => {
    return mealPlan.find(meal => meal.date === date);
  };

  const markCooked = async (dateStr: string) => {
    const next = { ...cookedMap, [dateStr]: !cookedMap[dateStr] };
    if (!next[dateStr]) delete next[dateStr];
    setCookedMap(next);
    await AsyncStorage.setItem('cookedMeals', JSON.stringify(next));
    if (next[dateStr]) {
      const meal = getRecipeForDate(dateStr);
      if (meal) {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (recipe) {
          let updated = [...pantry];
          for (const ing of recipe.ingredients) {
            const { qty, unit } = parseAmount(ing.amount);
            if (qty && unit) {
              const baseServes = typeof recipe.serves === 'number' ? recipe.serves : 4;
              const targetServes = typeof meal.serves === 'number' ? meal.serves : 4;
              const factor = baseServes > 0 ? (targetServes / baseServes) : 1;
              const idx = updated.findIndex(p => p.name.toLowerCase() === ing.name.toLowerCase() && p.unit === unit);
              if (idx >= 0) {
                updated[idx].quantity = Math.max(0, +(updated[idx].quantity - qty * factor).toFixed(3));
                updated[idx].updatedAt = new Date().toISOString();
              }
            }
          }
          updated = updated.filter(p => p.quantity > 0);
          setPantry(updated);
          await savePantry(updated);
        }
      }
    }
  };

  // New: derive cook for a given date in current week based on alternating order,
  // starting from the set week-start person, skipping paused or empty days.
  const getCookForDate = (dateObj: Date): CookPerson | undefined => {
    const dateStr = formatDate(dateObj);
    const recipe = getRecipeForDate(dateStr);
    if (!recipe || isPaused(dateStr)) return undefined;

    const weekDays = getWeekDays();
    const startPerson = getWeekStartPerson(currentWeek);

    // Count prior cooking days in the same week (with a recipe and not paused)
    let prior = 0;
    for (const d of weekDays) {
      const ds = formatDate(d);
      if (d.getTime() === dateObj.getTime()) break;
      const r = getRecipeForDate(ds);
      if (r && !isPaused(ds)) prior += 1;
    }

    return prior % 2 === 0 ? startPerson : other(startPerson);
  };

  const getIngredientCount = () => {
    const allIngredients = new Set<string>();
    mealPlan.forEach(meal => {
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (recipe) {
        recipe.ingredients.forEach(ingredient => {
          if (ingredient.name?.trim()) {
            allIngredients.add(ingredient.name.toLowerCase().trim());
          }
        });
      }
    });
    return allIngredients.size;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const generateRandomMealPlan = async (tag?: 'Keto' | 'Mediterranean') => {
    const source = tag ? recipes.filter(r => r.tags && r.tags.includes(tag)) : recipes;
    if (source.length === 0) {
      const msg = tag ? `No ${tag} recipes available. Add some or change the filter.` : 'Please add some recipes first before generating a meal plan.';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(msg);
        }
      } else {
        Alert.alert('No Recipes', msg);
      }
      return;
    }

    const title = tag ? `Generate ${tag} Meal Plan` : 'Generate Random Meal Plan';
    const prompt = tag
      ? `This will replace your current meal plan with random ${tag} recipes for this week. Continue?`
      : 'This will replace your current meal plan with random recipes for this week. Continue?';

    // Web confirm and immediate generation
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(prompt)
        : true;
      if (!ok) return;
      try {
        const weekDays = getWeekDays();
        const shuffled = [...source].sort(() => 0.5 - Math.random());
        const newMealPlan: MealPlan[] = weekDays.map((day, index) => {
          const recipe = shuffled[index % shuffled.length];
          return {
            date: formatDate(day),
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            serves: 4,
          };
        });
        await saveMealPlan(newMealPlan);
        Alert.alert('Success!', `Random ${tag ?? ''}${tag ? ' ' : ''}meal plan generated successfully!`.trim());
      } catch (error) {
        console.error('Error generating random meal plan:', error);
        Alert.alert('Error', 'Failed to generate meal plan');
      }
      return;
    }

    Alert.alert(
      title,
      prompt,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              const weekDays = getWeekDays();
              const shuffled = [...source].sort(() => 0.5 - Math.random());
              const newMealPlan: MealPlan[] = weekDays.map((day, index) => {
                const recipe = shuffled[index % shuffled.length];
                return {
                  date: formatDate(day),
                  recipeId: recipe.id,
                  recipeTitle: recipe.title,
                  serves: 4,
                };
              });
              await saveMealPlan(newMealPlan);
              Alert.alert('Success!', `Random ${tag ?? ''}${tag ? ' ' : ''}meal plan generated successfully!`.trim());
            } catch (error) {
              console.error('Error generating random meal plan:', error);
              Alert.alert('Error', 'Failed to generate meal plan');
            }
          },
        },
      ]
    );
  };

  // New: Clear all meals in the current plan with confirm (web/native)
  const clearMealPlan = async () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm('Remove all meals from this week?')
        : true;
      if (!ok) return;
      await saveMealPlan([]);
      return;
    }

    Alert.alert(
      'Remove All Meals',
      'This will clear your entire weekly meal plan. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await saveMealPlan([]);
          },
        },
      ]
    );
  };

  // Back handler with web fallback
  const handleBack = () => {
    // If router can go back, use it; otherwise go home
    if ((router as any).canGoBack?.()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const weekDays = getWeekDays();
  const weekStartPerson = getWeekStartPerson(currentWeek);

  // Swipe left/right to navigate weeks
  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        const { dx, dy } = gestureState;
        // Activate when horizontal intent is strong and exceeds threshold
        return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) + 6;
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const { dx } = gestureState;
        if (dx <= -50) {
          navigateWeek('next');
          if (Platform.OS === 'android') {
            ToastAndroid.show('Next week', ToastAndroid.SHORT);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else if (dx >= 50) {
          navigateWeek('prev');
          if (Platform.OS === 'android') {
            ToastAndroid.show('Previous week', ToastAndroid.SHORT);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      },
    })
  ).current;

  return (
    <ThemedView style={{ flex: 1 }} {...swipeResponder.panHandlers}>
      <ScrollView style={shared.screenContainer}>
      <ThemedView style={shared.headerBar}>
        <BackButton onPress={handleBack} />
        <ThemedText type="title" style={shared.screenTitle}>Weekly Meal Plan</ThemedText>
        <ThemedText style={styles.subtitle}>Plan your recipes for the week</ThemedText>
        
        <TouchableOpacity 
          style={styles.shoppingListButton}
          onPress={() => router.push('/shopping-list')}
        >
          <ThemedText style={styles.shoppingListButtonText}>🛒 View Shopping List</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.content}>
        {/* Week Navigation */}
        <ThemedView style={styles.weekNavigation}>
          <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navButton}>
            <ThemedText style={styles.navButtonText}>← Prev</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToCurrentWeek} style={styles.currentWeekButton}>
            <ThemedText style={styles.currentWeekText}>
              {weekDays[0].toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navButton}>
            <ThemedText style={styles.navButtonText}>Next →</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* New: Cooking rota controls */}
        <ThemedView style={styles.rotaBar}>
          <TouchableOpacity style={styles.rotaStartButton} onPress={toggleWeekStart}>
            <ThemedText style={styles.rotaStartText}>Rota starts: {weekStartPerson}</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.rotaHint}>Paused days are skipped</ThemedText>
        </ThemedView>

        {/* Random Meal Plan Generator */}
        {recipes.length > 0 && (
          <ThemedView style={styles.randomPlanContainer}>
            <ThemedView style={styles.randomPlanRow}>
              <TouchableOpacity 
                style={styles.randomPlanButton}
                onPress={() => generateRandomMealPlan()}
              >
                <ThemedText style={styles.randomPlanButtonText}>🎲 Generate Random Week</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.randomPlanButton, styles.ketoPlanButton]}
                onPress={() => generateRandomMealPlan('Keto')}
              >
                <ThemedText style={styles.randomPlanButtonText}>🥑 Generate Keto Week</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.clearPlanButton}
                onPress={clearMealPlan}
              >
                <ThemedText style={styles.clearPlanButtonText}>🗑️ Remove All</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}

  {/* Summary removed per request */}

        {/* Week Days */}
        <ThemedView style={styles.weekContainer}>
          {weekDays.map((day) => {
            const dateString = formatDate(day);
            const assignedRecipe = getRecipeForDate(dateString);
            const isToday = formatDate(new Date()) === dateString;
            const paused = isPaused(dateString);
            const cook = getCookForDate(day);
            const cooked = cookedMap[dateString];

            return (
              <ThemedView key={dateString} style={[styles.dayCard, isToday && styles.todayCard, paused && styles.pausedCard]}>
                <ThemedView style={styles.dayHeader}>
                  <ThemedView style={styles.dayHeaderLeft}>
                    <ThemedText style={[styles.dayName, isToday && styles.todayText]}>
                      {getDayName(day)}
                    </ThemedText>
                    <ThemedText style={[styles.dayDate, isToday && styles.todayText]}>
                      {formatDisplayDate(day)}
                    </ThemedText>
                  </ThemedView>

                  <TouchableOpacity onPress={() => togglePause(dateString)} style={[styles.pauseButton, paused && styles.pauseButtonActive]}>
                    <ThemedText style={styles.pauseButtonText}>{paused ? '▶ Resume' : '⏸ Pause'}</ThemedText>
                  </TouchableOpacity>
                </ThemedView>

                {/* Per-day random assignment buttons */}
                {!paused && (
                  <ThemedView style={styles.randomRow}>
                    <TouchableOpacity style={styles.randomChip} onPress={() => assignRandomForDate(dateString)}>
                      <ThemedText style={styles.randomChipText}>🎲 Any</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.randomChip, styles.randomChipKeto]} onPress={() => assignRandomForDate(dateString, 'Keto')}>
                      <ThemedText style={[styles.randomChipText, styles.randomChipTextKeto]}>🥑 Keto</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                )}

                <TouchableOpacity 
                  style={[
                    styles.recipeSlot,
                    assignedRecipe && styles.recipeSlotFilled,
                    paused && styles.recipeSlotPaused
                  ]}
                  onPress={() => {
                    if (assignedRecipe) {
                      removeRecipeFromDay(dateString);
                    } else {
                      setSelectedDate(dateString);
                      setShowRecipeModal(true);
                    }
                  }}
                >
                  {paused ? (
                    <ThemedView style={styles.assignedRecipe}>
                      <ThemedText style={styles.pausedText}>⏸ Paused (no one cooks)</ThemedText>
                      {assignedRecipe && (
                        <ThemedText style={styles.recipeTitle} numberOfLines={2}>
                          {assignedRecipe.recipeTitle}
                        </ThemedText>
                      )}
                    </ThemedView>
                  ) : assignedRecipe ? (
                    <ThemedView style={styles.assignedRecipe}>
                      <ThemedText style={styles.recipeTitle} numberOfLines={2}>
                        {assignedRecipe.recipeTitle}
                      </ThemedText>
                      {cook && (
                        <ThemedText style={styles.cookText}>👩‍🍳 Cook: {cook}</ThemedText>
                      )}
                      {/* In-card serves toggle */}
                      <ThemedView style={[styles.servesButtons, { marginBottom: 6 }]}>
                        <ThemedText style={[styles.cookText, { marginRight: 8 }]}>Serves:</ThemedText>
                        <TouchableOpacity 
                          style={[styles.servesBtn, (assignedRecipe?.serves ?? 4) === 2 && styles.servesBtnActive]}
                          onPress={() => updateMealServes(dateString, 2)}
                        >
                          <ThemedText style={[styles.servesBtnText, (assignedRecipe?.serves ?? 4) === 2 && styles.servesBtnTextActive]}>2</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.servesBtn, (assignedRecipe?.serves ?? 4) === 4 && styles.servesBtnActive]}
                          onPress={() => updateMealServes(dateString, 4)}
                        >
                          <ThemedText style={[styles.servesBtnText, (assignedRecipe?.serves ?? 4) === 4 && styles.servesBtnTextActive]}>4</ThemedText>
                        </TouchableOpacity>
                      </ThemedView>
                      <TouchableOpacity onPress={() => markCooked(dateString)} style={[styles.cookBtn, cooked && styles.cookBtnDone]}>
                        <ThemedText style={styles.cookBtnText}>{cooked ? 'Cooked ✓' : 'Mark Cooked'}</ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.tapToRemove}>Tap background to remove</ThemedText>
                    </ThemedView>
                  ) : (
                    <ThemedView style={styles.emptySlot}>
                      <ThemedText style={styles.addRecipeText}>+ Add Recipe</ThemedText>
                    </ThemedView>
                  )}
                </TouchableOpacity>
              </ThemedView>
            );
          })}
        </ThemedView>

        {recipes.length === 0 && (
          <ThemedView style={styles.noRecipesContainer}>
            <ThemedText style={styles.noRecipesText}>
              No recipes available. Create some recipes first to add them to your meal plan!
            </ThemedText>
            <TouchableOpacity 
              style={styles.createRecipeButton}
              onPress={() => router.push('/add-recipe')}
            >
              <ThemedText style={styles.createRecipeButtonText}>Create First Recipe</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>

      {/* Recipe Selection Modal */}
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Choose a Recipe
            </ThemedText>
            <TouchableOpacity 
              onPress={() => setShowRecipeModal(false)}
              style={styles.closeButton}
            >
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Serves selector */}
          <ThemedView style={styles.servesSelector}>
            <ThemedText style={styles.servesLabel}>Serves:</ThemedText>
            <ThemedView style={styles.servesButtons}>
              <TouchableOpacity 
                style={[styles.servesBtn, selectedServes === 2 && styles.servesBtnActive]}
                onPress={() => setSelectedServes(2)}
              >
                <ThemedText style={[styles.servesBtnText, selectedServes === 2 && styles.servesBtnTextActive]}>2</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.servesBtn, selectedServes === 4 && styles.servesBtnActive]}
                onPress={() => setSelectedServes(4)}
              >
                <ThemedText style={[styles.servesBtnText, selectedServes === 4 && styles.servesBtnTextActive]}>4</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          {/* Tag filter pills */}
          <ThemedView style={[styles.filterBar, { paddingHorizontal: 20, marginBottom: 6 }]}>
            {['All', 'Keto', 'Mediterranean'].map((tag) => {
              const active = activeTagFilter === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setActiveTagFilter(tag)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {tag}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ThemedView>
          {activeTagFilter !== 'All' && (
            <ThemedText style={[styles.filterInfo, { paddingHorizontal: 20 }]}>
              Filtering by {activeTagFilter}
            </ThemedText>
          )}

          <ScrollView style={styles.recipeList}>
            {(activeTagFilter === 'All' ? recipes : recipes.filter(r => r.tags && r.tags.includes(activeTagFilter))).map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeOption}
                onPress={() => assignRecipeToDay(recipe.id, recipe.title)}
              >
                <ThemedText style={styles.recipeOptionTitle}>{recipe.title}</ThemedText>
                <ThemedText style={styles.recipeOptionDetails}>
                  {recipe.ingredients.length} ingredients{typeof recipe.serves === 'number' ? ` • base serves ${recipe.serves}` : ''}
                </ThemedText>
              </TouchableOpacity>
            ))}
            {((activeTagFilter !== 'All' ? recipes.filter(r => r.tags && r.tags.includes(activeTagFilter)) : recipes).length === 0) && (
              <ThemedView style={{ padding: 20 }}>
                <ThemedText style={{ color: '#666' }}>No recipes match this filter.</ThemedText>
              </ThemedView>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  exportBtn: { marginLeft: 'auto', backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  shoppingListButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 15,
  },
  shoppingListButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // summary card styles removed
  randomPlanContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  randomPlanRow: {
    flexDirection: 'row',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  },
  randomPlanButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  // Responsive: let buttons share space and wrap to new lines
  flexBasis: '48%',
  flexGrow: 1,
  flexShrink: 1,
  },
  randomPlanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  flexShrink: 1,
  },
  clearPlanButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
  flexBasis: '48%',
  flexGrow: 1,
  flexShrink: 1,
  },
  ketoPlanButton: {
    backgroundColor: '#2e7d32',
  },
  clearPlanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  weekNavigation: {
    flexDirection: 'row',
  justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  flexWrap: 'wrap',
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  currentWeekButton: {
    flex: 1,
    alignItems: 'center',
  },
  currentWeekText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // New: rota styles
  rotaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  rotaStartButton: {
    backgroundColor: '#ffe8e8',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rotaStartText: {
    color: '#d84343',
    fontWeight: '700',
  },
  rotaHint: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  weekContainer: {
    gap: 15,
  },
  dayCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  todayCard: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  pausedCard: {
    opacity: 0.9,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  flexWrap: 'wrap',
  },
  dayHeaderLeft: {
  gap: 2,
  flexShrink: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dayDate: {
    fontSize: 14,
    color: '#666',
  },
  todayText: {
    color: '#FF6B6B',
  },
  pauseButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pauseButtonActive: {
    backgroundColor: '#ffdede',
  },
  pauseButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  recipeSlot: {
    minHeight: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  recipeSlotFilled: {
    borderStyle: 'solid',
    borderColor: '#FF6B6B',
    backgroundColor: 'transparent',
  },
  recipeSlotPaused: {
    borderColor: '#bbb',
    borderStyle: 'dashed',
  },
  assignedRecipe: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  cookText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  pausedText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  tapToRemove: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  cookBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 4 },
  cookBtnDone: { backgroundColor: '#2e7d32' },
  cookBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptySlot: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  addRecipeText: {
    color: '#999',
    fontSize: 16,
  },
  // Random per-day row
  randomRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  flexWrap: 'wrap',
  },
  randomChip: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  randomChipKeto: {
    backgroundColor: '#e6f4ea',
    borderColor: '#c5e1c8',
  },
  randomChipText: {
    color: '#333',
    fontWeight: '700',
  },
  randomChipTextKeto: {
    color: '#2e7d32',
  },
  noRecipesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRecipesText: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  createRecipeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createRecipeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  recipeList: {
    flex: 1,
  },
  // Tag filter styles (mirrored from browse-recipes)
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#ececec',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#FF6B6B',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  filterInfo: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
  },
  recipeOption: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recipeOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  recipeOptionDetails: {
    fontSize: 14,
    color: '#666',
  },
  // Serves selector styles
  servesSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  servesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  servesButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  servesBtn: {
    backgroundColor: '#eee',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 46,
    alignItems: 'center',
  },
  servesBtnActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  servesBtnText: {
    color: '#333',
    fontWeight: '700',
  },
  servesBtnTextActive: {
    color: '#fff',
  },
});
