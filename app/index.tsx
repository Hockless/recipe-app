import { shared } from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const router = useRouter();
  const [recipeCount, setRecipeCount] = useState<number | null>(null);
  const [receiptCount, setReceiptCount] = useState<number | null>(null);
  // Feature flags
  const SHOW_CALENDAR = false; // toggle on when ready to display the calendar card again

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const r = await AsyncStorage.getItem('recipes');
        if (r) setRecipeCount(JSON.parse(r).length);
      } catch {}
      try {
        const rec = await AsyncStorage.getItem('receipts');
        if (rec) setReceiptCount(JSON.parse(rec).length);
      } catch {}
    };
    loadCounts();
  }, []);

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
          Lid & Jim&apos;s Home Hub
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Meals • Groceries • Pantry • Receipts • Reminders • Commute
        </ThemedText>
        <View style={styles.metricsRow}>
          {recipeCount !== null && (
            <View style={styles.metricChip}><ThemedText style={styles.metricText}>{recipeCount} recipes</ThemedText></View>
          )}
          {receiptCount !== null && (
            <View style={styles.metricChip}><ThemedText style={styles.metricText}>{receiptCount} receipts</ThemedText></View>
          )}
        </View>
      </ThemedView>
      
      <ThemedView style={styles.welcomeContainer}>
        <ThemedText type="subtitle">All your household flow in one place</ThemedText>
        <ThemedText style={styles.welcomeText}>
          Plan dinners, auto-build shopping lists, track pantry & fridge items, scan receipts, set bin reminders and pick the best train — together.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.quickActionsContainer}>
  <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>

        {/* Combined Recipes Card */}
        <TouchableOpacity
          style={[styles.actionButton, styles.groupCard]}
          onPress={() => router.push('/browse-recipes')}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.actionEmoji}>🍲</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <View style={styles.titleRow}>
              <ThemedText type="defaultSemiBold">Recipes</ThemedText>
              {recipeCount !== null && (
                <View style={styles.badge}><ThemedText style={styles.badgeText}>{recipeCount}</ThemedText></View>
              )}
            </View>
            <ThemedText style={styles.actionDescription}>Browse or add new recipes</ThemedText>
            <ThemedView style={styles.inlineActions}>
              <TouchableOpacity style={styles.inlinePill} onPress={() => router.push('/browse-recipes')}>
                <ThemedText style={styles.inlinePillText}>Browse</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inlinePill} onPress={() => router.push('/add-recipe')}>
                <ThemedText style={styles.inlinePillText}>Add</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inlinePill} onPress={() => router.push('/meal-plan')}>
                <ThemedText style={styles.inlinePillText}>Meal Plan</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </TouchableOpacity>

        {/* Combined Groceries Card (now includes Fridge & Ingredients) */}
        <TouchableOpacity
          style={[styles.actionButton, styles.groupCard]}
          onPress={() => router.push('/shopping-list')}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.actionEmoji}>🛍️</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <View style={styles.titleRow}>
              <ThemedText type="defaultSemiBold">Groceries</ThemedText>
              {receiptCount !== null && (
                <View style={[styles.badge, styles.badgeNeutral]}><ThemedText style={styles.badgeText}>{receiptCount}</ThemedText></View>
              )}
            </View>
            <ThemedText style={styles.actionDescription}>Shopping, receipts & pantry</ThemedText>
            <ThemedView style={styles.inlineActions}>
              <TouchableOpacity style={styles.inlinePill} onPress={() => router.push('/shopping-list')}>
                <ThemedText style={styles.inlinePillText}>List</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inlinePill} onPress={() => router.push('/receipts')}>
                <ThemedText style={styles.inlinePillText}>Receipts</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inlinePill} onPress={() => router.push('/fridge')}>
                <ThemedText style={styles.inlinePillText}>Fridge</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inlinePill} onPress={() => router.push('/ingredient-manager')}>
                <ThemedText style={styles.inlinePillText}>Ingredients</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </TouchableOpacity>

        {/* Separate Bin Reminders Card */}
        <TouchableOpacity
          style={styles.actionButton}
            onPress={() => router.push('/bin-reminders')}
            activeOpacity={0.85}
        >
          <ThemedText style={styles.actionEmoji}>🗑️</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <ThemedText type="defaultSemiBold">Bin Reminders</ThemedText>
            <ThemedText style={styles.actionDescription}>Tuesday 5pm alerts</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        {/* Notes Card */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/notes' as any)}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.actionEmoji}>🗒️</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <ThemedText type="defaultSemiBold">Notes</ThemedText>
            <ThemedText style={styles.actionDescription}>Scratchpad that autosaves</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        {/* Commute Planner Card */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/commute-planner')}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.actionEmoji}>🚆</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <ThemedText type="defaultSemiBold">Commute Planner</ThemedText>
            <ThemedText style={styles.actionDescription}>Best train to arrive on time</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        {/* Weather Card */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/weather')}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.actionEmoji}>🌦️</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <ThemedText type="defaultSemiBold">Weather</ThemedText>
            <ThemedText style={styles.actionDescription}>Guiseley ↔ Leeds today</ThemedText>
          </ThemedView>
        </TouchableOpacity>

        {/* Personal Calendar Card (hidden via flag, logic kept) */}
        {SHOW_CALENDAR && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/personal-calendar')}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.actionEmoji}>🗓️</ThemedText>
            <ThemedView style={styles.actionTextContainer}>
              <ThemedText type="defaultSemiBold">Personal Calendar</ThemedText>
              <ThemedText style={styles.actionDescription}>Simple events & notes</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        )}

        {/* My Sports Card */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/my-sports')}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.actionEmoji}>⚽</ThemedText>
          <ThemedView style={styles.actionTextContainer}>
            <ThemedText type="defaultSemiBold">My Sports</ThemedText>
            <ThemedText style={styles.actionDescription}>Teams, fixtures & results</ThemedText>
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
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    justifyContent: 'center',
  },
  metricChip: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
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
  // New grouped CTA styles
  groupCard: {
    backgroundColor: 'rgba(255,107,107,0.18)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  inlinePill: shared.pill,
  inlinePillText: { fontSize: 13, fontWeight: '600' },
  badge: {
    ...shared.badge,
    paddingVertical: Platform.select({ ios: 2, default: 3 }),
  },
  badgeNeutral: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  badgeText: shared.badgeText,
});
