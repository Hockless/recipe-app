import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LOCATIONS, WeatherSummary, fetchWeatherForDate, fetchWeatherSummary, umbrellaAdvice, windAdvice } from '@/utils/weather';
import { sendRandomClothingNotification } from '@/utils/weatherNotifier';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export default function WeatherScreen() {
  const [guiseley, setGuiseley] = useState<WeatherSummary | null>(null);
  const [leeds, setLeeds] = useState<WeatherSummary | null>(null);
  const [guiseleyTomorrow, setGuiseleyTomorrow] = useState<WeatherSummary | null>(null);
  const [leedsTomorrow, setLeedsTomorrow] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDay, setActiveDay] = useState<'today' | 'tomorrow'>('today');

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Today (required)
      const [g, l] = await Promise.all([
        fetchWeatherSummary(LOCATIONS.GUISELEY.lat, LOCATIONS.GUISELEY.lon, LOCATIONS.GUISELEY.name),
        fetchWeatherSummary(LOCATIONS.LEEDS.lat, LOCATIONS.LEEDS.lon, LOCATIONS.LEEDS.name),
      ]);
      setGuiseley(g);
      setLeeds(l);
      // Tomorrow (best-effort)
      const [gT, lT] = await Promise.allSettled([
        fetchWeatherForDate(LOCATIONS.GUISELEY.lat, LOCATIONS.GUISELEY.lon, tomorrow, LOCATIONS.GUISELEY.name),
        fetchWeatherForDate(LOCATIONS.LEEDS.lat, LOCATIONS.LEEDS.lon, tomorrow, LOCATIONS.LEEDS.name),
      ]).then((res) => res.map((r) => (r.status === 'fulfilled' ? r.value : null)) as [WeatherSummary | null, WeatherSummary | null]);
      setGuiseleyTomorrow(gT);
      setLeedsTomorrow(lT);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Horizontal swipe left/right to switch between Today and Tomorrow
  const swipeGesture = useMemo(() =>
    Gesture.Pan()
      .activeOffsetX([-20, 20]) // require some horizontal movement
      .failOffsetY([-12, 12]) // if vertical scroll is significant, let parent scroll
      .onEnd((e) => {
        const dx = e.translationX;
        const vx = e.velocityX ?? 0;
        const threshold = 60; // px
        const velocityThreshold = 600; // px/s
        if (dx < -threshold || vx < -velocityThreshold) {
          // Swiped left → go to tomorrow if available
          setActiveDay('tomorrow');
        } else if (dx > threshold || vx > velocityThreshold) {
          // Swiped right → go to today
          setActiveDay('today');
        }
      }),
  []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#87CEEB', dark: '#1e3a5f' }}
      headerImage={
        <ThemedView style={styles.headerContainer}>
          <ThemedText style={styles.headerEmoji}>☀️🌧️💨</ThemedText>
        </ThemedView>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.mainTitle}>
          {activeDay === 'today' ? 'Today’s Weather' : 'Tomorrow’s Weather'}
        </ThemedText>
        <ThemedText style={styles.subtitle}>Guiseley ↔ Leeds commuter snapshot</ThemedText>

        {/* Simple toggle as an alternative to swipe */}
        <View style={styles.switchRow}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setActiveDay('today')}
            style={[styles.switchPill, activeDay === 'today' && styles.switchPillActive]}
          >
            <ThemedText style={[styles.switchText, activeDay === 'today' && styles.switchTextActive]}>Today</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setActiveDay('tomorrow')}
            style={[styles.switchPill, activeDay === 'tomorrow' && styles.switchPillActive]}
          >
            <ThemedText style={[styles.switchText, activeDay === 'tomorrow' && styles.switchTextActive]}>Tomorrow</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.hint}>Swipe left/right to switch</ThemedText>
      </ThemedView>

      {loading && (
        <View style={styles.center}> 
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 12 }}>Loading weather…</ThemedText>
        </View>
      )}

      {!loading && error && (
        <ThemedView style={styles.errorBox}>
          <ThemedText type="defaultSemiBold">{error}</ThemedText>
          <ThemedText style={{ marginTop: 8 }} onPress={() => void load()}>Tap to retry</ThemedText>
        </ThemedView>
      )}

      {!loading && !error && (
        <GestureDetector gesture={swipeGesture}>
          <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            {/* Active page content */}
            {activeDay === 'today' ? (
              <>
                <ThemedView style={styles.cardsRow}>
                  {guiseley && <LocationCard data={guiseley} />}
                  {leeds && <LocationCard data={leeds} />}
                </ThemedView>
                <ThemedView style={styles.tipBox}>
                  <ThemedText type="subtitle">Advice</ThemedText>
                  <ThemedText style={styles.tipLine}>Umbrella: {umbrellaAdvice(guiseley?.daily.precipitationProbabilityMax, guiseley?.daily.precipitationSumMm)}</ThemedText>
                  <ThemedText style={styles.tipLine}>Wind: {windAdvice(Math.max(
                    guiseley?.daily.windSpeedMaxKmh ?? 0,
                    leeds?.daily.windSpeedMaxKmh ?? 0
                  ))}</ThemedText>
                  <TouchableOpacity style={styles.testBtn} onPress={() => void sendRandomClothingNotification()}>
                    <ThemedText style={styles.testBtnText}>Send test notification</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </>
            ) : (
              <>
                {(guiseleyTomorrow || leedsTomorrow) ? (
                  <>
                    <ThemedView style={styles.cardsRow}>
                      {guiseleyTomorrow && <LocationCard data={guiseleyTomorrow} />}
                      {leedsTomorrow && <LocationCard data={leedsTomorrow} />}
                    </ThemedView>
                    <ThemedView style={styles.tipBox}>
                      <ThemedText type="subtitle">Advice</ThemedText>
                      <ThemedText style={styles.tipLine}>Umbrella: {umbrellaAdvice(guiseleyTomorrow?.daily.precipitationProbabilityMax, guiseleyTomorrow?.daily.precipitationSumMm)}</ThemedText>
                      <ThemedText style={styles.tipLine}>Wind: {windAdvice(Math.max(
                        guiseleyTomorrow?.daily.windSpeedMaxKmh ?? 0,
                        leedsTomorrow?.daily.windSpeedMaxKmh ?? 0
                      ))}</ThemedText>
                    </ThemedView>
                  </>
                ) : (
                  <View style={styles.center}> 
                    <ThemedText>Tomorrow’s forecast isn’t available yet.</ThemedText>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </GestureDetector>
      )}
    </ParallaxScrollView>
  );
}

function LocationCard({ data }: { data: WeatherSummary }) {
  return (
    <ThemedView style={styles.card}>
      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{data.locationName}</ThemedText>
      <ThemedText style={styles.kv}>
        <ThemedText type="defaultSemiBold">Temp:</ThemedText> {data.current.temperatureC != null
          ? fmt(data.current.temperatureC, '°C')
          : `${fmt(data.daily.tempMinC, '°C')} – ${fmt(data.daily.tempMaxC, '°C')}`}
      </ThemedText>
      <ThemedText style={styles.kv}><ThemedText type="defaultSemiBold">Wind:</ThemedText> {fmt(data.current.windSpeedKmh, ' km/h')} (max {fmt(data.daily.windSpeedMaxKmh, ' km/h')})</ThemedText>
      <ThemedText style={styles.kv}><ThemedText type="defaultSemiBold">Rain:</ThemedText> {fmt(data.daily.precipitationProbabilityMax, '%')} • {fmt(data.daily.precipitationSumMm, ' mm')}</ThemedText>
      <ThemedText style={styles.stamp}>Updated {new Date(data.fetchedAt).toLocaleTimeString()}</ThemedText>
    </ThemedView>
  );
}

function fmt(v?: number | null, suffix = ''): string {
  if (v == null || Number.isNaN(v)) return '—';
  return `${Math.round(v)}${suffix}`;
}

const styles = StyleSheet.create({
  headerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerEmoji: { fontSize: 64 },
  titleContainer: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#1e90ff' },
  subtitle: { opacity: 0.8, marginTop: 6 },
  switchRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  switchPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(30,144,255,0.35)',
    backgroundColor: 'transparent',
  },
  switchPillActive: {
    backgroundColor: 'rgba(30,144,255,0.2)',
    borderColor: 'rgba(30,144,255,0.6)'
  },
  switchText: { fontWeight: '600', opacity: 0.8 },
  switchTextActive: { opacity: 1 },
  hint: { marginTop: 6, opacity: 0.6, fontSize: 12 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  errorBox: { margin: 20, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(30,144,255,0.3)' },
  cardsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  card: {
    flex: 1,
    backgroundColor: 'rgba(30,144,255,0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(30,144,255,0.22)'
  },
  cardTitle: { fontSize: 18, marginBottom: 8 },
  kv: { marginTop: 6 },
  stamp: { marginTop: 10, opacity: 0.6, fontSize: 12 },
  tipBox: { marginTop: 20, marginHorizontal: 20, padding: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.06)' },
  tipLine: { marginTop: 8 },
  testBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30,144,255,0.2)',
    borderColor: 'rgba(30,144,255,0.35)',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  testBtnText: { fontWeight: '700' },
  tomorrowHeader: { alignItems: 'center', marginTop: 26, paddingHorizontal: 20 },
  tomorrowTitle: { fontSize: 22, fontWeight: '800', color: '#1e90ff' },
});
