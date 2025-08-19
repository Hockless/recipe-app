import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FF6B6B', dark: '#8B0000' }}
      headerImage={
        <ThemedView style={styles.headerContainer}>
          <ThemedText style={styles.headerEmoji}>👨‍🍳👩‍🍳</ThemedText>
        </ThemedView>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.mainTitle}>
          Lid and Jim&apos;s Recipe Book
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Delicious recipes, made with love ❤️
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.welcomeContainer}>
        <ThemedText type="subtitle">Welcome to your kitchen!</ThemedText>
        <ThemedText style={styles.welcomeText}>
          Discover amazing recipes, save your favorites, and create culinary masterpieces together.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.quickActionsContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/browse-recipes')}>
          <ThemedText style={styles.actionEmoji}>🔍</ThemedText>
          <ThemedView style={styles.actionTextContainer} lightColor="transparent" darkColor="transparent">
            <ThemedText type="defaultSemiBold">Browse Recipes</ThemedText>
            <ThemedText style={styles.actionDescription}>Explore our collection</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/add-recipe')}>
          <ThemedText style={styles.actionEmoji}>📝</ThemedText>
          <ThemedView style={styles.actionTextContainer} lightColor="transparent" darkColor="transparent">
            <ThemedText type="defaultSemiBold">Add New Recipe</ThemedText>
            <ThemedText style={styles.actionDescription}>Share your creations</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/meal-plan')}>
          <ThemedText style={styles.actionEmoji}>📅</ThemedText>
          <ThemedView style={styles.actionTextContainer} lightColor="transparent" darkColor="transparent">
            <ThemedText type="defaultSemiBold">Weekly Meal Plan</ThemedText>
            <ThemedText style={styles.actionDescription}>Plan recipes for the week</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/shopping-list')}>
          <ThemedText style={styles.actionEmoji}>🛒</ThemedText>
          <ThemedView style={styles.actionTextContainer} lightColor="transparent" darkColor="transparent">
            <ThemedText type="defaultSemiBold">Shopping List</ThemedText>
            <ThemedText style={styles.actionDescription}>Auto-generated from meal plan</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        {/* New: Bin Reminders */}
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/bin-reminders')}>
          <ThemedText style={styles.actionEmoji}>🗑️</ThemedText>
          <ThemedView style={styles.actionTextContainer} lightColor="transparent" darkColor="transparent">
            <ThemedText type="defaultSemiBold">Bin Reminders</ThemedText>
            <ThemedText style={styles.actionDescription}>Tuesday 5pm alerts</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/fridge')}>
          <ThemedText style={styles.actionEmoji}>🥬</ThemedText>
          <ThemedView style={styles.actionTextContainer} lightColor="transparent" darkColor="transparent">
            <ThemedText type="defaultSemiBold">Your Fridge</ThemedText>
            <ThemedText style={styles.actionDescription}>Skip ingredients you already have</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/ingredient-manager')}>
          <ThemedText style={styles.actionEmoji}>🥕</ThemedText>
          <ThemedView style={styles.actionTextContainer} lightColor="transparent" darkColor="transparent">
            <ThemedText type="defaultSemiBold">Ingredient Database</ThemedText>
            <ThemedText style={styles.actionDescription}>Smart search with 100+ ingredients</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/receipts')}>
          <ThemedText style={styles.actionEmoji}>🧾</ThemedText>
          <ThemedView style={styles.actionTextContainer} lightColor="transparent" darkColor="transparent">
            <ThemedText type="defaultSemiBold">Receipt Tracker</ThemedText>
            <ThemedText style={styles.actionDescription}>Track your food costs</ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerEmoji: {
    fontSize: 70,
    textAlign: 'center',
    lineHeight: 80,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#FF6B6B',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.85,
    fontWeight: '500',
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    marginBottom: 35,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    marginTop: 8,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionEmoji: {
    fontSize: 28,
    marginRight: 18,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 15,
    opacity: 0.75,
    marginTop: 4,
    lineHeight: 20,
  },
});
