import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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

export default function BrowseRecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
    // Navigate to add-recipe page with editing mode
    router.push({
      pathname: '/add-recipe',
      params: { 
        editMode: 'true',
        recipeId: recipe.id,
        recipeData: JSON.stringify(recipe)
      }
    });
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
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
          recipes.map((recipe) => (
            <ThemedView key={recipe.id} style={styles.recipeCard}>
              <ThemedView style={styles.recipeHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={styles.recipeTitle}>
                    {recipe.title}
                  </ThemedText>
                  {isSeedRecipe(recipe.id) && (
                    <ThemedView style={styles.builtInBadge}>
                      <ThemedText style={styles.builtInBadgeText}>Built-in</ThemedText>
                    </ThemedView>
                  )}
                </View>
                <ThemedView style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                      editRecipe(recipe);
                    }}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.editButtonText}>✏️ Edit</ThemedText>
                  </TouchableOpacity>
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

              {recipe.instructions && (
                <ThemedView style={styles.instructionsPreview}>
                  <ThemedText style={styles.instructionsLabel}>Instructions:</ThemedText>
                  <ThemedText style={styles.instructionsText}>
                    {recipe.instructions.length > 100 
                      ? `${recipe.instructions.substring(0, 100)}...` 
                      : recipe.instructions}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          ))
        )}
      </ThemedView>
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
    padding: 20,
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
  instructionsPreview: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  builtInBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  builtInBadgeText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
