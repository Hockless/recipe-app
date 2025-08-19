// Shared units helpers for ingredient amounts across the app
export type UnitGroup = 'Common' | 'Weight' | 'Volume' | 'Kitchen' | 'Other';
export interface UnitOption { value: string; label: string; group: UnitGroup }

export const UNIT_OPTIONS: UnitOption[] = [
  { value: 'each', label: 'each (count)', group: 'Common' },
  { value: 'piece', label: 'piece', group: 'Common' },
  { value: 'pack', label: 'pack', group: 'Common' },
  { value: 'bottle', label: 'bottle', group: 'Common' },
  { value: 'can', label: 'can', group: 'Common' },
  { value: 'g', label: 'g', group: 'Weight' },
  { value: 'kg', label: 'kg', group: 'Weight' },
  { value: 'ml', label: 'ml', group: 'Volume' },
  { value: 'L', label: 'L', group: 'Volume' },
  { value: 'tsp', label: 'tsp', group: 'Kitchen' },
  { value: 'tbsp', label: 'tbsp', group: 'Kitchen' },
  { value: 'cup', label: 'cup', group: 'Kitchen' },
  { value: 'slice', label: 'slice', group: 'Kitchen' },
  { value: 'clove', label: 'clove', group: 'Kitchen' },
  { value: 'custom', label: 'Custom…', group: 'Other' },
];

export const buildAmount = (qty?: string, unit?: string, customUnit?: string) => {
  const q = (qty || '').trim();
  const u = (unit || '').trim();
  const cu = (customUnit || '').trim();
  if (!q) return '';
  if (!u || u === 'each') return q; // count mode
  const finalUnit = u === 'custom' ? (cu || '') : u;
  return finalUnit ? `${q} ${finalUnit}` : q;
};

export const parseAmount = (amount: string): { qty: string; unit: string; customUnit?: string } => {
  const trimmed = (amount || '').trim();
  if (!trimmed) return { qty: '', unit: 'each' };
  // Match number or simple fraction at start
  const m = trimmed.match(/^([0-9]+(?:\.[0-9]+)?|[0-9]+\/[0-9]+)\s*(.*)$/);
  if (!m) return { qty: trimmed, unit: 'each' };
  const qty = m[1];
  const rest = (m[2] || '').trim();
  if (!rest) return { qty, unit: 'each' };
  const known = UNIT_OPTIONS.map(u => u.value).filter(v => v !== 'custom');
  if (known.includes(rest)) return { qty, unit: rest } as any;
  // If rest contains multiple words, treat as custom unit
  return { qty, unit: 'custom', customUnit: rest };
};
