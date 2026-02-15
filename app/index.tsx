import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const router = useRouter();
  const [recipeCount, setRecipeCount] = useState<number | null>(null);
  // Feature flags
  // (Personal calendar feature removed)
  const SHOW_SPORTS = false; // feature flag for My Sports card

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const r = await AsyncStorage.getItem('recipes');
        if (r) setRecipeCount(JSON.parse(r).length);
      } catch {}
    };
    loadCounts();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F6F7F9', dark: '#0D0F12' }}
      headerImage={<ThemedView style={styles.header} />}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.topRow}>
          <ThemedView style={styles.topRowText}>
            <ThemedText type="title" style={styles.title}>
              Home
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Recipes, meal plans, and shopping
            </ThemedText>
          </ThemedView>
          {recipeCount !== null && (
            <ThemedView style={styles.countPill}>
              <ThemedText style={styles.countPillText}>
                {recipeCount} recipes
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Recipes
          </ThemedText>
          <ThemedText style={styles.cardText}>
            Browse your recipes, add new ones, plan the week, and build a
            shopping list.
          </ThemedText>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.action, styles.actionPrimary]}
              onPress={() => router.push('/browse-recipes')}
              activeOpacity={0.9}
            >
              <ThemedText
                type="defaultSemiBold"
                style={[styles.actionText, styles.actionTextOnPrimary]}
              >
                Browse recipes
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.action}
              onPress={() => router.push('/add-recipe')}
              activeOpacity={0.9}
            >
              <ThemedText type="defaultSemiBold" style={styles.actionText}>
                Add recipe
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.action}
              onPress={() => router.push('/meal-plan')}
              activeOpacity={0.9}
            >
              <ThemedText type="defaultSemiBold" style={styles.actionText}>
                Meal plan
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.action}
              onPress={() => router.push('/shopping-list')}
              activeOpacity={0.9}
            >
              <ThemedText type="defaultSemiBold" style={styles.actionText}>
                Shopping list
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Personal Calendar removed */}

        {/* My Sports Card (hidden via SHOW_SPORTS flag) */}
        {SHOW_SPORTS && (
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              My Sports
            </ThemedText>
            <ThemedText style={styles.cardText}>
              Teams, fixtures & results.
            </ThemedText>
            <TouchableOpacity
              style={[styles.action, styles.actionPrimary]}
              onPress={() => router.push('/my-sports')}
              activeOpacity={0.9}
            >
              <ThemedText
                type="defaultSemiBold"
                style={[styles.actionText, styles.actionTextOnPrimary]}
              >
                Open
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Weight Tracker Card */}
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Weight tracker
          </ThemedText>
          <ThemedText style={styles.cardText}>
            Track your progress over time.
          </ThemedText>
          <TouchableOpacity
            style={[styles.action, styles.actionPrimary]}
            onPress={() => router.push('/weight-tracker')}
            activeOpacity={0.9}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.actionText, styles.actionTextOnPrimary]}
            >
              Open
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 24,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  topRowText: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 6,
    opacity: 0.75,
    fontSize: 14,
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.85,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardTitle: {
    fontSize: 16,
  },
  cardText: {
    marginTop: 6,
    opacity: 0.8,
    lineHeight: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  action: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
    minWidth: '48%',
  },
  actionPrimary: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderColor: 'rgba(0,0,0,0.85)',
  },
  actionText: {
    textAlign: 'center',
  },
  actionTextOnPrimary: {
    color: '#fff',
  },
});
