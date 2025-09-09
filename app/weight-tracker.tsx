import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { shared } from '@/styles/theme';

interface WeightEntry {
  id: string; // weight-<date>
  date: string; // YYYY-MM-DD
  weight: number; // kg (or lbs if user chooses later)
  note?: string;
  createdAt: string; // ISO
  photoUri?: string; // optional selfie for that day
}

const STORAGE_KEY = 'weightTracker:entries:v1';
// Local light blue palette (screen-specific)
const ACCENT = '#0284c7';
const ACCENT_ALT = '#38bdf8';
const ACCENT_SOFT = '#e0f2fe';
const BG_LIGHT = '#f0f7ff';
const CARD_BG = '#e8f4ff';
const CARD_BORDER = '#b6dcf7';

const STORAGE_BACKUP_KEY = 'weightTracker:entries:backup:v1';

interface BackupPayload {
  ts: string; // timestamp
  hash: string; // integrity hash
  entries: WeightEntry[];
}

function hashEntries(list: WeightEntry[]): string {
  try {
    const basis = list
      .slice()
      .sort((a,b)=> a.date.localeCompare(b.date))
      .map(e => `${e.date}:${e.weight}:${e.note||''}:${e.photoUri?1:0}`)
      .join('|');
    let h = 0; for (let i=0;i<basis.length;i++) h = (h * 131 + basis.charCodeAt(i)) >>> 0;
    return h.toString(16);
  } catch { return '0'; }
}

export default function WeightTrackerScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  // Editor states (can edit any date, default today)
  const [editorDate, setEditorDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [editorWeight, setEditorWeight] = useState('');
  const [editorNote, setEditorNote] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg'); // future toggle
  // Profile stats for calculator
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [sex, setSex] = useState<'male' | 'female' | ''>('');
  const [activity, setActivity] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very'>('sedentary');
  const [goalWeight, setGoalWeight] = useState(''); // in display unit
  const [photoViewerUri, setPhotoViewerUri] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // Removed native date picker (module missing in build); manual date entry only

  const todayStr = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WeightEntry[];
        parsed.sort((a,b)=> b.date.localeCompare(a.date));
        setEntries(parsed);
        const existing = parsed.find(e => e.date === editorDate);
        if (existing) {
          setEditorWeight(existing.weight.toString());
          setEditorNote(existing.note || '');
        } else {
          setEditorWeight('');
          setEditorNote('');
        }
      } else {
        // Attempt restore from backup if main missing
        const braw = await AsyncStorage.getItem(STORAGE_BACKUP_KEY);
        if (braw) {
          try {
            const backup = JSON.parse(braw) as BackupPayload;
            if (Array.isArray(backup.entries) && backup.entries.length && backup.hash === hashEntries(backup.entries)) {
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(backup.entries));
              setEntries(backup.entries.sort((a,b)=> b.date.localeCompare(a.date)));
            }
          } catch {}
        }
      }
      const unitPref = await AsyncStorage.getItem('weightTracker:unit');
      if (unitPref === 'lb') setUnit('lb');
      const profRaw = await AsyncStorage.getItem('weightTracker:profile');
      if (profRaw) {
        try { const p = JSON.parse(profRaw); if (p.age) setAge(String(p.age)); if (p.heightCm) setHeightCm(String(p.heightCm)); if (p.sex) setSex(p.sex); if (p.activity) setActivity(p.activity); if (p.goalWeightKg) { const gw = unit === 'lb' ? (p.goalWeightKg / 0.45359237) : p.goalWeightKg; setGoalWeight(gw.toFixed(1)); } } catch {}
      }
      setProfileLoaded(true);
    } catch (e) {
      console.warn('Failed loading weight entries', e);
    }
  }, [editorDate]);

  useEffect(() => { load(); }, [load]);

  // (Date picker disabled to avoid RNCDatePicker missing native module error)

  const saveEntries = async (next: WeightEntry[]) => {
    const sorted = next.sort((a,b)=> b.date.localeCompare(a.date));
    setEntries(sorted);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    // write backup
    const backup: BackupPayload = { ts: new Date().toISOString(), hash: hashEntries(sorted), entries: sorted };
    try { await AsyncStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify(backup)); } catch {}
  };

  const parseNumber = (v: string): number | null => {
    const n = parseFloat(v.replace(/,/g,'').trim());
    return isFinite(n) ? n : null;
  };

  const validateDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

  const upsertEditor = async () => {
    if (!validateDate(editorDate)) { Alert.alert('Invalid date', 'Use format YYYY-MM-DD'); return; }
    const n = parseNumber(editorWeight);
    if (n === null) { Alert.alert('Enter weight', 'Provide a numeric weight'); return; }
    const existingIdx = entries.findIndex(e => e.date === editorDate);
    const id = `weight-${editorDate}`;
    const entry: WeightEntry = { id, date: editorDate, weight: n, note: editorNote.trim() || undefined, createdAt: new Date().toISOString(), photoUri: existingIdx >=0 ? entries[existingIdx].photoUri : undefined };
    let next: WeightEntry[];
    if (existingIdx >= 0) { next = [...entries]; next[existingIdx] = { ...next[existingIdx], ...entry }; }
    else { next = [entry, ...entries]; }
    await saveEntries(next);
  };

  // Ensure an entry exists for today (returns index after ensuring)
  const ensureEditorEntry = async (): Promise<number> => {
    let idx = entries.findIndex(e => e.date === editorDate);
    if (idx >= 0) return idx;
    const n = parseNumber(editorWeight) ?? 0;
    const placeholder: WeightEntry = { id: 'weight-' + editorDate, date: editorDate, weight: n, note: editorNote.trim() || undefined, createdAt: new Date().toISOString() };
    const next = [placeholder, ...entries];
    await saveEntries(next);
    return 0;
  };

  const pickEditorPhoto = async () => {
    if (picking) return;
    try {
      setPicking(true);
      // Ask permission (native); web will auto allow
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Permission needed', 'Media library permission is required.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [3,4],
      });
      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        const idx = await ensureEditorEntry();
        const next = [...entries];
        next[idx] = { ...next[idx], photoUri: uri };
        await saveEntries(next);
      }
    } catch (e) {
      console.warn('Failed picking image', e);
    } finally {
      setPicking(false);
    }
  };

  const removeEditorPhoto = async () => {
    const idx = entries.findIndex(e => e.date === editorDate);
    if (idx < 0) return;
    const next = [...entries];
    delete next[idx].photoUri;
    await saveEntries(next);
  };

  const removeEntry = async (id: string) => {
    Alert.alert('Delete Entry', 'Remove this weight entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const next = entries.filter(e => e.id !== id);
        await saveEntries(next);
      } }
    ]);
  };

  const latest = entries[0];
  const first = entries[entries.length - 1];
  const changeFromStart = useMemo(() => {
    if (!latest || !first) return null;
    const diff = latest.weight - first.weight;
    return diff;
  }, [latest, first]);

  // Derived multi-unit deltas (always compute in kg first)
  const startDeltaUnits = useMemo(() => {
    if (changeFromStart === null) return null;
    // If stored unit is pounds convert to kg, else already kg
    const diffKg = unit === 'lb' ? changeFromStart * 0.45359237 : changeFromStart;
    const diffStone = diffKg / 6.35029318; // 1 st = 6.35029318 kg
    return { diffKg, diffStone };
  }, [changeFromStart, unit]);

  // Fun equivalence (gamification) based on absolute kg lost/gained
  const funMessage = useMemo(() => {
    if (!startDeltaUnits) return null;
    const { diffKg } = startDeltaUnits;
    const absKg = Math.abs(diffKg);
    if (absKg < 0.2) return null; // too small for a fun comparison
    // Reference objects (approximate average masses)
  const refs = [
      // Sub‑1 kg
      { kg: 0.25, label: 'a hamster' },
      { kg: 0.3, label: 'a pair of apples' },
      { kg: 0.45, label: 'a football' },
      { kg: 0.5, label: 'a paperback book stack' },
      { kg: 0.68, label: 'a loaf of bread' },
      { kg: 0.75, label: 'a pineapple' },
      // 1–5 kg
      { kg: 1.0, label: 'a litre of water' },
      { kg: 1.2, label: 'a small laptop' },
      { kg: 1.5, label: 'a large bottle of soda' },
      { kg: 1.8, label: 'a heavy textbook' },
      { kg: 2.0, label: 'a Chihuahua' },
      { kg: 2.5, label: 'a medium kettlebell (5.5 lb)' },
      { kg: 3.0, label: 'a domestic rabbit' },
      { kg: 3.5, label: 'a large bowling pin' },
      { kg: 4.0, label: 'a gallon of paint' },
      { kg: 4.5, label: 'a house cat' },
      { kg: 5.0, label: 'a bag of flour' },
      // 5–10 kg
      { kg: 6.0, label: 'a large laptop backpack (lightly packed)' },
      { kg: 6.8, label: 'a bowling ball' },
      { kg: 7.5, label: 'a large watermelon' },
      { kg: 8.5, label: 'a car tire (small)' },
      { kg: 9.0, label: 'a road bike wheel set' },
      { kg: 10.0, label: 'a crate of oranges (small)' },
      // 10–20 kg
      { kg: 12.0, label: 'a small microwave oven' },
      { kg: 14.0, label: 'an empty mini fridge' },
      { kg: 16.0, label: 'a road bike frame' },
      { kg: 18.0, label: 'a full backpack' },
      { kg: 20.0, label: 'a large office chair (lightweight)' },
      { kg: 22.0, label: 'a case of bottled water (24-pack)' },
      { kg: 24.0, label: 'a border collie' },
      { kg: 25.0, label: 'a mountain bike frame plus wheels' },
      { kg: 27.0, label: 'a 60 lb kettlebell' },
      { kg: 30.0, label: 'a packed suitcase' }
    ];
    let chosen = refs[0];
    for (const r of refs) {
      if (r.kg <= absKg) chosen = r; else break;
    }
    const direction = diffKg < 0 ? 'lost' : 'gained';
    // Message templates (kept light / encouraging)
    const lostTemplates = [
      "You've shed about the weight of {item}.",
      "That's roughly the mass of {item} gone!",
      "You've dropped about a {item} in weight.",
      "Imagine carrying {item}—you aren't now.",
      "Equivalent to {item} saying goodbye." 
    ];
    const gainedTemplates = [
      "You've added about the weight of {item}.",
      "That's roughly a {item} gained.",
      "Progress: about the mass of {item} added.",
      "You've put on roughly a {item}.",
      "Comparable to carrying an extra {item}." 
    ];
    // Stable pseudo-random selection based on milestone + direction
    const seedStr = direction + ':' + chosen.kg.toFixed(2);
    let hash = 0; for (let i=0;i<seedStr.length;i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    const templates = direction === 'lost' ? lostTemplates : gainedTemplates;
    const picked = templates[hash % templates.length];
    return picked.replace('{item}', chosen.label);
  }, [startDeltaUnits]);

  // Milestone badges (every whole kg change from starting weight)
  const milestoneBadges = useMemo(() => {
    if (!first || !latest) return [] as { label: string }[];
    // Convert both to kg for consistent baseline
    const firstKg = unit === 'lb' ? first.weight * 0.45359237 : first.weight;
    const latestKg = unit === 'lb' ? latest.weight * 0.45359237 : latest.weight;
    const diff = latestKg - firstKg; // negative means loss
    const absWhole = Math.floor(Math.abs(diff));
    if (absWhole <= 0) return [];
    const isLoss = diff < 0;
    return Array.from({ length: absWhole }, (_, i) => ({ label: `${isLoss ? '-' : '+'}${i + 1} kg` }));
  }, [first, latest, unit]);

  const changeFromYesterday = useMemo(() => {
    if (!latest) return null;
    const yesterday = entries.find(e => e.date < latest.date);
    if (!yesterday) return null;
    return latest.weight - yesterday.weight;
  }, [entries, latest]);

  // Build simple bar sparkline data (last 60 entries chronological)
  const chartData = useMemo(() => {
    if (!entries.length) return [] as WeightEntry[];
    const asc = [...entries].sort((a,b)=> a.date.localeCompare(b.date));
    return asc.slice(-60); // last 60 days (or fewer)
  }, [entries]);
  const minWeight = useMemo(() => chartData.reduce((m,e)=> e.weight < m ? e.weight : m, chartData.length? chartData[0].weight:0), [chartData]);
  const maxWeight = useMemo(() => chartData.reduce((m,e)=> e.weight > m ? e.weight : m, chartData.length? chartData[0].weight:0), [chartData]);
  const span = maxWeight - minWeight || 1; // avoid div by zero

  const formatWeight = (w:number) => w.toFixed(1);

  const formatDelta = (d: number | null) => d === null ? '—' : (d > 0 ? '+' + d.toFixed(1) : d.toFixed(1));

  const handleBack = () => { if ((router as any).canGoBack?.()) router.back(); else router.replace('/'); };

  // Derived BMI stats
  const latestWeightKg = useMemo(() => {
    if (!entries.length) return null;
    const w = entries[0].weight; // latest
    return unit === 'lb' ? w * 0.45359237 : w; // convert to kg if necessary
  }, [entries, unit]);

  const bmiStats = useMemo(() => {
    const h = parseFloat(heightCm);
    if (!latestWeightKg || !h || h < 80 || h > 250) return null; // simple sanity bounds (cm)
    const m = h / 100;
    const bmi = latestWeightKg / (m * m);
    let category: string;
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else if (bmi < 35) category = 'Obesity I';
    else if (bmi < 40) category = 'Obesity II';
    else category = 'Obesity III';
    const healthyMin = 18.5 * m * m;
    const healthyMax = 24.9 * m * m;
    let deltaToUpper: number | null = null;
    let deltaToLower: number | null = null;
    if (bmi >= 25) deltaToUpper = latestWeightKg - healthyMax; // overweight part (kg above upper healthy)
    if (bmi < 18.5) deltaToLower = healthyMin - latestWeightKg; // kg to gain
    return { bmi, category, healthyMin, healthyMax, deltaToUpper, deltaToLower };
  }, [latestWeightKg, heightCm]);

  const saveProfile = async () => {
    const aNum = parseInt(age, 10);
    const hNum = parseFloat(heightCm);
    if (age && (!aNum || aNum < 5 || aNum > 120)) { Alert.alert('Invalid age'); return; }
    if (heightCm && (!hNum || hNum < 80 || hNum > 250)) { Alert.alert('Height should be in cm (80-250)'); return; }
    const goalNumDisplay = parseFloat(goalWeight);
    const goalWeightKg = goalNumDisplay && isFinite(goalNumDisplay)
      ? (unit === 'lb' ? goalNumDisplay * 0.45359237 : goalNumDisplay)
      : undefined;
    await AsyncStorage.setItem('weightTracker:profile', JSON.stringify({
      age: aNum || undefined,
      heightCm: hNum || undefined,
      sex: sex || undefined,
      activity,
      goalWeightKg
    }));
    Alert.alert('Saved', 'Profile updated');
  };

  // BMR / TDEE
  const bmrStats = useMemo(() => {
    const a = parseInt(age,10); const h = parseFloat(heightCm);
    if (!latestWeightKg || !a || !h || !sex) return null;
    const w = latestWeightKg;
    // Mifflin-St Jeor
    const base = 10*w + 6.25*h - 5*a + (sex === 'male' ? 5 : -161);
    const activityFactors: Record<typeof activity, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very: 1.9
    };
    const tdee = base * activityFactors[activity];
    return { bmr: base, tdee };
  }, [age, heightCm, sex, latestWeightKg, activity]);

  // Goal projection (using last 14 days trend)
  const goalProjection = useMemo(() => {
    if (!latestWeightKg) return null;
    let targetKg: number | null = null;
    const goalNum = parseFloat(goalWeight);
    if (goalWeight && isFinite(goalNum)) {
      targetKg = unit === 'lb' ? goalNum * 0.45359237 : goalNum;
    } else if (bmiStats && bmiStats.deltaToUpper !== null) {
      // override overweight target to healthyMax
      targetKg = bmiStats.healthyMax;
    }
    if (!targetKg || targetKg <= 0) return null;
    if (Math.abs(latestWeightKg - targetKg) < 0.2) return { targetKg, days: 0, date: new Date().toISOString().slice(0,10), rate: 0 };
    const daysWindow = 14;
    const recentAsc = [...entries].sort((a,b)=> a.date.localeCompare(b.date));
    const cutoffDate = new Date(Date.now() - daysWindow*24*3600*1000).toISOString().split('T')[0];
    const windowEntries = recentAsc.filter(e => e.date >= cutoffDate);
    if (windowEntries.length < 5) return null; // not enough data
    const firstW = unit === 'lb' ? (windowEntries[0].weight * 0.45359237) : windowEntries[0].weight;
    const lastW = unit === 'lb' ? (windowEntries[windowEntries.length-1].weight * 0.45359237) : windowEntries[windowEntries.length-1].weight;
    const diff = lastW - firstW; // kg change over window
    const daysSpan = (new Date(windowEntries[windowEntries.length-1].date).getTime() - new Date(windowEntries[0].date).getTime()) / 86400000 || windowEntries.length;
    const dailyRate = diff / daysSpan; // positive gaining, negative losing
    if (dailyRate === 0) return null;
    const remaining = targetKg - latestWeightKg; // negative if target below current
    if ((remaining < 0 && dailyRate >= 0) || (remaining > 0 && dailyRate <=0)) return null; // moving wrong direction
    const estDays = Math.abs(remaining / dailyRate);
    if (!isFinite(estDays) || estDays > 365*5) return null;
    const targetDate = new Date(Date.now() + estDays*86400000);
    return { targetKg, days: estDays, date: targetDate.toISOString().slice(0,10), rate: dailyRate };
  }, [entries, goalWeight, unit, bmiStats, latestWeightKg]);

  return (
    <ScrollView ref={scrollRef} style={[shared.screenContainer, { backgroundColor: BG_LIGHT }]} contentInsetAdjustmentBehavior="automatic">
      <ThemedView style={shared.headerBar}>
        <BackButton onPress={handleBack} />
        <ThemedText type="title" style={shared.screenTitle}>Weight Tracker</ThemedText>
        <ThemedText style={styles.subtitle}>Daily keto progress log ({unit})</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>Entry Editor</ThemedText>
          {/* Date selection row */}
          <View style={[styles.row, { marginBottom: 8 }]}> 
            <TextInput
              style={[styles.input, { flex: 0.6 }]}
              placeholder="YYYY-MM-DD"
              value={editorDate}
              onChangeText={(d)=> setEditorDate(d)}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.dateBtn} onPress={() => setEditorDate(todayStr)}>
              <ThemedText style={styles.dateBtnText}>Today</ThemedText>
            </TouchableOpacity>
          </View>
          {/* Native date picker removed; add again once module available */}
          <View style={styles.row}> 
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder={`e.g. 78.4`}
              value={editorWeight}
              onChangeText={setEditorWeight}
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.unitLabel}>{unit}</ThemedText>
          </View>
          {/* Photo controls */}
          <View style={[styles.row, { marginTop: 12 }]}> 
            {entries.find(e => e.date === editorDate)?.photoUri ? (
              <View style={styles.photoRow}> 
                <TouchableOpacity onPress={() => { const p = entries.find(e => e.date === editorDate)?.photoUri; if (p) setPhotoViewerUri(p); }}>
                  <Image source={entries.find(e => e.date === editorDate)?.photoUri} style={styles.thumb} contentFit="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickEditorPhoto}>
                  <ThemedText style={styles.photoBtnText}>Replace</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoBtn, styles.photoBtnDanger]} onPress={removeEditorPhoto}>
                  <ThemedText style={styles.photoBtnDangerText}>Remove</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickEditorPhoto} activeOpacity={0.85}>
                <ThemedText style={styles.addPhotoBtnText}>{picking ? 'Opening…' : 'Add Selfie'}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="Optional note (fasting, workout, etc.)"
            value={editorNote}
            onChangeText={setEditorNote}
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity style={styles.saveBtn} onPress={upsertEditor} activeOpacity={0.85}>
            <ThemedText style={styles.saveBtnText}>Save Entry</ThemedText>
          </TouchableOpacity>
          {latest && (
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <ThemedText style={styles.metricLabel}>Change (start)</ThemedText>
                <ThemedText style={styles.metricValue}>{formatDelta(changeFromStart)}</ThemedText>
                {startDeltaUnits && (
                  <ThemedText style={styles.metricSub}>
                    {(startDeltaUnits.diffKg > 0 ? '+' : '') + startDeltaUnits.diffKg.toFixed(1)} kg / {(startDeltaUnits.diffStone > 0 ? '+' : '') + startDeltaUnits.diffStone.toFixed(2)} st
                  </ThemedText>
                )}
              </View>
              <View style={styles.metric}><ThemedText style={styles.metricLabel}>Since prev</ThemedText><ThemedText style={styles.metricValue}>{formatDelta(changeFromYesterday)}</ThemedText></View>
            </View>
          )}
          {funMessage && (
            <ThemedText style={styles.gamifyText}>{funMessage}</ThemedText>
          )}
        </ThemedView>

        {/* Body Stats Calculator */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>Body Stats Calculator</ThemedText>
          <ThemedText style={styles.helperText}>Enter height (cm) and age to compute BMI & healthy range.</ThemedText>
          <View style={[styles.row, { marginTop: 4 }]}> 
            <TextInput
              style={styles.input}
              placeholder="Height (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
          <View style={[styles.row, { marginTop: 8 }]}> 
            <View style={styles.segmentGroup}>
              {['male','female'].map(s => (
                <TouchableOpacity key={s} style={[styles.segmentBtn, sex===s && styles.segmentBtnActive]} onPress={()=> setSex(s as any)}>
                  <ThemedText style={[styles.segmentBtnText, sex===s && styles.segmentBtnTextActive]}>{s==='male'?'Male':'Female'}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.segmentGroup}>
              {[
                {k:'sedentary',l:'Sed'},
                {k:'light',l:'Light'},
                {k:'moderate',l:'Mod'},
                {k:'active',l:'Act'},
                {k:'very',l:'V-Act'}
              ].map(o => (
                <TouchableOpacity key={o.k} style={[styles.segmentBtnSmall, activity===o.k && styles.segmentBtnActive]} onPress={()=> setActivity(o.k as any)}>
                  <ThemedText style={[styles.segmentBtnTextSmall, activity===o.k && styles.segmentBtnTextActive]}>{o.l}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.row, { marginTop: 8 }]}> 
            <TextInput
              style={styles.input}
              placeholder={`Goal Weight (${unit})`}
              value={goalWeight}
              onChangeText={setGoalWeight}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.profileSaveBtn} onPress={saveProfile}>
              <ThemedText style={styles.profileSaveBtnText}>Save</ThemedText>
            </TouchableOpacity>
          </View>
          {bmiStats && (
            <View style={styles.bmiResults}>
              <ThemedText style={styles.bmiLine}>BMI: {bmiStats.bmi.toFixed(1)} <ThemedText style={styles.bmiCat}>({bmiStats.category})</ThemedText></ThemedText>
              <ThemedText style={styles.bmiLine}>Healthy range: {bmiStats.healthyMin.toFixed(1)} – {bmiStats.healthyMax.toFixed(1)} kg</ThemedText>
              {bmiStats.deltaToUpper !== null && (
                <ThemedText style={styles.bmiWarn}>Above upper healthy by {bmiStats.deltaToUpper.toFixed(1)} kg</ThemedText>
              )}
              {bmiStats.deltaToLower !== null && (
                <ThemedText style={styles.bmiWarn}>Below healthy minimum by {bmiStats.deltaToLower.toFixed(1)} kg</ThemedText>
              )}
              {!bmiStats.deltaToUpper && !bmiStats.deltaToLower && (
                <ThemedText style={styles.bmiGood}>Within healthy range 🎯</ThemedText>
              )}
              {bmrStats && (
                <ThemedText style={styles.bmiLine}>BMR: {Math.round(bmrStats.bmr)} kcal • Est TDEE: {Math.round(bmrStats.tdee)} kcal</ThemedText>
              )}
              {goalProjection && (
                <ThemedText style={styles.bmiLine}>
                  Projection: reach {goalProjection.targetKg.toFixed(1)} kg in ~{Math.round(goalProjection.days)} days (≈{(goalProjection.rate*7).toFixed(2)} kg/week) → {goalProjection.date}
                </ThemedText>
              )}
              {!goalProjection && goalWeight && (
                <ThemedText style={styles.helperText}>Need more data (2+ weeks trend) for projection.</ThemedText>
              )}
            </View>
          )}
          {!bmiStats && profileLoaded && !!heightCm && entries.length === 0 && (
            <ThemedText style={styles.helperText}>Add a weight entry to compute BMI.</ThemedText>
          )}
        </ThemedView>

        {chartData.length > 1 && (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.label}>Trend (last {chartData.length} {chartData.length===1?'day':'days'})</ThemedText>
            <View style={styles.chartHeaderRow}>
              <ThemedText style={styles.chartRangeText}>{formatWeight(minWeight)}</ThemedText>
              <ThemedText style={styles.chartRangeText}>{formatWeight(maxWeight)}</ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartScroll}
            >
              {chartData.map((e, idx) => {
                const hPct = (e.weight - minWeight) / span; // 0..1
                const barHeight = 28 + hPct * 72; // min 28, max 100
                const isToday = e.date === todayStr;
                const isLatest = idx === chartData.length - 1; // last chronologically
                return (
                  <View key={e.id} style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isToday
                            ? ACCENT
                            : isLatest
                              ? ACCENT_ALT
                              : 'rgba(2,132,199,0.45)',
                          borderColor: isToday ? '#0369a1' : 'rgba(2,132,199,0.55)'
                        }
                      ]}
                    />
                    {idx % Math.ceil(chartData.length/8 || 1) === 0 && (
                      <ThemedText style={styles.barDate}>
                        {e.date.slice(5)}
                      </ThemedText>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            {latest && (
              <ThemedText style={styles.chartSummary}>Latest: {latest.weight.toFixed(1)} {unit} ({formatDelta(changeFromYesterday)} vs prev, {formatDelta(changeFromStart)} vs start)</ThemedText>
            )}
          </ThemedView>
        )}

        {/* Milestone Badges */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>Milestones</ThemedText>
          {milestoneBadges.length === 0 && (
            <ThemedText style={styles.helperText}>Log more entries to earn 1 kg change badges.</ThemedText>
          )}
          {milestoneBadges.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.milestoneScroll}>
              {milestoneBadges.map((m, idx) => {
                const isLast = idx === milestoneBadges.length - 1;
                return (
                  <View key={m.label} style={[styles.badge, isLast && styles.badgeHighlight]}>
                    <ThemedText style={[styles.badgeText, isLast && styles.badgeTextHighlight]}>{m.label}</ThemedText>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </ThemedView>

        <ThemedView style={styles.card}> 
          <ThemedText style={styles.label}>History</ThemedText>
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={async () => {
              try {
                const braw = await AsyncStorage.getItem(STORAGE_BACKUP_KEY);
                if (!braw) { Alert.alert('No backup found'); return; }
                const backup = JSON.parse(braw) as BackupPayload;
                if (!backup.entries?.length) { Alert.alert('Backup empty'); return; }
                if (backup.hash !== hashEntries(backup.entries)) { Alert.alert('Backup corrupt'); return; }
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(backup.entries));
                setEntries(backup.entries.sort((a,b)=> b.date.localeCompare(a.date)));
                Alert.alert('Restored', 'Entries restored from backup');
              } catch {
                Alert.alert('Restore failed', 'Could not restore backup');
              }
            }}
          >
            <ThemedText style={styles.restoreBtnText}>Restore Backup</ThemedText>
          </TouchableOpacity>
          {entries.length === 0 && <ThemedText style={styles.empty}>No entries yet</ThemedText>}
          {entries.map(e => (
            <View key={e.id} style={styles.entryRow}>
              <View style={{flex:1}}>
                <View style={styles.entryHeaderRow}>
                  <ThemedText style={styles.entryDate}>{e.date}</ThemedText>
                  <View style={styles.entryActionsRow}>
                    <TouchableOpacity
                      style={styles.entryEditBtn}
                      onPress={() => {
                        setEditorDate(e.date);
                        setEditorWeight(e.weight.toString());
                        setEditorNote(e.note || '');
                        // scroll to top
                        setTimeout(()=>scrollRef.current?.scrollTo({ y: 0, animated: true }), 10);
                      }}
                    >
                      <ThemedText style={styles.entryEditBtnText}>Edit</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeEntry(e.id)} style={styles.deleteBtn}><ThemedText style={styles.deleteBtnText}>✕</ThemedText></TouchableOpacity>
                  </View>
                </View>
                <ThemedText style={styles.entryWeight}>{e.weight.toFixed(1)} {unit}</ThemedText>
                {e.note && <ThemedText style={styles.entryNote}>{e.note}</ThemedText>}
                {e.photoUri && (
                  <TouchableOpacity onPress={() => { if (e.photoUri) setPhotoViewerUri(e.photoUri); }} style={{marginTop:6, alignSelf:'flex-start'}}>
                    <Image source={e.photoUri} style={styles.historyThumb} contentFit="cover" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ThemedView>
      </ThemedView>

      {/* Fullscreen photo viewer */}
      <Modal visible={!!photoViewerUri} transparent animationType="fade" onRequestClose={() => setPhotoViewerUri(null)}>
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity style={styles.viewerBackdrop} activeOpacity={1} onPress={() => setPhotoViewerUri(null)}>
            {photoViewerUri && (
              <Image source={photoViewerUri} style={styles.viewerImage} contentFit="contain" />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: '#fff', fontSize: 16, opacity: 0.95 },
  content: { padding: 20, gap: 24 },
  card: { backgroundColor: CARD_BG, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: CARD_BORDER },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#0f3553' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, minWidth: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  unitLabel: { fontSize: 16, fontWeight: '600', color: '#0f3553', marginLeft: 4 },
  noteInput: { marginTop: 12, minHeight: 70, textAlignVertical: 'top' },
  saveBtn: { marginTop: 14, backgroundColor: ACCENT, paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#0369a1', shadowOpacity: 0.15, shadowOffset: {width:0,height:2}, shadowRadius: 4 },
  saveBtnText: { color: '#f0f9ff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  metricsRow: { flexDirection: 'row', gap: 14, marginTop: 18 },
  metric: { flex: 1, backgroundColor: '#ffffff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#d3e7f6' },
  metricLabel: { fontSize: 12, fontWeight: '600', color: '#557089', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  metricValue: { fontSize: 18, fontWeight: '700', color: ACCENT },
  metricSub: { fontSize: 11, fontWeight: '600', color: '#3f596d', marginTop: 4 },
  empty: { fontStyle: 'italic', color: '#666' },
  entryRow: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10, gap: 12 },
  entryDate: { fontSize: 14, fontWeight: '600', color: '#0f3553' },
  entryWeight: { fontSize: 20, fontWeight: '700', color: ACCENT, marginTop: 2 },
  entryNote: { fontSize: 13, color: '#555', marginTop: 4 },
  deleteBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  deleteBtnText: { color: '#b91c1c', fontWeight: '700', fontSize: 14 },
  // Chart styles
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chartRangeText: { fontSize: 12, fontWeight: '600', color: '#557089' },
  chartScroll: { alignItems: 'flex-end', paddingVertical: 6, paddingRight: 4 },
  barWrapper: { alignItems: 'center', width: 20, marginRight: 4 },
  bar: { width: 14, borderRadius: 6, borderWidth: 1, justifyContent: 'flex-end' },
  barDate: { fontSize: 9, color: '#555', marginTop: 4 },
  chartSummary: { marginTop: 10, fontSize: 12, color: '#3f596d', fontStyle: 'italic' },
  // Photo styles
  addPhotoBtn: { backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  addPhotoBtnText: { color: '#f0f9ff', fontWeight: '700' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 74, borderRadius: 10, backgroundColor: '#ddd' },
  historyThumb: { width: 48, height: 64, borderRadius: 8, backgroundColor: '#ddd' },
  photoBtn: { backgroundColor: '#d9f0ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  photoBtnText: { color: '#0369a1', fontWeight: '700', fontSize: 12 },
  photoBtnDanger: { backgroundColor: '#ffe5e5' },
  photoBtnDangerText: { color: '#b91c1c', fontWeight: '700', fontSize: 12 },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  viewerImage: { width: '100%', height: '100%' },
  dateBtn: { backgroundColor: ACCENT_SOFT, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  dateBtnText: { fontWeight: '700', color: '#0f3553' },
  entryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryEditBtn: { backgroundColor: ACCENT_SOFT, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  entryEditBtnText: { fontSize: 12, fontWeight: '700', color: '#0369a1' },
  gamifyText: { marginTop: 14, fontSize: 12, color: '#35556d', fontStyle: 'italic' },
  helperText: { fontSize: 12, color: '#666', marginBottom: 8 },
  profileSaveBtn: { backgroundColor: ACCENT_ALT, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flexShrink: 0 },
  profileSaveBtnText: { color: '#083349', fontSize: 13, fontWeight: '700' },
  bmiResults: { marginTop: 10, gap: 4 },
  bmiLine: { fontSize: 13, color: '#333' },
  bmiCat: { fontWeight: '700', color: ACCENT },
  bmiWarn: { fontSize: 12, color: '#b45309', fontWeight: '600' },
  bmiGood: { fontSize: 12, color: '#047857', fontWeight: '700' },
  segmentGroup: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, gap: 4 },
  segmentBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'transparent' },
  segmentBtnSmall: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'transparent' },
  segmentBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: {width:0,height:1}, shadowRadius: 2, elevation: 1 },
  segmentBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  segmentBtnTextSmall: { fontSize: 11, fontWeight: '600', color: '#475569' },
  segmentBtnTextActive: { color: ACCENT },
  milestoneScroll: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  badgeHighlight: { backgroundColor: ACCENT, borderColor: ACCENT },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  badgeTextHighlight: { color: '#fff' },
  restoreBtn: { alignSelf: 'flex-start', backgroundColor: '#d9f0ff', borderWidth: 1, borderColor: '#b6dcf7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 8 },
  restoreBtnText: { fontSize: 12, fontWeight: '600', color: '#0f3553' },
});
