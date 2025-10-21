# Recipe App - GitHub Copilot Instructions

## Project Overview

This is a **React Native Expo** recipe management application built with **TypeScript**. The app allows users to manage recipes, ingredients, shopping lists, meal plans, and various other lifestyle features.

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing in `/app` directory)
- **Storage**: AsyncStorage (@react-native-async-storage/async-storage)
- **Styling**: Custom theme system (see `/styles/theme.ts`)
- **Build**: EAS Build (see `eas.json`)

## Project Structure

### Core Directories

```
/app/               - File-based routing screens
  /(tabs)/          - Tab navigation screens
  /recipe/          - Recipe detail screens
/components/        - Reusable React components
/utils/             - Utility functions and helpers
/constants/         - App constants (Colors, etc.)
/hooks/             - Custom React hooks
/styles/            - Theme and styling
/assets/            - Images, fonts, icons
/android/           - Android native code
/ios/               - iOS native code
```

### Key Files

- **`utils/seed.ts`** - Recipe seeding system with versioning
- **`utils/pantry.ts`** - Pantry/ingredient management utilities
- **`utils/units.ts`** - Unit conversion and measurement helpers
- **`styles/theme.ts`** - Centralized theme configuration
- **`app/_layout.tsx`** - Root layout with navigation setup

## Data Models

### Recipe Interface

```typescript
interface Recipe {
  id: string; // Unique identifier (e.g., 'seed-recipe-name')
  title: string; // Recipe name
  ingredients: Ingredient[];
  instructions?: string; // Cooking instructions
  imageUri?: string; // Optional image path
  dateCreated: string; // ISO date string
  tags?: string[]; // e.g., ['Keto', 'Mediterranean']
  serves?: number; // Number of servings
}
```

### Ingredient Interface

```typescript
interface Ingredient {
  id: string; // Unique identifier
  name: string; // Ingredient name
  amount: string; // e.g., "2 cups", "1 tbsp", "200 g"
}
```

## Storage Architecture

### AsyncStorage Keys

- **`recipes`** - Array of Recipe objects
- **`seedVersion`** - Number tracking seed data version
- **`seededIngredients`** - Pre-populated ingredient list
- Additional keys for pantry, shopping lists, meal plans, etc.

### Seeding System

The app uses a versioned seeding system (`ensureSeeded(targetVersion)`) that:

1. Checks current seed version against target
2. Merges built-in recipes with user recipes
3. Deduplicates by title (case-insensitive)
4. Populates ingredient database from recipe data
5. Upgrades cleanly without data loss

**Important**: When upgrading seeds, seeded ingredients are **replaced** (not merged) to avoid stale entries.

## Coding Patterns & Conventions

### Naming Conventions

- **IDs**: Use kebab-case with prefixes
  - Seed recipes: `'seed-recipe-name'`
  - Seed ingredients: `'seed-ing-ingredient-name'`
- **Functions**: camelCase (e.g., `ensureSeeded`, `slugify`)
- **Components**: PascalCase (e.g., `RecipeCard`, `ThemedView`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `SEEDED_RECIPES`)

### Helper Functions

- **`slugify(input: string)`** - Converts strings to kebab-case
- **`mergeSeeds(existing, seeds)`** - Deduplicates recipes by title
- **`dedupeByName(items)`** - Removes duplicate ingredients by name

### Async Patterns

- Use `async/await` with try-catch blocks
- Fail silently for non-critical operations (seeding, background tasks)
- Use `Promise.all()` for parallel AsyncStorage operations

### TypeScript Usage

- Explicit interface definitions for all data models
- Type safety for AsyncStorage operations with JSON parsing
- Avoid `any` - use proper types or `unknown`

## Common Tasks

### Adding New Recipes

1. Add recipe object to `SEEDED_RECIPES` or `EXTRA_SEEDED_RECIPES` in `utils/seed.ts`
2. Use proper ingredient structure with unique IDs
3. Include `dateCreated` as ISO string
4. Optional: Add `tags`, `serves`, `instructions`
5. Increment seed version if updating existing data

### Adding New Screens

1. Create file in `/app` directory (file-based routing)
2. Export default React component
3. Use `ThemedView` and `ThemedText` for consistent styling
4. Import from `@/components/` using alias

### Styling

- Use theme constants from `/styles/theme.ts`
- Prefer `useThemeColor` hook for dynamic colors
- Use `ThemedView` and `ThemedText` components
- StyleSheet.create for performance

### Data Persistence

```typescript
// Save data
await AsyncStorage.setItem('key', JSON.stringify(data));

// Load data
const str = await AsyncStorage.getItem('key');
const data = str ? JSON.parse(str) : defaultValue;

// Remove data
await AsyncStorage.removeItem('key');
```

## Special Features

### Multi-Purpose App

Beyond recipes, the app includes:

- Shopping lists & grocery management
- Meal planning (random & manual)
- Pantry/fridge inventory
- Weight tracker
- Sports tracking
- Personal calendar
- Weather integration
- Commute planner
- Receipts storage
- Bin reminders
- Notes

### Keto Focus

Many seeded recipes are keto-friendly with:

- Low-carb ingredients (cauliflower rice, courgetti)
- High-fat ingredients (butter, cream, cheese)
- Tagged with `'Keto'` for filtering

## Development Guidelines

### When Adding Features

1. Check existing patterns in similar screens/components
2. Reuse utility functions from `/utils`
3. Follow TypeScript typing conventions
4. Test with seed data
5. Consider AsyncStorage version upgrades if data structure changes

### When Debugging

1. Check AsyncStorage keys and values
2. Verify seed version is up to date
3. Look for type mismatches in JSON parsing
4. Check file-based routing structure in `/app`

### Best Practices

- **Immutability**: Don't mutate AsyncStorage data directly
- **Error Handling**: Graceful degradation for storage failures
- **Performance**: Use `Promise.all()` for parallel operations
- **Deduplication**: Always dedupe when merging user + seed data
- **Clean Upgrades**: Remove old keys when data structure changes

## Important Notes

- Recipe IDs with `seed-` prefix are from built-in data
- User-created content should use different ID patterns
- Seeding happens automatically on app launch
- Seed upgrades preserve user data while updating built-in content
- The app uses Expo's file-based routing (like Next.js)

## Testing Considerations

- Test seed upgrades from version N to N+1
- Verify deduplication logic with duplicate titles
- Test AsyncStorage failure scenarios
- Verify recipe filtering by tags
- Test ingredient search and autocomplete

---

**Last Updated**: October 2025
**Seed Version**: Check `SEED_VERSION_KEY` in seed.ts
