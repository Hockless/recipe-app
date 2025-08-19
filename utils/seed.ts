import AsyncStorage from '@react-native-async-storage/async-storage';

// Local copies of shapes used by screens
export interface Ingredient {
  id: string;
  name: string;
  amount: string; // e.g., "2 cups", "1 tbsp", "200 g"
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions?: string;
  imageUri?: string;
  dateCreated: string; // ISO string
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Safe, generic sample data created for this app (not copied from any source)
export const SEEDED_RECIPES: Recipe[] = [
  {
    id: 'seed-' + slugify('Simple Tomato Pasta'),
    title: 'Simple Tomato Pasta',
    ingredients: [
      { id: 'i-1', name: 'Spaghetti', amount: '200 g' },
      { id: 'i-2', name: 'Olive oil', amount: '2 tbsp' },
      { id: 'i-3', name: 'Garlic', amount: '2 cloves' },
      { id: 'i-4', name: 'Tomatoes (chopped)', amount: '400 g' },
      { id: 'i-5', name: 'Salt', amount: 'to taste' },
      { id: 'i-6', name: 'Black pepper', amount: 'to taste' },
      { id: 'i-7', name: 'Basil (fresh)', amount: 'a few leaves' },
    ],
    instructions:
      'Cook pasta in salted boiling water. Sauté garlic in olive oil, add tomatoes and simmer until saucy. Season and toss with pasta. Finish with basil.',
    dateCreated: '2025-01-01T10:00:00.000Z',
  },
  {
    id: 'seed-' + slugify('Avocado Toast'),
    title: 'Avocado Toast',
    ingredients: [
      { id: 'i-1', name: 'Bread slices', amount: '2 each' },
      { id: 'i-2', name: 'Avocado', amount: '1 each' },
      { id: 'i-3', name: 'Lemon juice', amount: '1 tsp' },
      { id: 'i-4', name: 'Salt', amount: 'a pinch' },
      { id: 'i-5', name: 'Chili flakes', amount: 'a pinch' },
    ],
    instructions:
      'Toast bread. Mash avocado with lemon juice and salt. Spread on toast and finish with chili flakes.',
    dateCreated: '2025-01-02T09:00:00.000Z',
  },
];

const SEED_VERSION_KEY = 'seedVersion';

export async function ensureSeeded(targetVersion: number) {
  try {
    const [versionStr, existingStr] = await Promise.all([
      AsyncStorage.getItem(SEED_VERSION_KEY),
      AsyncStorage.getItem('recipes'),
    ]);

    const currentVersion = versionStr ? Number(versionStr) : 0;
    const existingRecipes = existingStr ? (JSON.parse(existingStr) as Recipe[]) : [];

    // If no upgrade is needed, bail early
    if (currentVersion >= targetVersion) {
      // Still ensure there is at least some data on totally fresh installs
      if (!existingStr || existingRecipes.length === 0) {
        const merged = mergeSeeds(existingRecipes, SEEDED_RECIPES);
        await AsyncStorage.setItem('recipes', JSON.stringify(merged));
      }
      return;
    }

    // Perform upgrade: merge seeds, avoiding duplicates by id
    const merged = mergeSeeds(existingRecipes, SEEDED_RECIPES);
    await AsyncStorage.setItem('recipes', JSON.stringify(merged));
    await AsyncStorage.setItem(SEED_VERSION_KEY, String(targetVersion));
  } catch (e) {
    // Fail silently; app will just show empty state
    // console.warn('Seeding failed', e);
  }
}

function mergeSeeds(existing: Recipe[], seeds: Recipe[]): Recipe[] {
  const byId = new Map<string, Recipe>();
  for (const r of existing) byId.set(String(r.id), r);
  for (const s of seeds) {
    if (!byId.has(String(s.id))) {
      byId.set(String(s.id), s);
    }
  }
  // Preserve original order: newest first based on dateCreated
  const all = Array.from(byId.values());
  all.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
  return all;
}
