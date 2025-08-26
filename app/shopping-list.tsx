import { BackButton } from '@/components/BackButton';
import { shared } from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { INGREDIENT_DATABASE } from '@/components/IngredientSearch';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { loadPantry, parseAmount } from '@/utils/pantry';
import { UNIT_OPTIONS, buildAmount, type UnitGroup, type UnitOption } from '@/utils/units';

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
}

interface MealPlan {
  date: string;
  recipeId: string;
  recipeTitle: string;
  serves?: number;
}

interface ShoppingItem {
  name: string;
  amounts: string[];
  recipes: string[];
  checked: boolean;
  isCustom?: boolean;
}

interface ShoppingListHistory {
  id: string;
  weekStart: string;
  weekEnd: string;
  items: ShoppingItem[];
  mealPlanSnapshot: MealPlan[];
  dateCreated: string;
}

// New: items user already has in the fridge
interface FridgeItem {
  name: string;
  amount?: string;
  notes?: string;
  addedAt: string;
}

export default function ShoppingListScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [customItems, setCustomItems] = useState<ShoppingItem[]>([]);
  const [shoppingHistory, setShoppingHistory] = useState<ShoppingListHistory[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemAmount, setCustomItemAmount] = useState('');
  // New qty/unit for custom items
  const [customQty, setCustomQty] = useState('');
  const [customUnit, setCustomUnit] = useState<string>('each');
  const [customUnitPickerVisible, setCustomUnitPickerVisible] = useState(false);
  const [customCustomUnit, setCustomCustomUnit] = useState('');
  // New: fridge items state
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  // Seeded ingredient aliases (from seeding)
  const [seededAliases, setSeededAliases] = useState<{ name: string; aliases: string[] }[]>([]);
  const [pantryItems, setPantryItems] = useState<{ name: string; quantity: number; unit: string }[]>([]);

  // Helpers: canonicalization
  const stripParentheticals = (s: string) => s.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizeSeparators = (s: string) => s.replace(/[\-_/]+/g, ' ');
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const removeDescriptors = (s: string) => {
    const DESCRIPTORS = [
      'finely chopped','roughly chopped','chopped','grated','sliced','diced','halved','minced','crushed',
      'fresh','jarred','defrosted','optional','for dressing','for garnish'
    ];
    let out = ' ' + s + ' ';
    for (const d of DESCRIPTORS) {
      const re = new RegExp(`\\b${escapeRegExp(d)}\\b`, 'gi');
      out = out.replace(re, ' ');
    }
    return out.replace(/\s+/g, ' ').trim();
  };
  const baseNormalize = (s: string) => removeDescriptors(normalizeSeparators(stripParentheticals(s.toLowerCase().trim())));

  const buildAliasMap = () => {
    const map = new Map<string, string>();
    const add = (canon: string, alias: string) => {
      const k = baseNormalize(alias);
      if (k) map.set(k, canon);
    };
    // Built-ins
    for (const it of INGREDIENT_DATABASE) {
      add(it.name, it.name);
      for (const a of it.aliases) add(it.name, a);
    }
    // Seeded
    for (const it of seededAliases) {
      add(it.name, it.name);
      for (const a of it.aliases) add(it.name, a);
    }
    // Common extra synonyms
    const EXTRAS: Record<string,string> = {
      cilantro: 'Coriander',
      coriander: 'Coriander',
      scallion: 'Spring onion',
      scallions: 'Spring onion',
      'spring onions': 'Spring onion',
      courgette: 'Courgette',
      courgettes: 'Courgette',
      zucchini: 'Courgette',
      'bell pepper': 'Bell Pepper',
      'bell peppers': 'Bell Pepper',
      peppers: 'Bell Pepper',
      pepper: 'Black Pepper',
      'cherry tomatoes': 'Tomato',
      tomatoes: 'Tomato',
      tomato: 'Tomato',
      feta: 'Feta cheese',
      'feta cheese': 'Feta cheese',
      sriracha: 'Sriracha',
      lemongrass: 'Lemongrass',
    };
    for (const [a, c] of Object.entries(EXTRAS)) add(c, a);
    return map;
  };

  const aliasMap = buildAliasMap();
  const canonicalizeName = (name: string) => {
    const k = baseNormalize(name);
    const mapped = aliasMap.get(k);
    if (mapped) return mapped;
    // Fallback: title case of stripped name
    const pretty = k.replace(/\b\w/g, m => m.toUpperCase());
    return pretty || name.trim();
  };

  const loadData = async () => {
    try {
      // Load recipes
      const storedRecipes = await AsyncStorage.getItem('recipes');
      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      }

      // Load meal plan
      const storedMealPlan = await AsyncStorage.getItem('mealPlan');
      if (storedMealPlan) {
        setMealPlan(JSON.parse(storedMealPlan));
      }

      // Load checked items
      const storedCheckedItems = await AsyncStorage.getItem('shoppingListChecked');
      if (storedCheckedItems) {
        setCheckedItems(JSON.parse(storedCheckedItems));
      }

      // Load custom items
      const storedCustomItems = await AsyncStorage.getItem('customShoppingItems');
      if (storedCustomItems) {
        setCustomItems(JSON.parse(storedCustomItems));
      }

      // Load shopping history
      const storedHistory = await AsyncStorage.getItem('shoppingHistory');
      if (storedHistory) {
        setShoppingHistory(JSON.parse(storedHistory));
      }

      // New: Load fridge items
      const storedFridge = await AsyncStorage.getItem('fridgeItems');
      if (storedFridge) {
        setFridgeItems(JSON.parse(storedFridge));
      }

      // Load seeded ingredient aliases (used for canonicalization)
      const storedSeeded = await AsyncStorage.getItem('seededIngredients');
  if (storedSeeded) {
        try {
          const parsed = JSON.parse(storedSeeded) as { name: string; aliases: string[] }[];
          setSeededAliases(parsed);
        } catch {}
      }
  setPantryItems(await loadPantry());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateShoppingList = () => {
    if (currentHistoryIndex >= 0) {
      // Display historical shopping list
      const historicalList = shoppingHistory[currentHistoryIndex];
      if (historicalList) {
        setShoppingList(historicalList.items);
        return;
      }
    }

    // Generate current shopping list
    const ingredientMap: { [key: string]: ShoppingItem } = {};
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // New: build a normalized set of ingredients user already has
  const fridgeSet = new Set(fridgeItems.map(i => baseNormalize(i.name || '')).filter(Boolean) as string[]);
  const pantryMap = new Map<string, { qty: number; unit: string }>();
  pantryItems.forEach(p => pantryMap.set(p.name.toLowerCase() + '::' + p.unit, { qty: p.quantity, unit: p.unit }));
  const requiredAgg = new Map<string, { name: string; unit: string; qty: number }>();

    // Add items from meal plan (include today and future meals)
    if (recipes.length > 0 && mealPlan.length > 0) {
      const futureMeals = mealPlan.filter(meal => meal.date >= today);
      
  futureMeals.forEach(meal => {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (recipe) {
          recipe.ingredients.forEach(ingredient => {
            if (!ingredient.name?.trim()) return;
            
            const canonicalName = canonicalizeName(ingredient.name);

            // New: Skip ingredients that are already in the user's fridge
            if (fridgeSet.has(baseNormalize(ingredient.name))) return;
            
            const { qty, unit } = parseAmount(ingredient.amount);
            if (qty && unit) {
      const baseServes = typeof recipe.serves === 'number' ? recipe.serves : 4;
      const targetServes = typeof meal.serves === 'number' ? meal.serves : 4;
      const factor = baseServes > 0 ? (targetServes / baseServes) : 1;
              const key = canonicalName.toLowerCase() + '::' + unit;
      const cur = requiredAgg.get(key) || { name: canonicalName, unit, qty: 0 };
      cur.qty += qty * factor;
              requiredAgg.set(key, cur);
            } else {
              if (ingredientMap[canonicalName]) {
                if (ingredient.amount && !ingredientMap[canonicalName].amounts.includes(ingredient.amount)) {
                  ingredientMap[canonicalName].amounts.push(ingredient.amount);
                }
                if (!ingredientMap[canonicalName].recipes.includes(recipe.title)) {
                  ingredientMap[canonicalName].recipes.push(recipe.title);
                }
              } else {
                ingredientMap[canonicalName] = {
                  name: canonicalName,
                  amounts: ingredient.amount ? [ingredient.amount] : [],
                  recipes: [recipe.title],
                  checked: checkedItems[canonicalName.toLowerCase()] || false,
                  isCustom: false
                };
              }
            }
          });
        }
      });
    }

    for (const req of requiredAgg.values()) {
      const key = req.name.toLowerCase() + '::' + req.unit;
      const pantryEntry = pantryMap.get(key);
      const deficit = pantryEntry ? req.qty - pantryEntry.qty : req.qty;
      if (deficit > 0.0001) {
        const amountStr = `${deficit % 1 === 0 ? deficit : deficit.toFixed(2)} ${req.unit}`;
        if (ingredientMap[req.name]) {
          if (!ingredientMap[req.name].amounts.includes(amountStr)) ingredientMap[req.name].amounts.push(amountStr);
          if (!ingredientMap[req.name].recipes.includes('Multiple')) ingredientMap[req.name].recipes.push('Multiple');
        } else {
          ingredientMap[req.name] = {
            name: req.name,
            amounts: [amountStr],
            recipes: ['Multiple'],
            checked: checkedItems[req.name.toLowerCase()] || false,
            isCustom: false
          };
        }
      }
    }

    // Add custom items
    customItems.forEach(customItem => {
      const normalizedName = customItem.name.toLowerCase().trim();
      ingredientMap[normalizedName] = {
        ...customItem,
        checked: checkedItems[normalizedName] || false
      };
    });

  const sortedList = Object.values(ingredientMap).sort((a, b) => {
      // Sort custom items first, then alphabetically
      if (a.isCustom && !b.isCustom) return -1;
      if (!a.isCustom && b.isCustom) return 1;
      return a.name.localeCompare(b.name);
    });

    setShoppingList(sortedList);
  };

  const toggleItem = async (itemName: string) => {
    const normalizedName = itemName.toLowerCase().trim();
    const newCheckedItems = {
      ...checkedItems,
      [normalizedName]: !checkedItems[normalizedName]
    };
    
    setCheckedItems(newCheckedItems);
    
    try {
      await AsyncStorage.setItem('shoppingListChecked', JSON.stringify(newCheckedItems));
    } catch (error) {
      console.error('Error saving checked items:', error);
    }
  };

  const clearCheckedItems = async () => {
    Alert.alert(
      'Clear Completed Items',
      'Remove all checked items from your shopping list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          onPress: async () => {
            const newCheckedItems: { [key: string]: boolean } = {};
            setCheckedItems(newCheckedItems);
            
            try {
              await AsyncStorage.setItem('shoppingListChecked', JSON.stringify(newCheckedItems));
            } catch (error) {
              console.error('Error clearing checked items:', error);
            }
          }
        }
      ]
    );
  };

  const getFutureMealInfo = () => {
    if (mealPlan.length === 0) return { dateRange: '', futureMealCount: 0, totalMealCount: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    const futureMeals = mealPlan.filter(meal => meal.date >= today);
    // allDates removed as unused
    
    if (futureMeals.length === 0) {
      return { dateRange: 'No upcoming meals', futureMealCount: 0, totalMealCount: mealPlan.length };
    }
    
    const futureDates = futureMeals.map(meal => new Date(meal.date)).sort((a, b) => a.getTime() - b.getTime());
    const startDate = futureDates[0];
    const endDate = futureDates[futureDates.length - 1];
    
    const dateRange = startDate.getTime() === endDate.getTime() 
      ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    return { 
      dateRange, 
      futureMealCount: futureMeals.length, 
      totalMealCount: mealPlan.length 
    };
  };

  // New: count how many unique ingredients are being skipped due to Your Fridge
  const getFridgeSkipCount = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureMeals = mealPlan.filter(meal => meal.date >= today);
      if (recipes.length === 0 || futureMeals.length === 0 || fridgeItems.length === 0) return 0;

      const fridgeSet = new Set(
        fridgeItems.map(i => baseNormalize(i.name || '')).filter(Boolean) as string[]
      );

      const wouldInclude = new Set<string>();
      futureMeals.forEach(meal => {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (!recipe) return;
        recipe.ingredients.forEach(ing => {
          const n = baseNormalize(ing.name || '');
          if (!n) return;
          if (fridgeSet.has(n)) wouldInclude.add(n);
        });
      });
      return wouldInclude.size;
    } catch {
      return 0;
    }
  };

  const addCustomItem = async () => {
    if (!customItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const amountStr = customItemAmount.trim() || buildAmount(customQty, customUnit, customCustomUnit);

    const newCustomItem: ShoppingItem = {
      name: customItemName.trim(),
      amounts: amountStr ? [amountStr] : [],
      recipes: ['Custom Item'],
      checked: false,
      isCustom: true
    };

    const updatedCustomItems = [...customItems, newCustomItem];
    setCustomItems(updatedCustomItems);
    
    try {
      await AsyncStorage.setItem('customShoppingItems', JSON.stringify(updatedCustomItems));
      setCustomItemName('');
      setCustomItemAmount('');
      setCustomQty('');
      setCustomUnit('each');
      setCustomCustomUnit('');
      setShowAddCustomModal(false);
    } catch (error) {
      console.error('Error saving custom item:', error);
      Alert.alert('Error', 'Failed to add custom item');
    }
  };

  const removeCustomItem = async (itemName: string) => {
    Alert.alert(
      'Remove Custom Item',
      `Remove "${itemName}" from custom items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const updatedCustomItems = customItems.filter(item => item.name !== itemName);
            setCustomItems(updatedCustomItems);
            
            try {
              await AsyncStorage.setItem('customShoppingItems', JSON.stringify(updatedCustomItems));
            } catch (error) {
              console.error('Error removing custom item:', error);
            }
          }
        }
      ]
    );
  };

  const saveToHistory = async () => {
    if (shoppingList.length === 0 || mealPlan.length === 0) return;

    const weekDates = mealPlan.map(meal => new Date(meal.date)).sort((a, b) => a.getTime() - b.getTime());
    const weekStart = weekDates[0].toISOString().split('T')[0];
    const weekEnd = weekDates[weekDates.length - 1].toISOString().split('T')[0];

    // Check if this week already exists in history
    const existingIndex = shoppingHistory.findIndex(h => h.weekStart === weekStart && h.weekEnd === weekEnd);
    
    const historyItem: ShoppingListHistory = {
      id: existingIndex >= 0 ? shoppingHistory[existingIndex].id : Date.now().toString(),
      weekStart,
      weekEnd,
      items: [...shoppingList],
      mealPlanSnapshot: [...mealPlan],
      dateCreated: new Date().toISOString()
    };

    let updatedHistory;
    if (existingIndex >= 0) {
      // Update existing entry
      updatedHistory = [...shoppingHistory];
      updatedHistory[existingIndex] = historyItem;
    } else {
      // Add new entry
      updatedHistory = [historyItem, ...shoppingHistory].slice(0, 20); // Keep only last 20 weeks
    }

    setShoppingHistory(updatedHistory);
    
    try {
      await AsyncStorage.setItem('shoppingHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const loadHistoricalList = (index: number) => {
    setCurrentHistoryIndex(index);
    setShowHistoryModal(false);
  };

  const returnToCurrentList = () => {
    setCurrentHistoryIndex(-1);
  };

  // New: Back handler with fallback for web/no history
  const handleBack = () => {
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

  useEffect(() => {
    generateShoppingList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, mealPlan, checkedItems, customItems, currentHistoryIndex, fridgeItems, pantryItems]);

  useEffect(() => {
    // Auto-save to history when meal plan changes
    if (shoppingList.length > 0 && mealPlan.length > 0 && currentHistoryIndex === -1) {
      saveToHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingList, mealPlan]);

  const checkedCount = shoppingList.filter(item => checkedItems[item.name.toLowerCase().trim()]).length;
  const fridgeSkipCount = getFridgeSkipCount();

  // Category grouping logic
  const CATEGORY_DEFS: { name: string; keywords: string[] }[] = [
    // Produce & fresh items
    { name: 'Vegetables', keywords: ['onion','pepper','pepper ','pepper,','jalapeño','jalapeno','jalapeños','jalapenos','courgette','zucchini','tomato','lettuce','leek','spinach','mushroom','broccoli','squash','carrot','pak choi','cavolo','garlic','ginger','chilli','spring onion','lemon'] },
    { name: 'Herbs', keywords: ['parsley','coriander','thyme','rosemary','dill','basil','oregano','mint'] },
    // Proteins
    { name: 'Meat', keywords: ['chicken','lamb','sausage','bacon','pancetta','chorizo','thigh','breast','mince','pork','prosciutto','ham'] },
    { name: 'Seafood', keywords: ['fish','prawn','prawns','haddock','cod','plaice','bass','hake','mackerel'] },
    // Dairy & eggs
    { name: 'Dairy', keywords: ['cheese','feta','mozzarella','parmesan','yoghurt','yogurt','butter','egg'] },
    { name: 'Spices & Seasoning', keywords: ['cumin','coriander powder','paprika','garam masala','cinnamon','turmeric','fajita','piri piri','pepper','salt','seasoning','curry paste','chilli flakes','bay leaf','mixed herbs'] },
    { name: 'Pantry / Dry', keywords: ['oil','lentil','beans','bean','barley','chickpea','apricot','almond','anchovy','pesto','tomato purée','tomato puree','stock cube','noodle','pasta','spaghetti','courgetti','nuts','pine nuts','seeds','flour','vinegar','sriracha','soy sauce','miso'] },
  ];

  const categorizeItem = (rawName: string): string => {
    const name = rawName.toLowerCase();
    for (const cat of CATEGORY_DEFS) {
      if (cat.keywords.some(k => name.includes(k))) return cat.name;
    }
    return 'Other';
  };

  const grouped = shoppingList.reduce<Record<string, typeof shoppingList>>((acc, item) => {
    const cat = categorizeItem(item.name);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const CATEGORY_ORDER = [...CATEGORY_DEFS.map(c => c.name), 'Other'];

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <BackButton onPress={handleBack} />
        <ThemedText type="title" style={styles.title}>Shopping List</ThemedText>
        <ThemedText style={styles.subtitle}>
          {currentHistoryIndex >= 0 ? 
            `Historical list from ${shoppingHistory[currentHistoryIndex]?.weekStart} to ${shoppingHistory[currentHistoryIndex]?.weekEnd}` :
            shoppingList.length > 0 ? `${checkedCount}/${shoppingList.length} items completed${fridgeSkipCount > 0 ? ` • ${fridgeSkipCount} skipped from Your Fridge` : ''}` : 'Auto-generated from meal plan'
          }
        </ThemedText>
        
        {/* Action Buttons */}
        <ThemedView style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowAddCustomModal(true)}
          >
            <ThemedText style={styles.headerButtonText}>+ Add Item</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerButton, styles.historyHeaderButton]}
            onPress={() => setShowHistoryModal(true)}
          >
            <ThemedText style={styles.headerButtonTextLarge}>📚</ThemedText>
          </TouchableOpacity>

          {/* New: quick access to Your Fridge */}
          <TouchableOpacity 
            style={[styles.headerButton, styles.historyHeaderButton]}
            onPress={() => router.push('/fridge')}
          >
            <ThemedText style={styles.headerButtonTextLarge}>🥬</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.content}>
        {currentHistoryIndex >= 0 && (
          <ThemedView style={styles.historyBanner}>
            <ThemedText style={styles.historyBannerText}>
              📖 Viewing historical shopping list
            </ThemedText>
            <TouchableOpacity 
              style={styles.returnButton}
              onPress={returnToCurrentList}
            >
              <ThemedText style={styles.returnButtonText}>Return to Current</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {mealPlan.length > 0 && currentHistoryIndex === -1 && (
          <ThemedView style={styles.weekInfo}>
            <ThemedText style={styles.weekText}>
              🍽️ Upcoming meals: {getFutureMealInfo().dateRange}
            </ThemedText>
            <ThemedText style={styles.mealCount}>
              {getFutureMealInfo().futureMealCount} future meal{getFutureMealInfo().futureMealCount !== 1 ? 's' : ''} planned
              {getFutureMealInfo().totalMealCount > getFutureMealInfo().futureMealCount && 
                ` (${getFutureMealInfo().totalMealCount - getFutureMealInfo().futureMealCount} past meals not included)`
              }
            </ThemedText>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                loadData();
                generateShoppingList();
              }}
            >
              <ThemedText style={styles.refreshButtonText}>🔄 Refresh List</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {shoppingList.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>🛒</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyTitle}>No shopping list yet</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Your shopping list will be automatically generated from your weekly meal plan.
            </ThemedText>
            <TouchableOpacity 
              style={styles.planMealsButton}
              onPress={() => router.push('/meal-plan')}
            >
              <ThemedText style={styles.planMealsButtonText}>Plan Your Meals</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <>
            {checkedCount > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearCheckedItems}>
                <ThemedText style={styles.clearButtonText}>
                  Clear {checkedCount} completed item{checkedCount !== 1 ? 's' : ''}
                </ThemedText>
              </TouchableOpacity>
            )}

            <ThemedView style={styles.shoppingItems}>
              {CATEGORY_ORDER.filter(c => grouped[c] && grouped[c].length > 0).map(category => (
                <ThemedView key={category} style={styles.categoryBlock}>
                  <ThemedText style={styles.categoryHeading}>{category}</ThemedText>
                  {grouped[category].map((item, index) => {
                const isChecked = checkedItems[item.name.toLowerCase().trim()];
                return (
                  <TouchableOpacity
                    key={`${category}-${item.name}-${index}`}
                    style={[styles.shoppingItem, isChecked && styles.checkedItem]}
                    onPress={() => currentHistoryIndex === -1 ? toggleItem(item.name) : null}
                  >
                    <ThemedView style={styles.itemLeft}>
                      <ThemedView style={[styles.checkbox, isChecked && styles.checkedBox]}>
                        {isChecked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                      </ThemedView>
                      <ThemedView style={styles.itemDetails}>
                        <ThemedView style={styles.itemHeader}>
                          <ThemedText style={[styles.itemName, isChecked && styles.checkedText]}>
                            {item.name}
                          </ThemedText>
                          {item.isCustom && currentHistoryIndex === -1 && (
                            <TouchableOpacity 
                              style={styles.removeCustomButton}
                              onPress={() => removeCustomItem(item.name)}
                            >
                              <ThemedText style={styles.removeCustomText}>✕</ThemedText>
                            </TouchableOpacity>
                          )}
                        </ThemedView>
                        {item.amounts.length > 0 && (
                          <ThemedText style={[styles.itemAmount, isChecked && styles.checkedText]}>
                            {item.amounts.join(', ')}
                          </ThemedText>
                        )}
                        <ThemedText style={[styles.itemRecipes, isChecked && styles.checkedText]}>
                          {item.isCustom ? '🔸 Custom Item' : `For: ${item.recipes.join(', ')}`}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </TouchableOpacity>
                );
                  })}
                </ThemedView>
              ))}
            </ThemedView>
          </>
        )}
      </ThemedView>

      {/* Add Custom Item Modal */}
      <Modal
        visible={showAddCustomModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddCustomModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Add Custom Item</ThemedText>
            <TouchableOpacity 
              onPress={() => setShowAddCustomModal(false)}
              style={styles.closeButton}
            >
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.inputLabel}>Item Name *</ThemedText>
            <TextInput
              style={styles.textInput}
              value={customItemName}
              onChangeText={setCustomItemName}
              placeholder="e.g., Milk, Bread, etc."
              autoFocus
            />
            
            <ThemedText style={styles.inputLabel}>Amount (Optional)</ThemedText>
            <TextInput
              style={styles.textInput}
              value={customItemAmount}
              onChangeText={setCustomItemAmount}
              placeholder="Free text (e.g., 1 gallon, 2 loaves) or use Qty + Unit below"
            />

            {/* Qty + Unit selector */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={customQty}
                onChangeText={setCustomQty}
                placeholder="Qty"
              />
              <TouchableOpacity
                style={[styles.unitButton]}
                onPress={() => setCustomUnitPickerVisible(true)}
              >
                <ThemedText style={styles.unitButtonText}>
                  {customUnit === 'custom' ? (customCustomUnit || 'Custom') : (customUnit || 'unit')}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Unit picker modal for custom item */}
            <Modal
              visible={customUnitPickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setCustomUnitPickerVisible(false)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Select unit</ThemedText>
                  <ScrollView style={{ maxHeight: 300 }}>
                    {(['Common', 'Weight', 'Volume', 'Kitchen', 'Other'] as UnitGroup[]).map((group) => (
                      <View key={group}>
                        <ThemedText style={styles.unitGroupLabel}>{group}</ThemedText>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {UNIT_OPTIONS.filter(u => u.group === group).map((u: UnitOption) => (
                            <TouchableOpacity
                              key={u.value}
                              style={styles.unitChip}
                              onPress={() => {
                                setCustomUnit(u.value);
                                if (u.value !== 'custom') {
                                  setCustomUnitPickerVisible(false);
                                }
                              }}
                            >
                              <ThemedText style={styles.unitChipText}>{u.label}</ThemedText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Custom unit input if selected */}
                  {customUnit === 'custom' && (
                    <View style={{ marginTop: 12 }}>
                      <ThemedText style={{ marginBottom: 6 }}>Custom unit</ThemedText>
                      <TextInput
                        placeholder="e.g., bottle, bar, sachet"
                        style={styles.textInput}
                        value={customCustomUnit}
                        onChangeText={setCustomCustomUnit}
                      />
                      <TouchableOpacity
                        style={[styles.addItemButton, { marginTop: 10, alignSelf: 'flex-end' }]}
                        onPress={() => setCustomUnitPickerVisible(false)}
                      >
                        <ThemedText style={styles.addItemButtonText}>Done</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => setCustomUnitPickerVisible(false)}>
                    <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            
            <TouchableOpacity 
              style={styles.addItemButton}
              onPress={addCustomItem}
            >
              <ThemedText style={styles.addItemButtonText}>Add to List</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Shopping History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Shopping History</ThemedText>
            <TouchableOpacity 
              onPress={() => setShowHistoryModal(false)}
              style={styles.closeButton}
            >
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <ScrollView style={styles.historyList}>
            {shoppingHistory.length === 0 ? (
              <ThemedView style={styles.noHistoryContainer}>
                <ThemedText style={styles.noHistoryText}>No shopping history yet</ThemedText>
                <ThemedText style={styles.noHistorySubtext}>
                  Your shopping lists will be saved automatically each week
                </ThemedText>
              </ThemedView>
            ) : (
              shoppingHistory.map((history, index) => (
                <TouchableOpacity
                  key={history.id}
                  style={[styles.historyItem, currentHistoryIndex === index && styles.activeHistoryItem]}
                  onPress={() => loadHistoricalList(index)}
                >
                  <ThemedView style={styles.historyItemContent}>
                    <ThemedText style={styles.historyWeek}>
                      📅 {new Date(history.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(history.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </ThemedText>
                    <ThemedText style={styles.historyDetails}>
                      {history.items.length} items • {history.mealPlanSnapshot.length} meals planned
                    </ThemedText>
                    <ThemedText style={styles.historyDate}>
                      Saved: {new Date(history.dateCreated).toLocaleDateString()}
                    </ThemedText>
                  </ThemedView>
                  {currentHistoryIndex === index && (
                    <ThemedText style={styles.activeIndicator}>👀</ThemedText>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </ThemedView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: shared.screenContainer,
  header: shared.headerBar,
  backButton: shared.backButton,
  backButtonText: shared.backButtonText,
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
  content: {
    padding: 20,
  },
  weekInfo: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  mealCount: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'center',
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: '#333',
  },
  emptyDescription: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  planMealsButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  planMealsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shoppingItems: {
    gap: 12,
  },
  categoryBlock: {
    marginBottom: 28,
  },
  categoryHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#FFE0E0',
    paddingBottom: 4,
  },
  shoppingItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  checkedItem: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemAmount: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 4,
    fontWeight: '500',
  },
  itemRecipes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 15,
    backgroundColor: 'transparent',
  },
  headerButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyHeaderButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonTextLarge: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  historyBanner: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyBannerText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  returnButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  removeCustomButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeCustomText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  modalContent: {
    padding: 20,
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  addItemButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addItemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyList: {
    flex: 1,
  },
  noHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noHistorySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  historyItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeHistoryItem: {
    backgroundColor: '#f0f8ff',
  },
  historyItemContent: {
    flex: 1,
  },
  historyWeek: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  activeIndicator: {
    fontSize: 16,
    marginLeft: 10,
  },
  unitButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
    alignItems: 'center',
    marginRight: 8,
  },
  unitButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
  },
  unitGroupLabel: { fontWeight: '700', marginTop: 8, marginBottom: 6 },
  unitChip: {
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  unitChipText: { fontWeight: '600', color: '#333' },
  secondaryButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});
