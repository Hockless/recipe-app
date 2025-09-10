// Add your own seed recipes here. These will be merged with built-in seeds
// and will persist across app updates. Keep each recipe unique by title.
//
// Quick helper: use makeSeedRecipe to build a recipe with generated ids.
// Example (uncomment and adjust):
// export const EXTRA_SEEDED_RECIPES: Recipe[] = [
//   makeSeedRecipe(
//     'Example Keto Dish',
//     [
//       ['Olive oil', '1 tbsp'],
//       ['Chicken thighs', '400 g'],
//     ],
//     'Cook chicken in oil until done. Serve hot.',
//     2,
//     ['Keto']
//   ),
// ];

export type Ingredient = {
  id: string;
  name: string;
  amount: string;
};

export type Recipe = {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions?: string;
  imageUri?: string;
  dateCreated: string;
  tags?: string[];
  serves?: number;
};

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export function makeSeedRecipe(
  title: string,
  ingredients: Array<[name: string, amount: string]>,
  instructions: string,
  serves?: number,
  tags: string[] = ['Keto']
): Recipe {
  return {
    id: 'seed-' + slugify(title),
    title,
    ingredients: ingredients.map(([name, amount], i) => ({ id: `i-${i + 1}` , name, amount })),
    instructions,
    dateCreated: new Date().toISOString(),
    serves,
    tags,
  };
}

// Start with an empty list; paste your recipes here.
// All recipes migrated to seed.ts; keep this empty array for future user additions if desired.
export const EXTRA_SEEDED_RECIPES: Recipe[] = [];
