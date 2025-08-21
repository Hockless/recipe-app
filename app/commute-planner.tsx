import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

import { fetchLiveTrains, type LiveTrain } from '@/utils/trainApi';

interface EnrichedTrain extends LiveTrain {
  travelMins: number; // derived (arrival - departure)
}

// Timing assumptions (could later be user configurable)
const MORNING_READY_MINS = 20; // wake + get ready (adjusted per preference)
const WALK_HOME_TO_STATION_MINS = 10; // home -> Guiseley station
const WALK_STATION_TO_OFFICE_MINS = 10; // Leeds station -> office (and reverse in evening)
const WORK_DURATION_MINS = 8.5 * 60; // 8.5 hours
const DEFAULT_BUFFER = 5; // platform / settling buffer

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}

export default function CommutePlannerScreen() {
  const router = useRouter();
  const [inbound, setInbound] = useState<EnrichedTrain[]>([]);   // GSY -> LDS
  const [outbound, setOutbound] = useState<EnrichedTrain[]>([]); // LDS -> GSY
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInboundId, setSelectedInboundId] = useState<string | null>(null);
  const [alarmSetFor, setAlarmSetFor] = useState<string | null>(null); // HH:MM::notificationId

  const enrich = (live: LiveTrain[]): EnrichedTrain[] => live.map(l => {
    const depM = toMinutes(l.departure);
    const arrM = toMinutes(l.arrival);
    return { ...l, travelMins: Math.max(0, arrM - depM) };
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [am, pm] = await Promise.all([
        fetchLiveTrains({ origin: 'GSY', destination: 'LDS' }),
        fetchLiveTrains({ origin: 'LDS', destination: 'GSY' })
      ]);
      setInbound(enrich(am));
      setOutbound(enrich(pm));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('commuteWakeAlarm');
        if (stored) setAlarmSetFor(stored);
      } catch {}
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Selection-based planning
  const inboundChosen = inbound.find(t => t.id === selectedInboundId) || (inbound.length ? inbound[0] : undefined);
  const inboundOfficeArrival = inboundChosen ? toMinutes(inboundChosen.arrival) + WALK_STATION_TO_OFFICE_MINS : undefined;
  // Wake time ensures full (ready + walk) minutes before train departure
  const wakeTime = inboundChosen ? toMinutes(inboundChosen.departure) - (MORNING_READY_MINS + WALK_HOME_TO_STATION_MINS) : undefined;
  const leaveHomeActual = wakeTime !== undefined ? wakeTime + MORNING_READY_MINS : undefined; // after getting ready
  const workFinishTime = inboundOfficeArrival !== undefined ? inboundOfficeArrival + WORK_DURATION_MINS : undefined;
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

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#B3E5FC', dark: '#0d3b4d' }}
      headerImage={<ThemedText style={styles.headerEmoji}>🚆</ThemedText>}
    >
      <ThemedView style={styles.section}>
        <TouchableOpacity onPress={() => (router as any).canGoBack?.() ? router.back() : router.replace('/')} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Commute Planner</ThemedText>
        <ThemedText style={styles.subtitle}>Select a morning train; we calculate the rest.</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <TouchableOpacity style={styles.refreshBtnInline} onPress={onRefresh} activeOpacity={0.8}>
          <ThemedText style={styles.refreshText}>{refreshing || loading ? '…' : '↻'}</ThemedText>
        </TouchableOpacity>
        {inboundChosen && (
          <View style={styles.summaryBox}>
            <ThemedText style={styles.summaryLabel}>Your Day</ThemedText>
            <ThemedText style={styles.summaryText}>
              Wake up at {wakeTime !== undefined ? formatMinutes(wakeTime) : '—'} → leave home at {leaveHomeActual !== undefined ? formatMinutes(leaveHomeActual) : '—'} → get the {inboundChosen.departure} train → arrive at the office for {inboundOfficeArrival !== undefined ? formatMinutes(inboundOfficeArrival) : '—'} → finish at {workFinishTime !== undefined ? formatMinutes(workFinishTime) : '—'} → get the {outboundChosen ? outboundChosen.departure : '—'} train home{!outboundFeasible && outboundEarlyLeaveTime !== undefined && workFinishTime !== undefined ? ` (would need to leave at ${formatMinutes(outboundEarlyLeaveTime)} – only ${Math.max(0, toMinutes(outboundChosen!.departure) - workFinishTime)} mins)` : ''} → arrive home at {homeArrivalTime !== undefined ? formatMinutes(homeArrivalTime) : '—'}
            </ThemedText>
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

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Select Morning Train (GSY → LDS)</ThemedText>
        <FlatList
          data={inbound}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<ThemedText style={{ opacity: 0.6 }}>No trains found.</ThemedText>}
          contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
          renderItem={({ item }) => {
            const arrival = item.arrival;
            const isSelected = inboundChosen?.id === item.id;
            return (
              <TouchableOpacity style={[styles.trainRow, isSelected && styles.trainRowRecommended]} activeOpacity={0.85} onPress={() => setSelectedInboundId(item.id)}>
                <ThemedText style={styles.trainTime}>{item.departure}</ThemedText>
                <ThemedText style={styles.arrow}>➡️</ThemedText>
                <ThemedText style={styles.arrival}>{arrival}</ThemedText>
                {isSelected && <ThemedText style={styles.badge}>Chosen</ThemedText>}
              </TouchableOpacity>
            );
          }}
        />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerEmoji: { fontSize: 120, textAlign: 'center', marginTop: 40 },
  section: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 32 },
  subtitle: { marginTop: 6, opacity: 0.8 },
  backButton: { marginBottom: 8 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: 'rgba(255,255,255,0.75)', margin: 20, padding: 18, borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, gap: 12 },
  refreshBtnInline: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  refreshText: { fontSize: 16, fontWeight: '600' },
  cardTitle: { fontSize: 18, marginBottom: 8 },
  summaryBox: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 14, marginTop: 8 },
  summaryLabel: { fontSize: 12, fontWeight: '700', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  summaryText: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  summaryWarning: { marginTop: 8, fontSize: 13, lineHeight: 18, color: '#b45309', backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, fontWeight: '500' },
  trainRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 14, borderRadius: 14, columnGap: 12 },
  trainRowRecommended: { backgroundColor: '#c8f7ce' },
  trainTime: { fontSize: 18, fontWeight: '600', width: 70 },
  arrow: { fontSize: 16 },
  arrival: { fontSize: 18, fontWeight: '600', flex: 1 },
  badge: { backgroundColor: '#2e7d32', color: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden', fontSize: 12, fontWeight: '700' },
  alarmBtn: { marginTop: 10, backgroundColor: '#1565c0', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14 },
  alarmBtnSet: { backgroundColor: '#455a64' },
  alarmBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
