import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Unified Recipes tab: entry points to Add + Browse
export default function RecipesTab() {
  const router = useRouter();
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFCECE', dark: '#442222' }}
      headerImage={<ThemedText style={styles.headerEmoji}>🍲</ThemedText>}
    >
      <ThemedView style={styles.section}>
        <ThemedText type="title" style={styles.title}>Recipes</ThemedText>
        <ThemedText style={styles.subtitle}>Create, edit and manage your recipes.</ThemedText>
      </ThemedView>
      <ThemedView style={styles.actionsRow}>
        <TouchableOpacity style={[styles.card, styles.primary]} onPress={() => router.push('/add-recipe')}>
          <ThemedText style={styles.cardEmoji}>➕</ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Add Recipe</ThemedText>
          <ThemedText style={styles.cardText}>Craft a new recipe with ingredients & instructions.</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/browse-recipes')}>
          <ThemedText style={styles.cardEmoji}>📚</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Browse</ThemedText>
          <ThemedText style={styles.cardText}>View, edit or delete saved recipes.</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroller}>
        <ThemedView style={styles.tipChip}><ThemedText style={styles.tipText}>Seed recipes are read-only</ThemedText></ThemedView>
        <ThemedView style={styles.tipChip}><ThemedText style={styles.tipText}>Add photos for clarity</ThemedText></ThemedView>
        <ThemedView style={styles.tipChip}><ThemedText style={styles.tipText}>Swipe down to refresh list</ThemedText></ThemedView>
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
  card: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  primary: { backgroundColor: '#FF6B6B' },
  cardEmoji: { fontSize: 34, marginBottom: 6 },
  cardTitle: { fontSize: 18, marginBottom: 4, color: '#222' },
  cardText: { fontSize: 13, lineHeight: 18, opacity: 0.8 },
  tipsScroller: { paddingHorizontal: 20, paddingTop: 4 },
  tipChip: { backgroundColor: '#ffe5e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  tipText: { fontSize: 12, fontWeight: '500' },
});
