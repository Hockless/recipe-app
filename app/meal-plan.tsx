import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

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
}

interface MealPlan {
  date: string;
  recipeId: string;
  recipeTitle: string;
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
  // New: rota state
  const [rotaPaused, setRotaPaused] = useState<RotaPausedMap>({});
  const [rotaWeekStartMap, setRotaWeekStartMap] = useState<RotaWeekStartMap>({});

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
        const parsedMealPlan = JSON.parse(storedMealPlan);
        
        // Clean up meal plan - remove entries for recipes that no longer exist
        const validRecipeIds = new Set(parsedRecipes.map((recipe: Recipe) => recipe.id));
        const cleanedMealPlan = parsedMealPlan.filter((meal: MealPlan) => 
          validRecipeIds.has(meal.recipeId)
        );
        
        // If we removed any orphaned entries, save the cleaned meal plan
        if (cleanedMealPlan.length !== parsedMealPlan.length) {
          await AsyncStorage.setItem('mealPlan', JSON.stringify(cleanedMealPlan));
          console.log(`Cleaned up meal plan: removed ${parsedMealPlan.length - cleanedMealPlan.length} orphaned entries`);
        }
        
        setMealPlan(cleanedMealPlan);
      }

      // New: load rota paused days
      const pausedRaw = await AsyncStorage.getItem('rotaPaused');
      setRotaPaused(pausedRaw ? JSON.parse(pausedRaw) : {});

      // New: load weekly start person map
      const startMapRaw = await AsyncStorage.getItem('rotaWeekStartMap');
      setRotaWeekStartMap(startMapRaw ? JSON.parse(startMapRaw) : {});
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
    const updated: RotaPausedMap = { ...rotaPaused, [dateStr]: !rotaPaused[dateStr] };
    // Clean false to avoid clutter
    if (!updated[dateStr]) delete updated[dateStr];
    setRotaPaused(updated);
    await AsyncStorage.setItem('rotaPaused', JSON.stringify(updated));
  };

  const assignRecipeToDay = async (recipeId: string, recipeTitle: string) => {
    if (!selectedDate) return;

    const newMealPlan = mealPlan.filter(meal => meal.date !== selectedDate);
    newMealPlan.push({
      date: selectedDate,
      recipeId,
      recipeTitle
    });

    await saveMealPlan(newMealPlan);
    setShowRecipeModal(false);
    setSelectedDate(null);
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

  const getRecipeForDate = (date: string) => {
    return mealPlan.find(meal => meal.date === date);
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

  const generateRandomMealPlan = async () => {
    if (recipes.length === 0) {
      Alert.alert('No Recipes', 'Please add some recipes first before generating a meal plan.');
      return;
    }

    // Web confirm and immediate generation
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm('This will replace your current meal plan with random recipes for this week. Continue?')
        : true;
      if (!ok) return;
      try {
        const weekDays = getWeekDays();
        const shuffled = [...recipes].sort(() => 0.5 - Math.random());
        const newMealPlan: MealPlan[] = weekDays.map((day, index) => {
          const recipe = shuffled[index % shuffled.length];
          return {
            date: formatDate(day),
            recipeId: recipe.id,
            recipeTitle: recipe.title,
          };
        });
        await saveMealPlan(newMealPlan);
        Alert.alert('Success!', 'Random meal plan generated successfully!');
      } catch (error) {
        console.error('Error generating random meal plan:', error);
        Alert.alert('Error', 'Failed to generate meal plan');
      }
      return;
    }

    Alert.alert(
      'Generate Random Meal Plan',
      'This will replace your current meal plan with random recipes for this week. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: async () => {
            try {
              const weekDays = getWeekDays();
              const shuffled = [...recipes].sort(() => 0.5 - Math.random());
              
              const newMealPlan: MealPlan[] = weekDays.map((day, index) => {
                const recipe = shuffled[index % shuffled.length];
                return {
                  date: formatDate(day),
                  recipeId: recipe.id,
                  recipeTitle: recipe.title
                };
              });

              await saveMealPlan(newMealPlan);
              Alert.alert('Success!', 'Random meal plan generated successfully!');
            } catch (error) {
              console.error('Error generating random meal plan:', error);
              Alert.alert('Error', 'Failed to generate meal plan');
            }
          }
        }
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

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Weekly Meal Plan</ThemedText>
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
                onPress={generateRandomMealPlan}
              >
                <ThemedText style={styles.randomPlanButtonText}>🎲 Generate Random Week</ThemedText>
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

        {/* Meal Plan Summary */}
        {mealPlan.length > 0 && (
          <ThemedView style={styles.summaryContainer}>
            <ThemedText style={styles.summaryTitle}>📋 {mealPlan.length} meal{mealPlan.length !== 1 ? 's' : ''} planned this week</ThemedText>
            <TouchableOpacity 
              style={styles.viewShoppingButton}
              onPress={() => router.push('/shopping-list')}
            >
              <ThemedText style={styles.viewShoppingButtonText}>🛒 View Shopping List ({getIngredientCount()} ingredients)</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Week Days */}
        <ThemedView style={styles.weekContainer}>
          {weekDays.map((day) => {
            const dateString = formatDate(day);
            const assignedRecipe = getRecipeForDate(dateString);
            const isToday = formatDate(new Date()) === dateString;
            const paused = isPaused(dateString);
            const cook = getCookForDate(day);

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
                      <ThemedText style={styles.tapToRemove}>Tap to remove</ThemedText>
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

          <ScrollView style={styles.recipeList}>
            {recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeOption}
                onPress={() => assignRecipeToDay(recipe.id, recipe.title)}
              >
                <ThemedText style={styles.recipeOptionTitle}>{recipe.title}</ThemedText>
                <ThemedText style={styles.recipeOptionDetails}>
                  {recipe.ingredients.length} ingredients
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FF6B6B',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
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
  summaryContainer: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  viewShoppingButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'center',
  },
  viewShoppingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  randomPlanContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  randomPlanRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  randomPlanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  clearPlanButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
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
  },
  dayHeaderLeft: {
    gap: 2,
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
  emptySlot: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  addRecipeText: {
    color: '#999',
    fontSize: 16,
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
});
