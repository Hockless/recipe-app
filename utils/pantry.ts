import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PantryItem {
  name: string;
  quantity: number;
  unit: string;
  updatedAt: string;
}

const PANTRY_KEY = 'pantryItems';

export async function loadPantry(): Promise<PantryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(PANTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PantryItem[];
    return parsed.filter(p => typeof p.name === 'string');
  } catch {
    return [];
  }
}

export async function savePantry(items: PantryItem[]) {
  await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(items));
}

export async function upsertPantryItem(name: string, deltaQty: number, unit: string) {
  const items = await loadPantry();
  const idx = items.findIndex(i => i.name.toLowerCase() === name.toLowerCase() && i.unit === unit);
  if (idx >= 0) {
    items[idx].quantity = Math.max(0, +(items[idx].quantity + deltaQty).toFixed(3));
    items[idx].updatedAt = new Date().toISOString();
  } else if (deltaQty >= 0) {
    items.push({ name, quantity: +deltaQty.toFixed(3), unit, updatedAt: new Date().toISOString() });
  }
  const cleaned = items.filter(i => i.quantity > 0);
  await savePantry(cleaned);
  return cleaned;
}

export interface ParsedAmount { qty: number | null; unit: string | null; }

export function parseAmount(raw: string | undefined | null): ParsedAmount {
  if (!raw) return { qty: null, unit: null };
  const trimmed = raw.trim();
  const numberMatch = trimmed.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!numberMatch) return { qty: null, unit: null };
  const qty = parseFloat(numberMatch[1]);
  let unitPart = '';
  const remainder = trimmed.slice(numberMatch.index! + numberMatch[0].length).trim();
  if (remainder) {
    const m = remainder.match(/^([a-zA-Zµ]+|g|kg|ml|l|tbsp|tsp|oz|lb|clove|cloves|cup|cups|each|x)/);
    if (m) unitPart = m[0];
  } else {
    const compactMatch = trimmed.match(/^[0-9]+(?:\.[0-9]+)?(g|kg|ml|l|oz|lb)/);
    if (compactMatch) unitPart = compactMatch[1];
  }
  if (!unitPart) unitPart = 'each';
  return { qty: isFinite(qty) ? qty : null, unit: unitPart.toLowerCase() };
}

export function formatQuantity(qty: number, unit: string) {
  return `${qty % 1 === 0 ? qty : qty.toFixed(2)} ${unit}`.trim();
}
