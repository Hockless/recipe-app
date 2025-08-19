import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ReceiptItem {
  name: string;
  qty?: number;
  price?: number;
}

interface Receipt {
  id: string;
  dateISO: string; // YYYY-MM-DD
  vendor?: string;
  total: number;
  currency?: string; // default USD
  imageUri?: string;
  notes?: string;
  items?: ReceiptItem[];
}

const RECEIPTS_KEY = 'receipts';

export default function ReceiptsScreen() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New receipt form state
  const [vendor, setVendor] = useState('');
  const [dateISO, setDateISO] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [total, setTotal] = useState<string>('');
  const [currency, setCurrency] = useState<string>('GBP');
  const [notes, setNotes] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const data = await AsyncStorage.getItem(RECEIPTS_KEY);
      if (data) {
        const parsed: Receipt[] = JSON.parse(data);
        // Most recent first
        parsed.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
        setReceipts(parsed);
      }
    } catch {
      // ignore
    }
  };

  const saveReceipts = async (next: Receipt[]) => {
    await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(next));
    setReceipts(next);
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'We need media library permission to pick a receipt image.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'We need camera permission to take a receipt photo.');
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera');
    }
  };

  const resetForm = () => {
    setVendor('');
    setDateISO(new Date().toISOString().split('T')[0]);
    setTotal('');
    setCurrency('GBP');
    setNotes('');
    setImageUri(undefined);
  };

  const addReceipt = async () => {
    const parsedTotal = parseFloat(total.replace(/[^0-9.\-]/g, ''));
    if (Number.isNaN(parsedTotal) || parsedTotal <= 0) {
      Alert.alert('Invalid total', 'Enter a valid amount greater than 0');
      return;
    }
    if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      Alert.alert('Invalid date', 'Enter a valid date in YYYY-MM-DD format');
      return;
    }

    setLoading(true);
    try {
      const newReceipt: Receipt = {
        id: `${Date.now()}`,
        dateISO,
        vendor: vendor.trim() || undefined,
        total: parsedTotal,
        currency: currency || 'GBP',
        imageUri,
        notes: notes.trim() || undefined,
      };
      const next = [newReceipt, ...receipts];
      await saveReceipts(next);
      setShowAddModal(false);
      resetForm();
    } catch {
      Alert.alert('Error', 'Failed to save receipt');
    } finally {
      setLoading(false);
    }
  };

  const deleteReceipt = async (id: string) => {
    const confirm = Platform.OS === 'web'
      ? (typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm('Delete this receipt?') : true)
      : null;

    if (Platform.OS === 'web') {
      if (!confirm) return;
      const next = receipts.filter(r => String(r.id) !== String(id));
      await saveReceipts(next);
      return;
    }

    Alert.alert('Delete Receipt', 'Are you sure you want to delete this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const next = receipts.filter(r => String(r.id) !== String(id));
        await saveReceipts(next);
      }}
    ]);
  };

  const monthSummary = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const inMonth = receipts.filter(r => {
      const d = new Date(r.dateISO + 'T00:00:00');
      return d.getFullYear() === y && d.getMonth() === m;
    });
    const total = inMonth.reduce((sum, r) => sum + (r.total || 0), 0);
    return { count: inMonth.length, total };
  }, [receipts]);

  const formatCurrency = (amount: number, curr: string = 'GBP') => {
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: curr }).format(amount);
    } catch {
      return `£${amount.toFixed(2)}`;
    }
  };

  // New: Back handler with web/no-history fallback
  const handleBack = () => {
    if ((router as any).canGoBack?.()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const headerTextColor = '#fff';

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ThemedText style={[styles.backButtonText, { color: headerTextColor }]}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.title, { color: headerTextColor }]}>Receipts</ThemedText>
        <ThemedText style={[styles.subtitle, { color: headerTextColor, opacity: 0.9 }]}>Track your food costs by saving receipt images and totals.</ThemedText>
        
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryText}>This month: {formatCurrency(monthSummary.total)}</ThemedText>
          <ThemedText style={styles.summaryText}>({monthSummary.count} receipt{monthSummary.count !== 1 ? 's' : ''})</ThemedText>
        </View>
        
        <TouchableOpacity 
          style={styles.addReceiptButton}
          onPress={() => setShowAddModal(true)}
        >
          <ThemedText style={styles.addReceiptButtonText}>＋ Add Receipt</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.content}>
        {receipts.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>📷</ThemedText>
            <ThemedText type="subtitle" style={styles.emptyTitle}>No receipts yet</ThemedText>
            <ThemedText style={styles.emptyDesc}>Add your first receipt to start tracking costs.</ThemedText>
          </ThemedView>
        ) : (
          receipts.map((r) => (
            <ThemedView key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText type="defaultSemiBold" style={styles.vendorText}>{r.vendor || 'Receipt'}</ThemedText>
                {/* Use en-GB for date display */}
                <ThemedText style={styles.dateText}>{new Date(r.dateISO + 'T00:00:00').toLocaleDateString('en-GB')}</ThemedText>
              </View>
              {r.imageUri ? (
                <Image source={{ uri: r.imageUri }} style={styles.image} contentFit="cover" />
              ) : null}
              <View style={styles.cardFooter}>
                <ThemedText style={styles.totalText}>{formatCurrency(r.total, r.currency)}</ThemedText>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={[styles.smallBtn, styles.danger]} onPress={() => deleteReceipt(r.id)}>
                    <ThemedText style={styles.smallBtnText}>Delete</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              {r.notes ? (
                <ThemedText style={styles.notesText}>{r.notes}</ThemedText>
              ) : null}
            </ThemedView>
          ))
        )}
      </ThemedView>

      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>Add Receipt</ThemedText>

            <ThemedText style={styles.label}>Vendor (optional)</ThemedText>
            <TextInput
              value={vendor}
              onChangeText={setVendor}
              placeholder="e.g., SuperMart"
              style={styles.input}
            />

            <ThemedText style={styles.label}>Date</ThemedText>
            <TextInput
              value={dateISO}
              onChangeText={setDateISO}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Total Amount</ThemedText>
            <TextInput
              value={total}
              onChangeText={setTotal}
              placeholder="e.g., 24.99"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <ThemedText style={styles.label}>Currency</ThemedText>
            <TextInput
              value={currency}
              onChangeText={setCurrency}
              placeholder="GBP"
              autoCapitalize="characters"
              maxLength={3}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Notes (optional)</ThemedText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything to remember"
              style={[styles.input, styles.multiline]}
              multiline
            />

            <View style={styles.imageActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.secondary]} onPress={pickImage}>
                <ThemedText style={styles.actionBtnText}>Pick Image</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.secondary]} onPress={takePhoto}>
                <ThemedText style={styles.actionBtnText}>Take Photo</ThemedText>
              </TouchableOpacity>
            </View>

            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.actionBtn, styles.cancel]} onPress={() => { setShowAddModal(false); }}>
                <ThemedText style={styles.actionBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.primary]} onPress={addReceipt} disabled={loading}>
                <ThemedText style={styles.actionBtnText}>{loading ? 'Saving...' : 'Save Receipt'}</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#2196F3',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 10,
  },
  summaryRow: { 
    marginTop: 8, 
    marginBottom: 12,
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  summaryText: { 
    fontWeight: '600',
    color: '#fff',
    fontSize: 14,
  },
  addReceiptButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 8,
  },
  addReceiptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  content: { 
    padding: 16, 
    paddingBottom: 40 
  },
  headerCard: { backgroundColor: 'rgba(33,150,243,0.08)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(33,150,243,0.2)', marginBottom: 16 },
  headerTitle: { textAlign: 'center', marginBottom: 6, color: '#2196F3' },
  headerSubtitle: { textAlign: 'center', opacity: 0.8 },
  actionsRow: { marginTop: 12, flexDirection: 'row', gap: 8, justifyContent: 'center' },
  actionBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  primary: { backgroundColor: '#2196F3' },
  secondary: { backgroundColor: '#4CAF50' },
  danger: { backgroundColor: '#ff4444' },
  cancel: { backgroundColor: '#757575' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, marginBottom: 6 },
  emptyDesc: { opacity: 0.7 },

  card: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  vendorText: { fontSize: 16, color: '#333' },
  dateText: { fontSize: 12, color: '#666' },
  image: { width: '100%', height: 180, borderRadius: 8, backgroundColor: '#ddd', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardActions: { flexDirection: 'row', gap: 8 },
  smallBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  smallBtnText: { color: '#fff', fontWeight: '600' },
  notesText: { marginTop: 8, color: '#555' },

  modalContainer: { flex: 1 },
  modalContent: { padding: 16, paddingBottom: 40 },
  modalTitle: { textAlign: 'center', marginBottom: 12, color: '#2196F3' },
  label: { marginTop: 10, marginBottom: 6, color: '#555', fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 10 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  imageActions: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 10 },
  preview: { width: '100%', height: 220, borderRadius: 10, backgroundColor: '#ddd' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
});
