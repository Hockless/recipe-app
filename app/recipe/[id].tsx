import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Ingredient { id: string; name: string; amount: string; }
interface Recipe { id: string; title: string; ingredients: Ingredient[]; instructions?: string; imageUri?: string; dateCreated: string; tags?: string[]; }

export default function ViewRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('recipes');
        if (!stored) return;
        const parsed: Recipe[] = JSON.parse(stored);
        const found = parsed.find(r => String(r.id) === String(id));
        if (found) setRecipe(found);
      } catch {}
    })();
  }, [id]);

  const handleBack = () => {
    if ((router as any).canGoBack?.()) router.back(); else router.replace('/browse-recipes');
  };

  if (!recipe) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading recipe...</ThemedText>
      </ThemedView>
    );
  }

  const isSeed = String(recipe.id).startsWith('seed-');

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>{recipe.title}</ThemedText>
        {isSeed && (
          <ThemedView style={styles.builtInBadge}>
            <ThemedText style={styles.builtInBadgeText}>Built-in</ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      {recipe.imageUri && (
        <Image source={{ uri: recipe.imageUri }} style={styles.image} />
      )}

      {recipe.tags && recipe.tags.length > 0 && (
        <ThemedView style={styles.tagRow}>
          {recipe.tags.map(t => (
            <ThemedView key={t} style={[styles.tagPill, t === 'Keto' ? styles.tagKeto : t === 'Mediterranean' ? styles.tagMed : null]}>
              <ThemedText style={styles.tagText}>{t}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Ingredients</ThemedText>
        {recipe.ingredients.map(ing => (
          <ThemedText key={ing.id} style={styles.ingredientItem}>• {ing.name}{ing.amount ? ` - ${ing.amount}` : ''}</ThemedText>
        ))}
      </ThemedView>

      {recipe.instructions && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Instructions</ThemedText>
          <ThemedText style={styles.instructions}>{recipe.instructions}</ThemedText>
        </ThemedView>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FF6B6B' },
  backButton: { marginBottom: 10 },
  backButtonText: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  builtInBadge: { backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
  builtInBadgeText: { fontSize: 10, color: '#374151', fontWeight: '700', letterSpacing: 0.2 },
  image: { width: '100%', height: 240, resizeMode: 'cover' },
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#333' },
  ingredientItem: { fontSize: 15, color: '#444', marginBottom: 6 },
  instructions: { fontSize: 15, color: '#444', lineHeight: 22 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingHorizontal: 20 },
  tagPill: { backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  tagText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, color: '#334155' },
  tagKeto: { backgroundColor: '#d1fae5' },
  tagMed: { backgroundColor: '#ffe4e6' },
});
