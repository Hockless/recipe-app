import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureSeeded } from './seed';

/**
 * Development helper to completely wipe persisted recipe/ingredient seed data
 * and optionally reseed immediately. Useful when stale ingredient names (e.g. "Small leek")
 * linger due to earlier seed versions having already populated AsyncStorage.
 *
 * WARNING: This removes any user-added recipes as well. Only use in development.
 */
export async function resetSeedData(reseedVersion?: number) {
  try {
    await AsyncStorage.multiRemove(['recipes', 'seededIngredients', 'seedVersion']);
    if (reseedVersion !== undefined) {
      await ensureSeeded(reseedVersion);
    }
  } catch (e) {
    // Silent fail – purely a convenience tool.
  }
}

/**
 * Convenience one-liner you can paste into a debug console:
 *   import { resetSeedData } from '@/utils/devTools'; resetSeedData(6);
 * Adjust the version number if you increment seeds again.
 */
