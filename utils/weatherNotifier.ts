import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { LOCATIONS, fetchAvgDailyMaxForLocations, fetchWeatherSummary } from './weather';

// Configure notification handling behavior (optional)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    // Newer Expo adds these fields
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return true;
  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}

export type Guidance = {
  avgTempMaxC: number | null;
  avgTempMinC: number | null;
  commute8C: number | null;
  commute18C: number | null;
  clothing: string;
  peak?: { maxC: number | null; time: string | null };
};

export function clothingAdvice(minC?: number | null, maxC?: number | null, willRain?: boolean, windy?: boolean): string {
  const min = minC ?? 0;
  const max = maxC ?? min;
  // Simple ranges; adjust as desired
  if (max >= 22 && min >= 15) return 'T‑shirt';
  if (max >= 18 && min >= 10) return 'T‑shirt + light layer';
  if (max >= 14 && min >= 7) return 'Bring a jumper';
  if (max >= 10 && min >= 4) return 'Wear a jacket';
  if (max < 10) return 'Warm coat';
  return 'Layer up';
}

export async function buildGuidance(): Promise<Guidance> {
  // Fetch with hourly commute temps included
  const [g, l] = await Promise.all([
    fetchWeatherSummary(LOCATIONS.GUISELEY.lat, LOCATIONS.GUISELEY.lon, LOCATIONS.GUISELEY.name, true),
    fetchWeatherSummary(LOCATIONS.LEEDS.lat, LOCATIONS.LEEDS.lon, LOCATIONS.LEEDS.name, true),
  ]);

  const avg = (a?: number | null, b?: number | null): number | null => {
    if (a == null && b == null) return null;
    const aa = a ?? b ?? null;
    const bb = b ?? a ?? null;
    if (aa == null || bb == null) return aa ?? bb;
    return (aa + bb) / 2;
  };

  const avgMin = avg(g.daily.tempMinC ?? null, l.daily.tempMinC ?? null);
  const avgMax = avg(g.daily.tempMaxC ?? null, l.daily.tempMaxC ?? null);
  const commute8C = avg(g.commute?.at8C ?? null, l.commute?.at8C ?? null);
  const commute18C = avg(g.commute?.at18C ?? null, l.commute?.at18C ?? null);

  // Rain/Wind for hinting
  const willRain = (g.daily.precipitationProbabilityMax ?? 0) >= 50 || (l.daily.precipitationProbabilityMax ?? 0) >= 50;
  const windy = (g.daily.windSpeedMaxKmh ?? 0) >= 35 || (l.daily.windSpeedMaxKmh ?? 0) >= 35;

  const clothing = clothingAdvice(avgMin, avgMax, willRain, windy) +
    (willRain ? ' • Consider rainproof' : '') +
    (windy ? ' • Windproof recommended' : '');

  // Highest average temp and time today
  const today = new Date();
  const peak = await fetchAvgDailyMaxForLocations(
    { lat: LOCATIONS.GUISELEY.lat, lon: LOCATIONS.GUISELEY.lon },
    { lat: LOCATIONS.LEEDS.lat, lon: LOCATIONS.LEEDS.lon },
    today
  );

  return { avgTempMinC: avgMin, avgTempMaxC: avgMax, commute8C, commute18C, clothing, peak };
}

function fmt(n: number | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(n)}°C`;
}

export async function sendTodayNotification(): Promise<void> {
  const hasPerm = await ensureNotificationPermissions();
  if (!hasPerm) return;
  const g = await buildGuidance();
  const title = 'Today’s Clothing Guide';
  const body = `Avg min/max: ${fmt(g.avgTempMinC)} / ${fmt(g.avgTempMaxC)}\nPeak: ${fmt(g.peak?.maxC ?? null)} at ${g.peak?.time ?? '—'}\n08:00: ${fmt(g.commute8C)}  •  18:00: ${fmt(g.commute18C)}\n${g.clothing}`;
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // fire immediately
  });
}

export async function sendRandomClothingNotification(): Promise<void> {
  if (Platform.OS === 'web') return; // not supported on web
  const hasPerm = await ensureNotificationPermissions();
  if (!hasPerm) return;
  const picks = [
    'T‑shirt',
    'T‑shirt + light layer',
    'Bring a jumper',
    'Wear a jacket',
    'Windproof jacket',
    'Rainproof jacket',
    'Warm coat',
  ];
  const pick = picks[Math.floor(Math.random() * picks.length)];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Clothing Guide',
      body: pick,
      data: { type: 'test-clothing', pick },
    },
    trigger: null,
  });
}

export async function scheduleDaily7am(): Promise<void> {
  if (Platform.OS === 'web') return; // not supported on web
  const hasPerm = await ensureNotificationPermissions();
  if (!hasPerm) return;
  // Cancel old schedules to avoid duplicates
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(existing.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  } catch {
    // Some platforms may not support querying; ignore
  }

  // 7am local time daily
  await Notifications.scheduleNotificationAsync({
    content: {
  title: 'Daily clothing guide',
  body: 'Tap to view details',
  data: { type: '7am-weather' },
    },
    trigger: {
      hour: 7,
      minute: 0,
      repeats: true,
      channelId: Platform.select({ android: 'daily-7am', default: undefined }),
    } as any,
  });
}

// Android channel setup (call once)
export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('daily-7am', {
    name: 'Daily 7am',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: undefined,
  });
}

// Initialize scheduling and a listener that, when the 7am stub notification is about to be presented,
// replaces it by sending a fresh weather notification built on-the-fly.
let listenerAttached = false;
export async function initDailyClothingNotifications() {
  if (Platform.OS === 'web') return; // skip on web
  await setupAndroidChannel();
  await scheduleDaily7am();
  if (!listenerAttached) {
    Notifications.addNotificationReceivedListener(async (event) => {
      const t = (event.request.content.data as any)?.type;
      if (t === '7am-weather') {
        // Immediately send an updated notification with computed guidance
        try {
          await sendTodayNotification();
        } catch {}
      }
    });
    listenerAttached = true;
  }
}
