import { BackButton } from '@/components/BackButton';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { shared } from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

// Local shape for trains (replaces previous API-based type)
interface LiveTrain {
  id: string;
  departure: string; // HH:MM
  arrival: string;   // HH:MM
  origin: string;    // 'GSY' | 'LDS'
  destination: string; // 'GSY' | 'LDS'
  platform?: string;
  status?: string;
}

interface EnrichedTrain extends LiveTrain {
  travelMins: number; // derived (arrival - departure)
}

// Timing assumptions (could later be user configurable)
const MORNING_READY_MINS = 20; // wake + get ready (adjusted per preference)
const WALK_HOME_TO_STATION_MINS = 10; // home -> Guiseley station
const WALK_STATION_TO_OFFICE_MINS = 10; // Leeds station -> office (and reverse in evening)
const WORK_DURATION_MINS = 8.5 * 60; // 8.5 hours
const OFFICE_OPEN_MIN = 7 * 60; // 07:00
// Default manual times provided by user
const DEFAULT_MANUAL_INBOUND = [
  '06:16,06:33',
  '06:54,07:09',
  '07:23,07:37',
  '07:52,08:07',
  '08:10,08:26',
  '08:22,08:38',
  '08:30,08:48',
  '08:54,09:10',
  '09:24,09:38',
  '09:54,10:08',
].join('\n');
const DEFAULT_MANUAL_OUTBOUND = [
  '15:03,15:14',
  '15:34,15:46',
  '16:03,16:14',
  '16:33,16:44',
  '17:03,17:14',
  '17:17,17:28',
  '17:33,17:46',
  '17:47,17:59',
  '18:02,18:14',
].join('\n');

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}

const isHHMM = (s: string) => /^\d{2}:\d{2}$/.test(s);
const DEFAULT_TRAVEL_MINS = 15;
const addMinutes = (hhmm: string, mins: number) => {
  const base = toMinutes(hhmm);
  return formatMinutes(base + mins);
};
const parseManualText = (text: string, origin: 'GSY'|'LDS', destination: 'GSY'|'LDS'): LiveTrain[] => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.map((line, idx) => {
    const parts = line.split(',').map(s => s.trim());
    const dep = parts[0];
    const arr = parts[1];
    if (!isHHMM(dep)) return null as any;
    const arrival = isHHMM(arr || '') ? arr! : addMinutes(dep, DEFAULT_TRAVEL_MINS);
    return {
      id: `${origin}-${destination}-m-${idx}-${dep}`,
      departure: dep,
      arrival: arrival,
      origin,
      destination,
    } as LiveTrain;
  }).filter(Boolean) as LiveTrain[];
};

export default function CommutePlannerScreen() {
  const [inbound, setInbound] = useState<EnrichedTrain[]>([]);   // GSY -> LDS
  const [outbound, setOutbound] = useState<EnrichedTrain[]>([]); // LDS -> GSY
  // const [loading] = useState(false);
  const [selectedInboundId, setSelectedInboundId] = useState<string | null>(null);
  const [alarmSetFor, setAlarmSetFor] = useState<string | null>(null); // HH:MM::notificationId
  const [summaryMode, setSummaryMode] = useState<'emoji' | 'words'>('emoji');
  const [sleepHours, setSleepHours] = useState<number | null>(null);

  const enrich = (live: LiveTrain[]): EnrichedTrain[] => live.map(l => {
    const depM = toMinutes(l.departure);
    const arrM = toMinutes(l.arrival);
    return { ...l, travelMins: Math.max(0, arrM - depM) };
  });

  const load = useCallback(async () => {
    try {
      // Always load from manual storage
      const [amText, pmText] = await Promise.all([
        AsyncStorage.getItem('commuteManualInboundTxt'),
        AsyncStorage.getItem('commuteManualOutboundTxt')
      ]);
      const am = parseManualText((amText && amText.trim()) ? amText : DEFAULT_MANUAL_INBOUND, 'GSY', 'LDS');
      const pm = parseManualText((pmText && pmText.trim()) ? pmText : DEFAULT_MANUAL_OUTBOUND, 'LDS', 'GSY');
      setInbound(enrich(am));
      setOutbound(enrich(pm));
    } finally {}
  }, []);

  useEffect(() => {
    load();
    (async () => {
      try {
    const stored = await AsyncStorage.getItem('commuteWakeAlarm');
    if (stored) setAlarmSetFor(stored);
    const savedMode = await AsyncStorage.getItem('commuteSummaryMode');
    if (savedMode === 'emoji' || savedMode === 'words') setSummaryMode(savedMode as 'emoji' | 'words');
        // Seed provided manual times if none saved yet
        const [haveInTxt, haveOutTxt] = await Promise.all([
          AsyncStorage.getItem('commuteManualInboundTxt'),
          AsyncStorage.getItem('commuteManualOutboundTxt')
        ]);
        if (!haveInTxt && !haveOutTxt) {
          await AsyncStorage.setItem('commuteManualInboundTxt', DEFAULT_MANUAL_INBOUND);
          await AsyncStorage.setItem('commuteManualOutboundTxt', DEFAULT_MANUAL_OUTBOUND);
        }
      } catch {}
    })();
  }, [load]);
  // No manual refresh; times are static

  // Selection-based planning (respect office opening 07:00 for default pick)
  let inboundChosen = inbound.find(t => t.id === selectedInboundId) || undefined;
  if (!inboundChosen && inbound.length) {
    inboundChosen = inbound.find(t => (toMinutes(t.arrival) + WALK_STATION_TO_OFFICE_MINS) >= OFFICE_OPEN_MIN) || inbound[0];
  }
  const inboundOfficeArrival = inboundChosen ? toMinutes(inboundChosen.arrival) + WALK_STATION_TO_OFFICE_MINS : undefined;
  const workStartTime = inboundOfficeArrival !== undefined ? Math.max(inboundOfficeArrival, OFFICE_OPEN_MIN) : undefined;
  const officeOpenWaitMins = inboundOfficeArrival !== undefined ? Math.max(0, OFFICE_OPEN_MIN - inboundOfficeArrival) : undefined;
  // Wake time ensures full (ready + walk) minutes before train departure
  const wakeTime = inboundChosen ? toMinutes(inboundChosen.departure) - (MORNING_READY_MINS + WALK_HOME_TO_STATION_MINS) : undefined;
  const leaveHomeActual = wakeTime !== undefined ? wakeTime + MORNING_READY_MINS : undefined; // after getting ready
  const workFinishTime = workStartTime !== undefined ? workStartTime + WORK_DURATION_MINS : undefined;
  // Select outbound train ensuring at least WALK_STATION_TO_OFFICE_MINS after finish; else fallback with warning
  const {
    outboundChosen,
    outboundFeasible,
    outboundEarlyLeaveTime,
  } = (() => {
    if (!outbound.length || workFinishTime === undefined) return { outboundChosen: undefined, outboundFeasible: false, outboundEarlyLeaveTime: undefined };
    const readyForStation = workFinishTime + WALK_STATION_TO_OFFICE_MINS; // earliest station arrival time
    const sorted = [...outbound].sort((a,b) => toMinutes(a.departure) - toMinutes(b.departure));
    const viable = sorted.find(t => toMinutes(t.departure) >= readyForStation);
    if (viable) return { outboundChosen: viable, outboundFeasible: true, outboundEarlyLeaveTime: undefined };
    // No viable train after finish; take last available (but requires early leave)
    const last = sorted[sorted.length - 1];
    const departM = toMinutes(last.departure);
    const requiredLeave = departM - WALK_STATION_TO_OFFICE_MINS; // time you must leave office
    return { outboundChosen: last, outboundFeasible: false, outboundEarlyLeaveTime: requiredLeave };
  })();
  const homeArrivalTime = outboundChosen ? toMinutes(outboundChosen.arrival) + WALK_HOME_TO_STATION_MINS : undefined;

  const scheduleWakeAlarm = async () => {
    if (wakeTime === undefined) return;
    const wakeHHMM = formatMinutes(wakeTime);
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) {
      const req = await Notifications.requestPermissionsAsync();
      if (!req.granted) return;
    }
    const now = new Date();
    const target = new Date();
    target.setHours(Math.floor(wakeTime / 60), wakeTime % 60, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'Wake for train', body: `Wake now to catch the ${inboundChosen?.departure} train. Leave by ${leaveHomeActual !== undefined ? formatMinutes(leaveHomeActual) : ''}.`, sound: true },
      trigger: {
        type: 'calendar',
        hour: target.getHours(),
        minute: target.getMinutes(),
        repeats: false,
      } as Notifications.CalendarTriggerInput,
    });
    await AsyncStorage.setItem('commuteWakeAlarm', wakeHHMM + '::' + id);
    setAlarmSetFor(wakeHHMM + '::' + id);
  };
  const cancelWakeAlarm = async () => {
    if (!alarmSetFor) return;
    const id = alarmSetFor.split('::')[1];
    if (id) { try { await Notifications.cancelScheduledNotificationAsync(id); } catch {} }
    await AsyncStorage.removeItem('commuteWakeAlarm');
    setAlarmSetFor(null);
  };
  const alarmWakeHHMM = alarmSetFor ? alarmSetFor.split('::')[0] : null;
  // Sleep recommendation based on selected wake time
  const sleepAtFor = (hours: number) => {
    if (wakeTime === undefined) return null;
    const mins = Math.max(0, wakeTime - Math.round(hours * 60));
    return formatMinutes(mins);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#B3E5FC', dark: '#0d3b4d' }}
  headerImage={<ThemedText style={styles.headerEmoji}>🚆</ThemedText>}
    >
      <ThemedView style={styles.section}>
        <BackButton textStyle={{ color: '#0f172a' }} />
        <ThemedText type="title" style={styles.title}>Commute Planner</ThemedText>
      </ThemedView>

      {/* Horizontal train picker at top */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Select Morning Train (GSY → LDS)</ThemedText>
        <FlatList
          data={inbound}
          keyExtractor={i => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          renderItem={({ item }) => {
            const isSelected = inboundChosen?.id === item.id;
            const arrivalOk = (toMinutes(item.arrival) + WALK_STATION_TO_OFFICE_MINS) >= OFFICE_OPEN_MIN;
            return (
              <TouchableOpacity
                style={[
                  styles.trainChip,
                  arrivalOk ? styles.trainChipOk : styles.trainChipLate,
                  isSelected && styles.trainChipActive,
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedInboundId(item.id)}
                accessibilityLabel={`Depart ${item.departure}, arrive ${item.arrival}`}
                accessibilityRole="button"
              >
                <ThemedText style={styles.trainChipTime}>{item.departure}</ThemedText>
                <ThemedText style={styles.trainChipArrow}>➡️</ThemedText>
                <ThemedText style={styles.trainChipTime}>{item.arrival}</ThemedText>
              </TouchableOpacity>
            );
          }}
        />
      </ThemedView>

      <ThemedView style={styles.card}>
        <View style={styles.toggleRow}>
          <ThemedText style={styles.cardTitle}>Manual Timetable</ThemedText>
        </View>
        {inboundChosen && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryHeaderRow}>
              <ThemedText style={styles.summaryLabel}>Your Day</ThemedText>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  onPress={async () => { setSummaryMode('emoji'); await AsyncStorage.setItem('commuteSummaryMode', 'emoji'); }}
                  style={[styles.modeBtn, summaryMode === 'emoji' && styles.modeBtnActive]}
                  accessibilityRole="button"
                  accessibilityLabel="Use emoji summary"
                >
                  <ThemedText style={styles.modeBtnText}>🙂</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => { setSummaryMode('words'); await AsyncStorage.setItem('commuteSummaryMode', 'words'); }}
                  style={[styles.modeBtn, summaryMode === 'words' && styles.modeBtnActive]}
                  accessibilityRole="button"
                  accessibilityLabel="Use word summary"
                >
                  <ThemedText style={styles.modeBtnText}>Aa</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            {(() => {
              const steps: { key: string; title: string; t: number }[] = [];
              const push = (key: string, title: string, t?: number) => { if (t !== undefined) steps.push({ key, title, t }); };
              const depIn = toMinutes(inboundChosen.departure);
              const arrIn = toMinutes(inboundChosen.arrival);
              const depOut = outboundChosen ? toMinutes(outboundChosen.departure) : undefined;
              // Optional prepended sleep time based on selected sleepHours
              const sleepStr = sleepHours ? sleepAtFor(sleepHours) : null;
              if (sleepStr) {
                const sM = toMinutes(sleepStr);
                push('sleep', 'Asleep by', sM);
              }
              push('wake', 'Wake up', wakeTime);
              push('leaveHome', 'Leave home', leaveHomeActual);
              push('boardIn', `Board train (${inboundChosen.departure})`, depIn);
              push('arrLds', `Arrive Leeds station (${inboundChosen.arrival})`, arrIn);
              push('arrOffice', 'Arrive near office', inboundOfficeArrival);
              push('start', 'Start work', workStartTime);
              push('finish', 'Finish work', workFinishTime);
              if (outboundChosen) push('boardOut', `Board train home (${outboundChosen.departure})`, depOut);
              if (homeArrivalTime !== undefined) push('home', 'Arrive home', homeArrivalTime);
              const shortTitle = (key: string) => {
                switch (key) {
                  case 'sleep': return 'Asleep by';
                  case 'wake': return 'Wake';
                  case 'leaveHome': return 'Leave';
                  case 'boardIn': return 'Train';
                  case 'arrLds': return 'Leeds';
                  case 'arrOffice': return 'Office';
                  case 'start': return 'Start';
                  case 'finish': return 'Finish';
                  case 'boardOut': return 'Train';
                  case 'home': return 'Home';
                  default: return '';
                }
              };

              const stepEmoji = (key: string) => {
                switch (key) {
                  case 'sleep': return '😴';
                  case 'wake': return '⏰';
                  case 'leaveHome': return '🏠➡️';
                  case 'boardIn': return '🚆';
                  case 'arrLds': return '🏙️';
                  case 'arrOffice': return '🏢';
                  case 'start': return '🧑‍💻';
                  case 'finish': return '🏁';
                  case 'boardOut': return '🚆';
                  case 'home': return '🏠';
                  default: return '•';
                }
              };
        // Build compact single-line summaries for both modes
        const inlineEmoji = steps.map((s, i) => `${i ? ' → ' : ''}${stepEmoji(s.key)} ${formatMinutes(s.t)}`).join('');
        const inlineWords = steps.map((s, i) => `${i ? ' → ' : ''}${shortTitle(s.key)} ${formatMinutes(s.t)}`).join('');
              return (
                <View style={styles.inlineRow}>
          <ThemedText style={styles.inlineText}>{summaryMode === 'emoji' ? inlineEmoji : inlineWords}</ThemedText>
                </View>
              );
            })()}
            {wakeTime !== undefined && (
              <View style={styles.sleepRow}>
                <ThemedText style={styles.sleepLabel}>Sleep by</ThemedText>
                <TouchableOpacity
                  onPress={() => setSleepHours(sleepHours === 8 ? null : 8)}
                  style={[styles.sleepChip, sleepHours === 8 && styles.sleepChipActive]}
                >
                  <ThemedText style={styles.sleepChipText}>8h: {sleepAtFor(8) ?? '--:--'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSleepHours(sleepHours === 8.5 ? null : 8.5)}
                  style={[styles.sleepChip, sleepHours === 8.5 && styles.sleepChipActive]}
                >
                  <ThemedText style={styles.sleepChipText}>8.5h: {sleepAtFor(8.5) ?? '--:--'}</ThemedText>
                </TouchableOpacity>
              </View>
            )}
            {!outboundFeasible && outboundChosen && (
              <ThemedText style={styles.summaryWarning}>Last train is before you can realistically leave (need full {WALK_STATION_TO_OFFICE_MINS} min walk). Consider an earlier inbound train or shorter day.</ThemedText>
            )}
            {wakeTime !== undefined && (
              <TouchableOpacity style={[styles.alarmBtn, alarmWakeHHMM === formatMinutes(wakeTime) && styles.alarmBtnSet]} onPress={alarmWakeHHMM === formatMinutes(wakeTime) ? cancelWakeAlarm : scheduleWakeAlarm}>
                <ThemedText style={styles.alarmBtnText}>{alarmWakeHHMM === formatMinutes(wakeTime) ? 'Cancel Wake Alarm' : 'Set Wake Alarm'}</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ThemedView>

  {/* Manual editor removed */}

  {/* Removed bottom vertical selector in favor of top horizontal chips */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerEmoji: { fontSize: 96, textAlign: 'center', marginTop: 24 },
  section: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 32 },
  subtitle: { marginTop: 6, opacity: 0.8 },
  backButton: shared.backButton,
  backButtonText: shared.backButtonText,
  card: { backgroundColor: 'rgba(255,255,255,0.75)', margin: 20, padding: 18, borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, gap: 12 },
  refreshBtnInline: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  refreshText: { fontSize: 16, fontWeight: '600' },
  cardTitle: { fontSize: 18, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  manualEditBtn: { backgroundColor: '#1565c0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  manualEditText: { color: '#fff', fontWeight: '700' },
  helperText: { fontSize: 12, opacity: 0.7 },
  manualInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 10, minHeight: 80, textAlignVertical: 'top', backgroundColor: '#fff' },
  summaryBox: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 14, marginTop: 8 },
  summaryTimeline: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  stepTile: { width: '48%', gap: 4 },
  durationCaption: { fontSize: 12, opacity: 0.6, marginLeft: 2 },
  // Compact single-column summary
  summaryColumn: { gap: 4, marginTop: 6 },
  stepRowCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderColor: '#e5e7eb', borderWidth: 1 },
  stepEmoji: { fontSize: 18, marginRight: 8 },
  stepTimeCompact: { fontSize: 16, fontWeight: '700', color: '#111827' },
  // Inline summary row
  inlineRow: { marginTop: 6 },
  inlineText: { fontSize: 16, fontWeight: '600' },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderColor: '#e5e7eb', borderWidth: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  stepTime: { fontSize: 14, fontWeight: '700', color: '#111827' },
  summaryLabel: { fontSize: 12, fontWeight: '700', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  summaryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  modeToggle: { flexDirection: 'row', gap: 6 },
  modeBtn: { backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  modeBtnActive: { backgroundColor: '#c7d2fe' },
  modeBtnText: { fontWeight: '700' },
  summaryText: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  summaryWarning: { marginTop: 8, fontSize: 13, lineHeight: 18, color: '#b45309', backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, fontWeight: '500' },
  trainRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 14, borderRadius: 14, columnGap: 12 },
  trainRowRecommended: { backgroundColor: '#c8f7ce' },
  trainTime: { fontSize: 18, fontWeight: '600', width: 70 },
  arrow: { fontSize: 16 },
  arrival: { fontSize: 18, fontWeight: '600', flex: 1 },
  // Horizontal chip selector
  trainChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb' },
  trainChipOk: { backgroundColor: '#e8f5e9', borderColor: '#a5d6a7' },
  trainChipLate: { backgroundColor: '#fff3e0', borderColor: '#ffcc80' },
  trainChipActive: { backgroundColor: '#c8f7ce', borderColor: '#2e7d32' },
  trainChipTime: { fontSize: 16, fontWeight: '700' },
  trainChipArrow: { fontSize: 14, marginHorizontal: 8 },
  badge: { backgroundColor: '#2e7d32', color: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden', fontSize: 12, fontWeight: '700' },
  alarmBtn: { marginTop: 10, backgroundColor: '#1565c0', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14 },
  saveBtn: { backgroundColor: '#2e7d32', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14 },
  alarmBtnSet: { backgroundColor: '#455a64' },
  alarmBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  // Sleep suggestions
  sleepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  sleepLabel: { fontSize: 12, fontWeight: '700', opacity: 0.6 },
  sleepChip: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  sleepChipActive: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  sleepChipText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
});
