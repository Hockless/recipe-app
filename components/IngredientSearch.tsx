import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './ThemedText';

// Comprehensive ingredient database with aliases for smart search
export const INGREDIENT_DATABASE = [
  // Vegetables
  { id: 'carrot', name: 'Carrot', category: 'Vegetables', aliases: ['car', 'carrots'] },
  { id: 'potato', name: 'Potato', category: 'Vegetables', aliases: ['pot', 'potatoes', 'spud', 'spuds'] },
  { id: 'sweet-potato', name: 'Sweet Potato', category: 'Vegetables', aliases: ['sweet pot', 'yam'] },
  { id: 'onion', name: 'Onion', category: 'Vegetables', aliases: ['onions', 'oni'] },
  { id: 'garlic', name: 'Garlic', category: 'Vegetables', aliases: ['gar', 'garlic clove', 'cloves'] },
  { id: 'tomato', name: 'Tomato', category: 'Vegetables', aliases: ['tom', 'tomatoes', 'tomato'] },
  { id: 'lettuce', name: 'Lettuce', category: 'Vegetables', aliases: ['lett', 'salad leaves', 'greens'] },
  { id: 'cucumber', name: 'Cucumber', category: 'Vegetables', aliases: ['cuke', 'cucumbers', 'cuc'] },
  { id: 'bell-pepper', name: 'Bell Pepper', category: 'Vegetables', aliases: ['pepper', 'capsicum', 'bell', 'peppers'] },
  { id: 'broccoli', name: 'Broccoli', category: 'Vegetables', aliases: ['broc', 'brocoli'] },
  { id: 'cauliflower', name: 'Cauliflower', category: 'Vegetables', aliases: ['cauli', 'caulie'] },
  { id: 'spinach', name: 'Spinach', category: 'Vegetables', aliases: ['spin', 'spinich'] },
  { id: 'kale', name: 'Kale', category: 'Vegetables', aliases: ['kal'] },
  { id: 'mushroom', name: 'Mushroom', category: 'Vegetables', aliases: ['mushrooms', 'mush', 'button mushroom'] },
  { id: 'zucchini', name: 'Zucchini', category: 'Vegetables', aliases: ['courgette', 'zuc'] },
  { id: 'eggplant', name: 'Eggplant', category: 'Vegetables', aliases: ['aubergine', 'egg'] },
  { id: 'celery', name: 'Celery', category: 'Vegetables', aliases: ['cel'] },
  { id: 'asparagus', name: 'Asparagus', category: 'Vegetables', aliases: ['asp'] },
  
  // Fruits
  { id: 'apple', name: 'Apple', category: 'Fruits', aliases: ['apples', 'app'] },
  { id: 'banana', name: 'Banana', category: 'Fruits', aliases: ['bananas', 'ban'] },
  { id: 'orange', name: 'Orange', category: 'Fruits', aliases: ['oranges', 'ora'] },
  { id: 'lemon', name: 'Lemon', category: 'Fruits', aliases: ['lemons', 'lem'] },
  { id: 'lime', name: 'Lime', category: 'Fruits', aliases: ['limes', 'lim'] },
  { id: 'strawberry', name: 'Strawberry', category: 'Fruits', aliases: ['strawberries', 'straw', 'berry'] },
  { id: 'blueberry', name: 'Blueberry', category: 'Fruits', aliases: ['blueberries', 'blue', 'berries'] },
  { id: 'avocado', name: 'Avocado', category: 'Fruits', aliases: ['avocados', 'avo'] },
  { id: 'pineapple', name: 'Pineapple', category: 'Fruits', aliases: ['pine'] },
  { id: 'mango', name: 'Mango', category: 'Fruits', aliases: ['mangoes', 'man'] },
  
  // Meat & Poultry
  { id: 'chicken-breast', name: 'Chicken Breast', category: 'Meat & Poultry', aliases: ['chicken', 'chick', 'breast'] },
  { id: 'chicken-thigh', name: 'Chicken Thigh', category: 'Meat & Poultry', aliases: ['thigh', 'chicken thighs'] },
  { id: 'beef-mince', name: 'Beef Mince', category: 'Meat & Poultry', aliases: ['ground beef', 'mince', 'beef', 'hamburger'] },
  { id: 'pork', name: 'Pork', category: 'Meat & Poultry', aliases: ['pork chops', 'por'] },
  { id: 'salmon', name: 'Salmon', category: 'Meat & Poultry', aliases: ['fish', 'sal'] },
  { id: 'tuna', name: 'Tuna', category: 'Meat & Poultry', aliases: ['tun'] },
  { id: 'bacon', name: 'Bacon', category: 'Meat & Poultry', aliases: ['bac'] },
  { id: 'ham', name: 'Ham', category: 'Meat & Poultry', aliases: ['h'] },
  { id: 'turkey', name: 'Turkey', category: 'Meat & Poultry', aliases: ['tur'] },
  
  // Dairy
  { id: 'milk', name: 'Milk', category: 'Dairy', aliases: ['dairy milk', 'mil'] },
  { id: 'cheese', name: 'Cheese', category: 'Dairy', aliases: ['cheddar', 'che'] },
  { id: 'butter', name: 'Butter', category: 'Dairy', aliases: ['butt', 'but'] },
  { id: 'eggs', name: 'Eggs', category: 'Dairy', aliases: ['egg', 'eg'] },
  { id: 'yogurt', name: 'Yogurt', category: 'Dairy', aliases: ['yog', 'yoghurt', 'yog'] },
  { id: 'cream', name: 'Cream', category: 'Dairy', aliases: ['heavy cream', 'cre'] },
  { id: 'sour-cream', name: 'Sour Cream', category: 'Dairy', aliases: ['sour', 'cream'] },
  { id: 'mozzarella', name: 'Mozzarella', category: 'Dairy', aliases: ['mozz', 'moz'] },
  
  // Pantry Staples
  { id: 'rice', name: 'Rice', category: 'Pantry', aliases: ['basmati', 'jasmine rice', 'ric'] },
  { id: 'pasta', name: 'Pasta', category: 'Pantry', aliases: ['spaghetti', 'penne', 'pas'] },
  { id: 'bread', name: 'Bread', category: 'Pantry', aliases: ['loaf', 'bre'] },
  { id: 'flour', name: 'Flour', category: 'Pantry', aliases: ['plain flour', 'flo'] },
  { id: 'olive-oil', name: 'Olive Oil', category: 'Pantry', aliases: ['oil', 'EVOO', 'olive'] },
  { id: 'vegetable-oil', name: 'Vegetable Oil', category: 'Pantry', aliases: ['veg oil', 'cooking oil'] },
  { id: 'salt', name: 'Salt', category: 'Pantry', aliases: ['table salt', 'sal'] },
  { id: 'pepper', name: 'Black Pepper', category: 'Pantry', aliases: ['pepper', 'ground pepper', 'pep'] },
  { id: 'sugar', name: 'Sugar', category: 'Pantry', aliases: ['white sugar', 'sug'] },
  { id: 'brown-sugar', name: 'Brown Sugar', category: 'Pantry', aliases: ['brown', 'demerara'] },
  { id: 'honey', name: 'Honey', category: 'Pantry', aliases: ['hon'] },
  { id: 'vinegar', name: 'Vinegar', category: 'Pantry', aliases: ['white vinegar', 'vin'] },
  { id: 'baking-powder', name: 'Baking Powder', category: 'Pantry', aliases: ['baking', 'powder'] },
  { id: 'baking-soda', name: 'Baking Soda', category: 'Pantry', aliases: ['soda', 'bicarbonate'] },
  
  // Herbs & Spices
  { id: 'basil', name: 'Basil', category: 'Herbs & Spices', aliases: ['fresh basil', 'bas'] },
  { id: 'oregano', name: 'Oregano', category: 'Herbs & Spices', aliases: ['dried oregano', 'ore'] },
  { id: 'thyme', name: 'Thyme', category: 'Herbs & Spices', aliases: ['fresh thyme', 'thy'] },
  { id: 'rosemary', name: 'Rosemary', category: 'Herbs & Spices', aliases: ['fresh rosemary', 'ros'] },
  { id: 'parsley', name: 'Parsley', category: 'Herbs & Spices', aliases: ['par', 'fresh parsley'] },
  { id: 'cilantro', name: 'Cilantro', category: 'Herbs & Spices', aliases: ['coriander', 'cil'] },
  { id: 'cumin', name: 'Cumin', category: 'Herbs & Spices', aliases: ['cum'] },
  { id: 'paprika', name: 'Paprika', category: 'Herbs & Spices', aliases: ['pap'] },
  { id: 'chili-powder', name: 'Chili Powder', category: 'Herbs & Spices', aliases: ['chili', 'chi'] },
  { id: 'garlic-powder', name: 'Garlic Powder', category: 'Herbs & Spices', aliases: ['garlic', 'powder'] },
  { id: 'onion-powder', name: 'Onion Powder', category: 'Herbs & Spices', aliases: ['onion', 'powder'] },
  
  // Canned/Packaged
  { id: 'canned-tomatoes', name: 'Canned Tomatoes', category: 'Canned', aliases: ['tinned tomatoes', 'chopped tomatoes', 'canned'] },
  { id: 'coconut-milk', name: 'Coconut Milk', category: 'Canned', aliases: ['coconut cream', 'coconut'] },
  { id: 'chickpeas', name: 'Chickpeas', category: 'Canned', aliases: ['garbanzo beans', 'canned chickpeas', 'chick'] },
  { id: 'black-beans', name: 'Black Beans', category: 'Canned', aliases: ['beans', 'black'] },
  { id: 'kidney-beans', name: 'Kidney Beans', category: 'Canned', aliases: ['kidney', 'red beans'] },
  { id: 'corn', name: 'Corn', category: 'Canned', aliases: ['sweetcorn', 'canned corn', 'cor'] },
  { id: 'tuna-can', name: 'Canned Tuna', category: 'Canned', aliases: ['tuna', 'tinned tuna'] },
  
  // Grains & Legumes
  { id: 'quinoa', name: 'Quinoa', category: 'Grains', aliases: ['qui'] },
  { id: 'oats', name: 'Oats', category: 'Grains', aliases: ['rolled oats', 'oat'] },
  { id: 'barley', name: 'Barley', category: 'Grains', aliases: ['bar'] },
  { id: 'lentils', name: 'Lentils', category: 'Grains', aliases: ['red lentils', 'len'] },
  { id: 'split-peas', name: 'Split Peas', category: 'Grains', aliases: ['peas', 'split'] },
  
  // Nuts & Seeds
  { id: 'almonds', name: 'Almonds', category: 'Nuts & Seeds', aliases: ['almond', 'alm'] },
  { id: 'walnuts', name: 'Walnuts', category: 'Nuts & Seeds', aliases: ['walnut', 'wal'] },
  { id: 'peanuts', name: 'Peanuts', category: 'Nuts & Seeds', aliases: ['peanut', 'pea'] },
  { id: 'cashews', name: 'Cashews', category: 'Nuts & Seeds', aliases: ['cashew', 'cas'] },
  { id: 'sunflower-seeds', name: 'Sunflower Seeds', category: 'Nuts & Seeds', aliases: ['sunflower', 'seeds'] },
];

export interface IngredientItem {
  id: string;
  name: string;
  category: string;
  aliases: string[];
  customAdded?: boolean;
}

interface IngredientSearchProps {
  onSelectIngredient: (ingredient: IngredientItem) => void;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

export default function IngredientSearch({ onSelectIngredient, placeholder = "Search ingredients...", value = "", onChangeText }: IngredientSearchProps) {
  const [searchText, setSearchText] = useState(value);
  const [searchResults, setSearchResults] = useState<IngredientItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [customIngredients, setCustomIngredients] = useState<IngredientItem[]>([]);
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>(INGREDIENT_DATABASE);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    loadCustomIngredients();
  }, []);

  useEffect(() => {
    setSearchText(value);
  }, [value]);

  useEffect(() => {
    setAllIngredients([...INGREDIENT_DATABASE, ...customIngredients]);
  }, [customIngredients]);

  useEffect(() => {
    const hasText = searchText.trim().length > 0;
    if (hasText && isFocused) {
      performSearch(searchText);
      setShowResults(true);
    } else {
      if (!hasText) setSearchResults([]);
      setShowResults(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, allIngredients, isFocused]);

  const loadCustomIngredients = async () => {
    try {
      const stored = await AsyncStorage.getItem('customIngredients');
      if (stored) {
        setCustomIngredients(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading custom ingredients:', error);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const performSearch = (query: string) => {
    const searchTerm = query.toLowerCase().trim();
    
    const results = allIngredients.filter(ingredient => {
      // Exact name match (highest priority)
      if (ingredient.name.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Alias match (fuzzy search)
      return ingredient.aliases.some(alias => 
        alias.toLowerCase().includes(searchTerm) || 
        searchTerm.includes(alias.toLowerCase())
      );
    });

    // Sort results by relevance
    const sortedResults = results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().startsWith(searchTerm);
      const bNameMatch = b.name.toLowerCase().startsWith(searchTerm);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      return a.name.localeCompare(b.name);
    });

    setSearchResults(sortedResults.slice(0, 10)); // Limit to 10 results
  };

  const handleSelectIngredient = (ingredient: IngredientItem) => {
    setSearchText(ingredient.name);
    setShowResults(false);
    onSelectIngredient(ingredient);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding results to allow for selection
    setTimeout(() => setShowResults(false), 200);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (searchText.trim().length > 0) {
      performSearch(searchText);
      setShowResults(true);
    }
  };

  const addCustomIngredient = async () => {
    if (searchText.trim().length === 0) return;
    
    const newIngredient: IngredientItem = {
      id: `custom-${Date.now()}`,
      name: searchText.trim(),
      category: 'Custom',
      aliases: [searchText.toLowerCase().trim()],
      customAdded: true,
    };

    const updatedCustom = [...customIngredients, newIngredient];
    setCustomIngredients(updatedCustom);
    
    try {
      await AsyncStorage.setItem('customIngredients', JSON.stringify(updatedCustom));
    } catch (error) {
      console.error('Error saving custom ingredient:', error);
    }

    handleSelectIngredient(newIngredient);
  };

  const renderIngredientItem = ({ item }: { item: IngredientItem }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectIngredient(item)}
    >
      <View style={styles.resultContent}>
        <ThemedText style={styles.ingredientName}>{item.name}</ThemedText>
        <ThemedText style={styles.ingredientCategory}>{item.category}</ThemedText>
      </View>
      {item.customAdded && (
        <View style={styles.customBadge}>
          <ThemedText style={styles.customBadgeText}>Custom</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={searchText}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor="#999"
      />

      {showResults && (
        <View style={styles.resultsContainer}>
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderIngredientItem}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <TouchableOpacity
              style={styles.addCustomButton}
              onPress={addCustomIngredient}
            >
              <ThemedText style={styles.addCustomText}>
                Add &quot;{searchText}&quot; as custom ingredient
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 9999,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    zIndex: 10000,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 10001,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultContent: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  ingredientCategory: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  customBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  customBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  addCustomButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  addCustomText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
