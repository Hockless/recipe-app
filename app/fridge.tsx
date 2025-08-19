import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import IngredientSearch, { type IngredientItem } from '@/components/IngredientSearch';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { UNIT_OPTIONS, buildAmount, type UnitGroup, type UnitOption } from '@/utils/units';

interface FridgeItem {
  name: string;
  amount?: string;
  notes?: string;
  addedAt: string;
}

const STORAGE_KEY = 'fridgeItems';

export default function FridgeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  // New qty/unit state
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<string>('each');
  const [customUnit, setCustomUnit] = useState('');
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  const saveItems = async (next: FridgeItem[]) => {
    setItems(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addItem = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter an ingredient name');
      return;
    }
    const normalized = name.trim();
    const exists = items.some(i => i.name.toLowerCase().trim() === normalized.toLowerCase());
    if (exists) {
      Alert.alert('Already added', 'This ingredient is already in Your Fridge');
      return;
    }
    const amt = amount.trim() || buildAmount(qty, unit, customUnit);
    const next = [{ name: normalized, amount: amt || undefined, notes: notes.trim() || undefined, addedAt: new Date().toISOString() }, ...items];
    await saveItems(next);
    setName(''); setAmount(''); setNotes(''); setQty(''); setUnit('each'); setCustomUnit(''); setShowAddModal(false);
  };

  const removeItem = async (n: string) => {
    const ok = typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm(`Remove "${n}" from Your Fridge?`) : true;
    if (!ok) return;
    const next = items.filter(i => i.name.toLowerCase().trim() !== n.toLowerCase().trim());
    await saveItems(next);
  };

  const clearAll = async () => {
    Alert.alert('Clear all', 'Remove everything from Your Fridge?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await saveItems([]); } }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => ((router as any).canGoBack?.() ? router.back() : router.replace('/'))}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Your Fridge</ThemedText>
        <ThemedText style={styles.subtitle}>Ingredients you already have at home</ThemedText>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowAddModal(true)}>
            <ThemedText style={styles.primaryBtnText}>＋ Add Ingredient</ThemedText>
          </TouchableOpacity>
          {items.length > 0 && (
            <TouchableOpacity style={[styles.primaryBtn, styles.clearBtn]} onPress={clearAll}>
              <ThemedText style={styles.primaryBtnText}>Clear All</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>

      <ThemedView style={styles.content}>
        {items.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>🥬</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyTitle}>Nothing in your fridge yet</ThemedText>
            <ThemedText style={styles.emptyDesc}>Add ingredients you already have so they’re skipped in the shopping list.</ThemedText>
          </ThemedView>
        ) : (
          items.map((i) => (
            <ThemedView key={i.addedAt} style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.itemName}>{i.name}</ThemedText>
              {i.amount ? <ThemedText style={styles.itemAmount}>{i.amount}</ThemedText> : null}
              {i.notes ? <ThemedText style={styles.itemNotes}>{i.notes}</ThemedText> : null}
              <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.smallBtn, styles.danger]} onPress={() => removeItem(i.name)}>
                  <ThemedText style={styles.smallBtnText}>Remove</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          ))
        )}
      </ThemedView>

      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Add to Your Fridge</ThemedText>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <ScrollView style={styles.modalContent}>
            <ThemedText style={styles.label}>Ingredient name</ThemedText>
            <View style={{ zIndex: 9999 }}>
              <IngredientSearch
                placeholder="Search ingredients..."
                value={name}
                onChangeText={setName}
                onSelectIngredient={(selected: IngredientItem) => setName(selected.name)}
              />
            </View>
            <ThemedText style={styles.label}>Amount (optional)</ThemedText>
            <TextInput value={amount} onChangeText={setAmount} placeholder="Free text or use Qty + Unit below" style={styles.input} />

            {/* Qty + Unit selector */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={qty}
                onChangeText={setQty}
                placeholder="Qty"
              />
              <TouchableOpacity
                style={styles.unitButton}
                onPress={() => setUnitPickerVisible(true)}
              >
                <ThemedText style={styles.unitButtonText}>
                  {unit === 'custom' ? (customUnit || 'Custom') : (unit || 'unit')}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Unit picker modal */}
            <Modal
              visible={unitPickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setUnitPickerVisible(false)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Select unit</ThemedText>
                  <ScrollView style={{ maxHeight: 300 }}>
                    {(['Common', 'Weight', 'Volume', 'Kitchen', 'Other'] as UnitGroup[]).map((group) => (
                      <View key={group}>
                        <ThemedText style={styles.unitGroupLabel}>{group}</ThemedText>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {UNIT_OPTIONS.filter(u => u.group === group).map((u: UnitOption) => (
                            <TouchableOpacity
                              key={u.value}
                              style={styles.unitChip}
                              onPress={() => {
                                setUnit(u.value);
                                if (u.value !== 'custom') {
                                  setUnitPickerVisible(false);
                                }
                              }}
                            >
                              <ThemedText style={styles.unitChipText}>{u.label}</ThemedText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Custom unit input if selected */}
                  {unit === 'custom' && (
                    <View style={{ marginTop: 12 }}>
                      <ThemedText style={{ marginBottom: 6 }}>Custom unit</ThemedText>
                      <TextInput
                        placeholder="e.g., bottle, bar, sachet"
                        style={styles.input}
                        value={customUnit}
                        onChangeText={setCustomUnit}
                      />
                      <TouchableOpacity
                        style={[styles.modalPrimaryBtn, { marginTop: 10, alignSelf: 'flex-end' }]}
                        onPress={() => setUnitPickerVisible(false)}
                      >
                        <ThemedText style={styles.modalPrimaryBtnText}>Done</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => setUnitPickerVisible(false)}>
                    <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalSecondaryBtn]} onPress={() => setShowAddModal(false)}>
                <ThemedText style={styles.modalSecondaryBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={addItem}>
                <ThemedText style={styles.modalPrimaryBtnText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#2E7D32' },
  backButton: { marginBottom: 10 },
  backButtonText: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#fff', fontSize: 16, opacity: 0.9 },
  headerActions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12 },
  primaryBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
  clearBtn: { backgroundColor: 'rgba(255,255,255,0.15)' },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, marginBottom: 6 },
  emptyDesc: { opacity: 0.7, textAlign: 'center' },
  card: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  itemName: { fontSize: 16, color: '#333' },
  itemAmount: { marginTop: 4, color: '#2E7D32', fontWeight: '600' },
  itemNotes: { marginTop: 4, color: '#666' },
  cardActions: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  smallBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  smallBtnText: { color: '#fff', fontWeight: '600' },
  danger: { backgroundColor: '#ff4444' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 60 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: { padding: 10 },
  closeButtonText: { fontSize: 20, color: '#666' },
  modalContent: { padding: 16 },
  label: { marginTop: 10, marginBottom: 6, color: '#555', fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 10 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  // Solid, visible buttons for modal actions (web-friendly)
  modalPrimaryBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
  modalPrimaryBtnText: { color: '#fff', fontWeight: '700' },
  modalSecondaryBtn: { backgroundColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
  modalSecondaryBtnText: { color: '#333', fontWeight: '700' },
  unitButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
    alignItems: 'center',
    marginRight: 8,
  },
  unitButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
  },
  unitGroupLabel: { fontWeight: '700', marginTop: 8, marginBottom: 6 },
  unitChip: {
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  unitChipText: { fontWeight: '600', color: '#333' },
  secondaryButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});
