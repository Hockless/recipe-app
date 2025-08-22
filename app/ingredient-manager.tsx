import { BackButton } from '@/components/BackButton';
import { INGREDIENT_DATABASE, IngredientItem } from '@/components/IngredientSearch';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { shared } from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';

export default function IngredientManagerScreen() {
  const router = useRouter();
  const [customIngredients, setCustomIngredients] = useState<IngredientItem[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<IngredientItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>([]);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientCategory, setNewIngredientCategory] = useState('Pantry');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // New: Back handler with web/no-history fallback
  const handleBack = () => {
    if ((router as any).canGoBack?.()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  useEffect(() => {
    loadCustomIngredients();
    loadCustomCategories();
  }, []);

  useEffect(() => {
    setAllIngredients([...INGREDIENT_DATABASE, ...customIngredients]);
  }, [customIngredients]);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allIngredients]);

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

  const loadCustomCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem('customCategories');
      if (stored) {
        setCustomCategories(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  const performSearch = (query: string) => {
    const searchTerm = query.toLowerCase().trim();
    
    const results = allIngredients.filter(ingredient => {
      if (ingredient.name.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      return ingredient.aliases.some(alias => 
        alias.toLowerCase().includes(searchTerm) || 
        searchTerm.includes(alias.toLowerCase())
      );
    });

    const sortedResults = results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().startsWith(searchTerm);
      const bNameMatch = b.name.toLowerCase().startsWith(searchTerm);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      return a.name.localeCompare(b.name);
    });

    setSearchResults(sortedResults);
  };

  const deleteCustomIngredient = async (ingredientId: string) => {
    Alert.alert(
      'Delete Ingredient',
      'Are you sure you want to delete this custom ingredient?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = customIngredients.filter(ing => ing.id !== ingredientId);
            setCustomIngredients(updated);
            try {
              await AsyncStorage.setItem('customIngredients', JSON.stringify(updated));
            } catch (error) {
              console.error('Error deleting ingredient:', error);
            }
          }
        }
      ]
    );
  };

  const addCustomIngredient = async () => {
    const name = newIngredientName.trim();
    if (!name) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }

    // Check if ingredient already exists (case insensitive)
    const existingIngredient = allIngredients.find(
      ing => ing.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingIngredient) {
      Alert.alert('Already Exists', `"${name}" already exists in the database`);
      return;
    }

    const newIngredient: IngredientItem = {
      id: `custom-${Date.now()}`,
      name: name,
      category: newIngredientCategory,
      aliases: [],
      customAdded: true
    };

    const updated = [...customIngredients, newIngredient];
    setCustomIngredients(updated);
    
    try {
      await AsyncStorage.setItem('customIngredients', JSON.stringify(updated));
      setNewIngredientName('');
      setShowAddForm(false);
      Alert.alert('Success!', `Added "${name}" to your ingredient database`);
    } catch (error) {
      console.error('Error saving custom ingredient:', error);
      Alert.alert('Error', 'Failed to save ingredient');
    }
  };

  const addCustomCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const allCategories = [...categories, ...customCategories];
    if (allCategories.some(cat => cat.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Already Exists', `Category "${name}" already exists`);
      return;
    }

    const updated = [...customCategories, name];
    setCustomCategories(updated);
    
    try {
      await AsyncStorage.setItem('customCategories', JSON.stringify(updated));
      setNewCategoryName('');
      setShowCategoryForm(false);
      Alert.alert('Success!', `Added category "${name}"`);
    } catch (error) {
      console.error('Error saving custom category:', error);
      Alert.alert('Error', 'Failed to save category');
    }
  };

  const deleteCustomCategory = async (categoryName: string) => {
    // Check if any custom ingredients use this category
    const ingredientsUsingCategory = customIngredients.filter(ing => ing.category === categoryName);
    
    if (ingredientsUsingCategory.length > 0) {
      Alert.alert(
        'Cannot Delete',
        `Category "${categoryName}" is being used by ${ingredientsUsingCategory.length} ingredient(s). Please reassign or delete those ingredients first.`
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the category "${categoryName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = customCategories.filter(cat => cat !== categoryName);
            setCustomCategories(updated);
            try {
              await AsyncStorage.setItem('customCategories', JSON.stringify(updated));
            } catch (error) {
              console.error('Error deleting category:', error);
            }
          }
        }
      ]
    );
  };

  const deleteBuiltInIngredient = (ingredientId: string) => {
    Alert.alert(
      'Cannot Delete',
      'Built-in ingredients cannot be deleted. You can only delete custom ingredients that you have added.'
    );
  };

  const categories = ['Vegetables', 'Fruits', 'Meat & Poultry', 'Dairy', 'Pantry', 'Herbs & Spices', 'Canned', 'Grains', 'Nuts & Seeds'];
  const allCategories = [...categories, ...customCategories];

  const renderIngredientItem = ({ item }: { item: IngredientItem }) => (
    <ThemedView style={styles.ingredientCard}>
      <ThemedView style={styles.ingredientInfo}>
        <ThemedText style={styles.ingredientName}>{item.name}</ThemedText>
        <ThemedText style={styles.ingredientCategory}>{item.category}</ThemedText>
        {item.aliases.length > 0 && (
          <ThemedText style={styles.ingredientAliases}>
            Also matches: {item.aliases.join(', ')}
          </ThemedText>
        )}
      </ThemedView>
      <ThemedView style={styles.ingredientActions}>
        {item.customAdded && (
          <ThemedView style={styles.customBadge}>
            <ThemedText style={styles.customBadgeText}>Custom</ThemedText>
          </ThemedView>
        )}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            !item.customAdded && styles.disabledDeleteButton
          ]}
          onPress={() => item.customAdded ? deleteCustomIngredient(item.id) : deleteBuiltInIngredient(item.id)}
        >
          <ThemedText style={[
            styles.deleteButtonText,
            !item.customAdded && styles.disabledDeleteButtonText
          ]}>
            {item.customAdded ? 'Delete' : 'Built-in'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  // Removed unused handleIngredientSelect function

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <BackButton onPress={handleBack} />
        <ThemedText type="title" style={styles.title}>Ingredient Database</ThemedText>
        <ThemedText style={styles.subtitle}>
          Smart search with fuzzy matching - try typing &quot;car&quot; to find carrot!
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.searchSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
             Browse All Ingredients
          </ThemedText>
          <TextInput
            style={styles.searchInput}
            placeholder="Search all ingredients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </ThemedView>

        <ThemedView style={styles.addSection}>
          <ThemedView style={styles.addHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              ➕ Add Custom Ingredient
            </ThemedText>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <ThemedText style={styles.toggleButtonText}>
                {showAddForm ? '✕ Cancel' : '+ Add New'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {showAddForm && (
            <ThemedView style={styles.addForm}>
              <TextInput
                style={styles.addInput}
                placeholder="Enter ingredient name..."
                value={newIngredientName}
                onChangeText={setNewIngredientName}
                placeholderTextColor="#999"
              />
              
              <ThemedView style={styles.categorySelector}>
                <ThemedText style={styles.categoryLabel}>Category:</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {allCategories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        newIngredientCategory === category && styles.categoryChipSelected
                      ]}
                      onPress={() => setNewIngredientCategory(category)}
                    >
                      <ThemedText style={[
                        styles.categoryChipText,
                        newIngredientCategory === category && styles.categoryChipTextSelected
                      ]}>
                        {category}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </ThemedView>

              <TouchableOpacity
                style={styles.addButton}
                onPress={addCustomIngredient}
              >
                <ThemedText style={styles.addButtonText}>
                  ✓ Add Ingredient
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.addSection}>
          <ThemedView style={styles.addHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              🏷️ Manage Categories
            </ThemedText>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowCategoryForm(!showCategoryForm)}
            >
              <ThemedText style={styles.toggleButtonText}>
                {showCategoryForm ? '✕ Cancel' : '+ Add Category'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {showCategoryForm && (
            <ThemedView style={styles.addForm}>
              <TextInput
                style={styles.addInput}
                placeholder="Enter category name..."
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholderTextColor="#999"
              />
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={addCustomCategory}
              >
                <ThemedText style={styles.addButtonText}>
                  ✓ Add Category
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}

          {customCategories.length > 0 && (
            <ThemedView style={styles.customCategoriesContainer}>
              <ThemedText style={styles.categorySubtitle}>Your Custom Categories:</ThemedText>
              <ThemedView style={styles.customCategoriesList}>
                {customCategories.map(category => (
                  <ThemedView key={category} style={styles.customCategoryItem}>
                    <ThemedText style={styles.customCategoryText}>{category}</ThemedText>
                    <TouchableOpacity
                      style={styles.deleteCategoryButton}
                      onPress={() => deleteCustomCategory(category)}
                    >
                      <ThemedText style={styles.deleteCategoryButtonText}>✕</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.statsSection}>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{INGREDIENT_DATABASE.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Built-in Ingredients</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{customIngredients.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Custom Ingredients</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{allIngredients.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Available</ThemedText>
          </ThemedView>
        </ThemedView>

        {searchQuery ? (
          <ThemedView style={styles.resultsSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Search Results ({searchResults.length})
            </ThemedText>
            <FlatList
              data={searchResults}
              renderItem={renderIngredientItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </ThemedView>
        ) : (
          <>
            {customIngredients.length > 0 && (
              <ThemedView style={styles.customIngredientsSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  🌟 Your Custom Ingredients
                </ThemedText>
                <FlatList
                  data={customIngredients}
                  renderItem={renderIngredientItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </ThemedView>
            )}

            <ThemedView style={styles.categoriesSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                📚 All Categories
              </ThemedText>
              {allCategories.map(category => {
                const categoryItems = allIngredients.filter(item => item.category === category);
                const isCustomCategory = customCategories.includes(category);
                
                if (categoryItems.length === 0 && !isCustomCategory) return null;
                
                return (
                  <ThemedView key={category} style={styles.categoryCard}>
                    <ThemedView style={styles.categoryHeader}>
                      <ThemedText style={styles.categoryName}>
                        {category} ({categoryItems.length} items)
                        {isCustomCategory && <ThemedText style={styles.customCategoryBadge}> • Custom</ThemedText>}
                      </ThemedText>
                      {isCustomCategory && (
                        <TouchableOpacity
                          style={styles.deleteCategoryIconButton}
                          onPress={() => deleteCustomCategory(category)}
                        >
                          <ThemedText style={styles.deleteCategoryIconText}>✕</ThemedText>
                        </TouchableOpacity>
                      )}
                    </ThemedView>
                    {categoryItems.length > 0 && (
                      <ThemedText style={styles.categoryItems}>
                        {categoryItems.slice(0, 5).map(item => item.name).join(', ')}
                        {categoryItems.length > 5 && '...'}
                      </ThemedText>
                    )}
                  </ThemedView>
                );
              })}
            </ThemedView>
          </>
        )}

        <ThemedView style={styles.infoSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ℹ️ How Smart Search Works
          </ThemedText>
          <ThemedView style={styles.infoCard}>
            <ThemedText style={styles.infoText}>
              • Type partial words: &quot;car&quot; finds &quot;carrot&quot;
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Fuzzy matching: &quot;pot&quot; finds &quot;potato&quot; 
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Aliases: &quot;spud&quot; also finds &quot;potato&quot;
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Add custom ingredients that don&apos;t exist
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Categories help organize your shopping
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
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
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  searchSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  searchDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  resultsSection: {
    marginBottom: 30,
  },
  ingredientCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ingredientCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ingredientAliases: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  customBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  customBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 30,
  },
  categoryCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  categoryItems: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoSection: {
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 5,
    lineHeight: 20,
  },
  addSection: {
    marginBottom: 30,
  },
  addHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  addInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  categorySelector: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryChipSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  customIngredientsSection: {
    marginBottom: 30,
  },
  ingredientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledDeleteButton: {
    backgroundColor: '#e9ecef',
    borderColor: '#dee2e6',
  },
  disabledDeleteButtonText: {
    color: '#6c757d',
  },
  customCategoriesContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categorySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  customCategoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 8,
    marginBottom: 8,
  },
  customCategoryText: {
    fontSize: 12,
    color: '#333',
    marginRight: 6,
  },
  deleteCategoryButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deleteCategoryButtonText: {
    fontSize: 10,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  customCategoryBadge: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  deleteCategoryIconButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#fff2f2',
  },
  deleteCategoryIconText: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: 'bold',
  },
});
