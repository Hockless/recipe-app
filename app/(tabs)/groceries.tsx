import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Groceries tab: entry point to Shopping List
export default function GroceriesTab() {
  const router = useRouter();
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#DFF6DD', dark: '#1f3d1f' }}
      headerImage={<ThemedText style={styles.headerEmoji}>🛒</ThemedText>}
    >
      <ThemedView style={styles.section}>
        <ThemedText type="title" style={styles.title}>
          Groceries
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Plan purchases and track your weekly shop.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.card, styles.primary]}
          onPress={() => router.push('/shopping-list')}
        >
          <ThemedText style={styles.cardEmoji}>📝</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Shopping List
          </ThemedText>
          <ThemedText style={styles.cardText}>
            Auto-build lists from meal plans & add custom items.
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tipsScroller}
      >
        <ThemedView style={styles.tipChip}>
          <ThemedText style={styles.tipText}>Tap items to check off</ThemedText>
        </ThemedView>
        <ThemedView style={styles.tipChip}>
          <ThemedText style={styles.tipText}>
            Use meal plan to prefill
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerEmoji: { fontSize: 120, textAlign: 'center', marginTop: 40 },
  section: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 32 },
  subtitle: { marginTop: 6, opacity: 0.8 },
  actionsRow: { flexDirection: 'row', gap: 16, padding: 20 },
  card: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  primary: { backgroundColor: '#9AD49A' },
  cardEmoji: { fontSize: 34, marginBottom: 6 },
  cardTitle: { fontSize: 18, marginBottom: 4, color: '#222' },
  cardText: { fontSize: 13, lineHeight: 18, opacity: 0.8 },
  tipsScroller: { paddingHorizontal: 20, paddingTop: 4 },
  tipChip: {
    backgroundColor: '#e3f5e3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  tipText: { fontSize: 12, fontWeight: '500' },
});
