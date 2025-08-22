import { BackButton } from '@/components/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { shared } from '@/styles/theme';
import { PantryItem, formatQuantity, loadPantry, savePantry } from '@/utils/pantry';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function PantryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('each');

  useEffect(() => { (async () => setItems(await loadPantry()))(); }, []);

  const persist = async (next: PantryItem[]) => { setItems(next); await savePantry(next); };

  const addItem = async () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const q = parseFloat(qty);
    if (!isFinite(q) || q <= 0) { Alert.alert('Enter a positive quantity'); return; }
    const existing = items.find(i => i.name.toLowerCase() === name.toLowerCase() && i.unit === unit);
    let next: PantryItem[];
    if (existing) {
      existing.quantity = +(existing.quantity + q).toFixed(3);
      existing.updatedAt = new Date().toISOString();
      next = [...items];
    } else {
      next = [...items, { name: name.trim(), quantity: +q.toFixed(3), unit, updatedAt: new Date().toISOString() }];
    }
    await persist(next.sort((a,b)=>a.name.localeCompare(b.name)));
    setName(''); setQty(''); setUnit('each'); setShowAdd(false);
  };

  const adjust = async (idx: number, delta: number) => {
    const next = [...items];
    next[idx].quantity = +(next[idx].quantity + delta).toFixed(3);
    if (next[idx].quantity <= 0) next.splice(idx,1); else next[idx].updatedAt = new Date().toISOString();
    await persist(next);
  };

  const remove = async (idx: number) => {
    const n = items[idx];
    const ok = typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm(`Remove ${n.name}?`) : true;
    if (!ok) return;
    const next = items.filter((_,i)=>i!==idx); await persist(next);
  };

  const clearAll = async () => {
    Alert.alert('Clear pantry', 'Remove all pantry items?', [ { text: 'Cancel', style: 'cancel'}, { text: 'Clear', style: 'destructive', onPress: async () => { await persist([]); } } ]);
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <BackButton onPress={() => ((router as any).canGoBack?.() ? router.back() : router.replace('/'))} />
        <ThemedText type="title" style={styles.title}>Pantry</ThemedText>
        <ThemedText style={styles.subtitle}>Track staple ingredient quantities</ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={()=>setShowAdd(true)}><ThemedText style={styles.primaryBtnText}>＋ Add</ThemedText></TouchableOpacity>
          {items.length>0 && <TouchableOpacity style={[styles.primaryBtn, styles.clearBtn]} onPress={clearAll}><ThemedText style={styles.primaryBtnText}>Clear All</ThemedText></TouchableOpacity>}
        </View>
      </ThemedView>
      <ThemedView style={styles.content}>
        {items.length===0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>📦</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyTitle}>Pantry is empty</ThemedText>
            <ThemedText style={styles.emptyDesc}>Add staple items (e.g. rice 2 kg, pasta 500 g) so recipes decrement stock when cooked.</ThemedText>
          </ThemedView>
        ) : items.map((it, idx)=>(
          <ThemedView key={it.name+it.unit} style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.itemName}>{it.name}</ThemedText>
            <ThemedText style={styles.itemAmount}>{formatQuantity(it.quantity, it.unit)}</ThemedText>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.smallBtn]} onPress={()=>adjust(idx, -1)}><ThemedText style={styles.smallBtnText}>-1</ThemedText></TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn]} onPress={()=>adjust(idx, +1)}><ThemedText style={styles.smallBtnText}>+1</ThemedText></TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.removeBtn]} onPress={()=>remove(idx)}><ThemedText style={styles.smallBtnText}>Remove</ThemedText></TouchableOpacity>
            </View>
          </ThemedView>
        ))}
      </ThemedView>
      <Modal visible={showAdd} animationType="slide" onRequestClose={()=>setShowAdd(false)}>
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Add Pantry Item</ThemedText>
            <TouchableOpacity onPress={()=>setShowAdd(false)} style={styles.closeButton}><ThemedText style={styles.closeButtonText}>✕</ThemedText></TouchableOpacity>
          </ThemedView>
          <ScrollView style={styles.modalContent}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Rice" />
            <ThemedText style={styles.label}>Quantity</ThemedText>
            <TextInput style={styles.input} value={qty} onChangeText={setQty} placeholder="e.g., 2" keyboardType="decimal-pad" />
            <ThemedText style={styles.label}>Unit</ThemedText>
            <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="e.g., kg, g, each" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={()=>setShowAdd(false)}><ThemedText style={styles.modalSecondaryBtnText}>Cancel</ThemedText></TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={addItem}><ThemedText style={styles.modalPrimaryBtnText}>Save</ThemedText></TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: shared.screenContainer,
  header: { ...shared.headerBar, backgroundColor: '#795548' },
  backButton: shared.backButton,
  backButtonText: shared.backButtonText,
  title:{ color:'#fff', fontSize:28, fontWeight:'bold', marginBottom:5 },
  subtitle:{ color:'#fff', fontSize:16, opacity:0.9 },
  headerActions:{ flexDirection:'row', justifyContent:'center', gap:10, marginTop:12 },
  primaryBtn:{ backgroundColor:'rgba(255,255,255,0.2)', paddingHorizontal:16, paddingVertical:10, borderRadius:18 },
  clearBtn:{ backgroundColor:'rgba(255,255,255,0.15)' },
  primaryBtnText:{ color:'#fff', fontWeight:'600' },
  content:{ padding:16, paddingBottom:40 },
  emptyState:{ alignItems:'center', paddingVertical:40 },
  emptyEmoji:{ fontSize:56, marginBottom:12 },
  emptyTitle:{ fontSize:18, marginBottom:6 },
  emptyDesc:{ opacity:0.7, textAlign:'center' },
  card:{ backgroundColor:'#f9f9f9', borderRadius:12, padding:12, marginBottom:12, borderWidth:1, borderColor:'#e0e0e0' },
  itemName:{ fontSize:16, color:'#333' },
  itemAmount:{ marginTop:4, color:'#5d4037', fontWeight:'600' },
  row:{ flexDirection:'row', gap:10, marginTop:10 },
  smallBtn:{ backgroundColor:'#795548', borderRadius:8, paddingHorizontal:12, paddingVertical:8 },
  smallBtnText:{ color:'#fff', fontWeight:'600' },
  removeBtn:{ backgroundColor:'#a84332' },
  modalContainer:{ flex:1, backgroundColor:'#fff' },
  modalHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, borderBottomWidth:1, borderBottomColor:'#eee', paddingTop:60 },
  modalTitle:{ fontSize:20, fontWeight:'bold', color:'#333' },
  closeButton:{ padding:10 },
  closeButtonText:{ fontSize:20, color:'#666' },
  modalContent:{ padding:16 },
  label:{ marginTop:10, marginBottom:6, color:'#555', fontWeight:'600' },
  input:{ backgroundColor:'#fff', borderRadius:8, borderWidth:1, borderColor:'#ddd', paddingHorizontal:12, paddingVertical:10 },
  modalButtons:{ flexDirection:'row', justifyContent:'space-between', marginTop:16 },
  modalPrimaryBtn:{ backgroundColor:'#795548', paddingHorizontal:16, paddingVertical:12, borderRadius:18 },
  modalPrimaryBtnText:{ color:'#fff', fontWeight:'700' },
  modalSecondaryBtn:{ backgroundColor:'rgba(0,0,0,0.08)', paddingHorizontal:16, paddingVertical:12, borderRadius:18 },
  modalSecondaryBtnText:{ color:'#333', fontWeight:'700' },
});
