import { StyleSheet, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FF6B6B', dark: '#8B0000' }}
      headerImage={
        <ThemedView style={styles.headerContainer}>
          <ThemedText style={styles.headerEmoji}>👨‍🍳👩‍🍳</ThemedText>
        </ThemedView>
      }
    >
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
          Discover amazing recipes, save your favorites, and create culinary
          masterpieces together.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/browse-recipes')}
        >
          <ThemedText style={styles.actionEmoji}>🔍</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <ThemedText type="defaultSemiBold">Browse Recipes</ThemedText>
            <ThemedText style={styles.actionDescription}>
              Explore our collection
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/add-recipe')}
        >
          <ThemedText style={styles.actionEmoji}>📝</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <ThemedText type="defaultSemiBold">Add New Recipe</ThemedText>
            <ThemedText style={styles.actionDescription}>
              Share your creations
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/shopping-list')}
        >
          <ThemedText style={styles.actionEmoji}>🛒</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <ThemedText type="defaultSemiBold">Shopping List</ThemedText>
            <ThemedText style={styles.actionDescription}>
              Never forget ingredients
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        {/* Kitchen & Pantry removed */}

        {/* Bin Reminders removed */}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  mainTitle: {
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
  welcomeContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
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
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  actionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
});
