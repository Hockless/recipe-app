import { BackButton } from '@/components/BackButton';
import { shared } from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
  tags?: string[];
  serves?: number;
}

export default function BrowseRecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string>('All'); // 'All' | 'Keto' | 'Mediterranean'
  // New: search query
  const [searchQuery, setSearchQuery] = useState('');

  // New: Back handler with web/no-history fallback
  const handleBack = () => {
    if ((router as any).canGoBack?.()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const loadRecipes = async () => {
    try {
      const storedRecipes = await AsyncStorage.getItem('recipes');
      if (storedRecipes) {
        const parsedRecipes = JSON.parse(storedRecipes);
        setRecipes(parsedRecipes.sort((a: Recipe, b: Recipe) => 
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        ));
      }
    } catch {
      // Silently fail loading recipes
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isSeedRecipe = (id: string) => String(id).startsWith('seed-');

  // Extract actual deletion into a helper so we can call it from both mobile (Alert) and web (confirm)
  const performRecipeDeletion = async (recipeId: string) => {
    try {
      if (isSeedRecipe(recipeId)) {
        // Guard: seeded recipes cannot be deleted
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert('Built-in recipes cannot be deleted.');
          }
        } else {
          Alert.alert('Not allowed', 'Built-in recipes cannot be deleted.');
        }
        return;
      }
      const storedRecipes = await AsyncStorage.getItem('recipes');
      if (!storedRecipes) return;
      const parsedRecipes = JSON.parse(storedRecipes) as Recipe[];

      // Normalize to string on both sides to handle numeric IDs that may have been saved previously
      const updatedRecipes = parsedRecipes.filter((r) => String(r.id) !== String(recipeId));

      await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
    } catch {
      Alert.alert('Error', 'Failed to delete recipe. Please try again.');
    }
  };

  const deleteRecipe = async (recipeId: string, recipeTitle: string) => {
    if (isSeedRecipe(recipeId)) {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('Built-in recipes cannot be deleted.');
        }
      } else {
        Alert.alert('Not allowed', 'Built-in recipes cannot be deleted.');
      }
      return;
    }
    if (Platform.OS === 'web') {
      // React Native Web: use window.confirm to get a Yes/No dialog on web.
      const confirmed = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(`Are you sure you want to delete "${recipeTitle}"? This action cannot be undone.`)
        : true; // If confirm is not available, default to true
      if (confirmed) {
        await performRecipeDeletion(recipeId);
      }
      return;
    }

    // Native platforms: use Alert with buttons
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipeTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { void performRecipeDeletion(recipeId); } },
      ]
    );
  };

  const editRecipe = (recipe: Recipe) => {
    if (isSeedRecipe(recipe.id)) {
      router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } });
      return;
    }
    router.push({
      pathname: '/add-recipe',
      params: { 
        editMode: 'true',
        recipeId: recipe.id,
        recipeData: JSON.stringify(recipe)
      }
    });
  };

  // Tag filter first
  const tagFiltered = activeTagFilter === 'All'
    ? recipes
    : recipes.filter(r => r.tags && r.tags.includes(activeTagFilter));

  // Apply search (case-insensitive) across title + ingredient names
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRecipes = normalizedQuery
    ? tagFiltered.filter(r => {
        if (r.title.toLowerCase().includes(normalizedQuery)) return true;
        return r.ingredients.some(ing => ing.name.toLowerCase().includes(normalizedQuery));
      })
    : tagFiltered;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.header}>
        <BackButton onPress={handleBack} />
        <ThemedText type="title" style={styles.title}>Your Recipes</ThemedText>
        <ThemedText style={styles.subtitle}>
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} saved
        </ThemedText>
        {/* New: quick header action to add a recipe */}
        <ThemedView style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/add-recipe')}
          >
            <ThemedText style={styles.headerButtonText}>＋ Add Recipe</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.content}>
        {/* Search area */}
        <View style={styles.searchFieldContainer}>
          <View style={styles.searchFieldInner}>
            <View style={styles.searchIconHolder}>
              <ThemedText style={styles.searchIcon}>🔍</ThemedText>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes or ingredients..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
              accessibilityLabel="Search recipes"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton} accessibilityLabel="Clear search">
                <ThemedText style={styles.clearButtonText}>✕</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          {searchQuery.length > 0 && (
            <ThemedText style={styles.searchMeta}>{filteredRecipes.length} match{filteredRecipes.length !== 1 ? 'es' : ''}</ThemedText>
          )}
        </View>
        <ThemedView style={styles.filterBar}>
          {['All','Keto','Mediterranean'].map(tag => {
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
          <ThemedText style={styles.filterInfo}>Showing {filteredRecipes.length} {activeTagFilter} recipe{filteredRecipes.length !== 1 ? 's' : ''}</ThemedText>
        )}
        {recipes.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>📝</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyTitle}>No recipes yet</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Start creating your recipe collection by adding your first recipe!
            </ThemedText>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => router.push('/add-recipe')}
            >
              <ThemedText style={styles.addFirstButtonText}>Add Your First Recipe</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          filteredRecipes.map((recipe) => (
            <TouchableOpacity key={recipe.id} activeOpacity={0.8} onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}>
            <ThemedView style={styles.recipeCard}>
              <ThemedView style={styles.recipeHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={styles.recipeTitle}>
                    {recipe.title}
                  </ThemedText>
                </View>
                <ThemedView style={styles.actionButtons}>
                  {!isSeedRecipe(recipe.id) ? (
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => { editRecipe(recipe); }}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.editButtonText}>✏️ Edit</ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.viewButtonText}>👁 View</ThemedText>
                    </TouchableOpacity>
                  )}
                  {!isSeedRecipe(recipe.id) && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        deleteRecipe(recipe.id, recipe.title);
                      }}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
                    </TouchableOpacity>
                  )}
                </ThemedView>
              </ThemedView>
              
              <ThemedText style={styles.recipeDate}>
                Created: {formatDate(recipe.dateCreated)}
              </ThemedText>
              {!!recipe.serves && (
                <ThemedText style={styles.servesText}>
                  Serves: {recipe.serves}
                </ThemedText>
              )}
              
              <ThemedText style={styles.ingredientsLabel}>
                Ingredients ({recipe.ingredients.length}):
              </ThemedText>
              
              <ThemedView style={styles.ingredientsList}>
                {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                  <ThemedText key={ingredient.id} style={styles.ingredientItem}>
                    • {ingredient.name} {ingredient.amount && `- ${ingredient.amount}`}
                  </ThemedText>
                ))}
                {recipe.ingredients.length > 3 && (
                  <ThemedText style={styles.moreIngredients}>
                    +{recipe.ingredients.length - 3} more ingredients...
                  </ThemedText>
                )}
              </ThemedView>

              {/* Instructions preview removed to simplify card UI */}
              {(isSeedRecipe(recipe.id) || (recipe.tags && recipe.tags.length > 0)) && (
                <ThemedView style={styles.tagRow}>
                  {isSeedRecipe(recipe.id) && (
                    <ThemedView style={styles.builtInBadge}>
                      <ThemedText style={styles.builtInBadgeText}>Built-in</ThemedText>
                    </ThemedView>
                  )}
                  {recipe.tags?.map(t => (
                    <ThemedView key={t} style={[styles.tagPill, t === 'Keto' ? styles.tagKeto : t === 'Mediterranean' ? styles.tagMed : null]}>
                      <ThemedText style={styles.tagText}>{t}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              )}
            </ThemedView>
            </TouchableOpacity>
          ))
        )}
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
    marginBottom: 5,
  },
  servesText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  // New styles
  headerActions: {
    marginTop: 12,
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 20,
  },
  // Search styles
  searchFieldContainer: {
    marginBottom: 18,
  },
  searchFieldInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  searchIconHolder: {
    marginRight: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 15,
    color: '#222',
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#444',
  },
  searchMeta: {
    marginTop: 6,
    fontSize: 11,
    color: '#555',
    paddingLeft: 4,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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
    marginBottom: 10,
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
  addFirstButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipeCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 18,
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  recipeDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  ingredientsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  ingredientsList: {
    paddingLeft: 10,
    marginBottom: 15,
  },
  ingredientItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  moreIngredients: {
    fontSize: 14,
    color: '#FF6B6B',
    fontStyle: 'italic',
    marginTop: 5,
  },
  // Instructions preview styles removed
  builtInBadge: {
    backgroundColor: '#ffe0e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  builtInBadgeText: {
    fontSize: 11,
    color: '#d94848',
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tagPill: { backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  tagText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, color: '#334155' },
  tagKeto: { backgroundColor: '#d1fae5' },
  tagMed: { backgroundColor: '#ffe4e6' },
});
