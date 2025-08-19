import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

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
  id: string;
  date: string;
  recipeId: string;
  recipeTitle: string;
}

export default function RandomMealPlanScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<MealPlan[]>([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const storedRecipes = await AsyncStorage.getItem('recipes');
      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    return weekDates;
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getRandomRecipes = (count: number) => {
    if (recipes.length === 0) return [];
    
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, recipes.length));
  };

  const generateRandomMealPlan = async () => {
    if (recipes.length === 0) {
      Alert.alert('No Recipes', 'Please add some recipes first before generating a meal plan.');
      return;
    }

    setLoading(true);
    
    try {
      const weekDates = getWeekDates();
      const randomRecipes = getRandomRecipes(7);
      
      const newMealPlan: MealPlan[] = weekDates.map((date, index) => {
        const recipe = randomRecipes[index % randomRecipes.length];
        return {
          id: `${date}-${recipe.id}`,
          date: date,
          recipeId: recipe.id,
          recipeTitle: recipe.title
        };
      });

      setGeneratedPlan(newMealPlan);
      
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  const saveMealPlan = async () => {
    if (generatedPlan.length === 0) {
      Alert.alert('No Plan', 'Generate a meal plan first');
      return;
    }

    try {
      setLoading(true);
      await AsyncStorage.setItem('mealPlan', JSON.stringify(generatedPlan));
      Alert.alert(
        'Success!', 
        'Random meal plan saved successfully!',
        [
          {
            text: 'View Meal Plan',
            onPress: () => router.push('/meal-plan')
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error saving meal plan:', error);
      Alert.alert('Error', 'Failed to save meal plan');
    } finally {
      setLoading(false);
    }
  };

  const regeneratePlan = () => {
    Alert.alert(
      'Regenerate Plan',
      'This will create a new random meal plan. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: generateRandomMealPlan }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>🎲 Random Meal Plan</ThemedText>
        <ThemedText style={styles.subtitle}>
          Automatically generate a week of delicious meals
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.infoText}>
          📊 Available Recipes: {recipes.length}
        </ThemedText>
        {recipes.length === 0 && (
          <ThemedText style={styles.warningText}>
            ⚠️ Add some recipes first to generate a meal plan
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.generateButton]} 
          onPress={generateRandomMealPlan}
          disabled={loading || recipes.length === 0}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? '🎲 Generating...' : '🎲 Generate Random Plan'}
          </ThemedText>
        </TouchableOpacity>

        {generatedPlan.length > 0 && (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.regenerateButton]} 
              onPress={regeneratePlan}
              disabled={loading}
            >
              <ThemedText style={styles.buttonText}>
                🔄 Regenerate Plan
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={saveMealPlan}
              disabled={loading}
            >
              <ThemedText style={styles.buttonText}>
                💾 Save This Plan
              </ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>

      {generatedPlan.length > 0 && (
        <ThemedView style={styles.previewContainer}>
          <ThemedText type="subtitle" style={styles.previewTitle}>
            📅 Generated Meal Plan Preview
          </ThemedText>
          
          {generatedPlan.map((meal, index) => (
            <ThemedView key={meal.id} style={styles.mealItem}>
              <ThemedView style={styles.mealHeader}>
                <ThemedText style={styles.dayText}>
                  {getDayName(meal.date)}
                </ThemedText>
                <ThemedText style={styles.dateText}>
                  {new Date(meal.date + 'T00:00:00').toLocaleDateString()}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.recipeTitle}>
                🍽️ {meal.recipeTitle}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      <TouchableOpacity 
        style={[styles.button, styles.backButton]} 
        onPress={() => router.back()}
      >
        <ThemedText style={styles.buttonText}>
          ← Back to Home
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#FF6B6B',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#FF6B6B',
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
  },
  regenerateButton: {
    backgroundColor: '#FF9800',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  backButton: {
    backgroundColor: '#757575',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    marginBottom: 20,
  },
  previewTitle: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#FF6B6B',
  },
  mealItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  dateText: {
    fontSize: 14,
    opacity: 0.7,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});
