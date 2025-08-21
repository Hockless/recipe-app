// Lightweight wrapper for fetching UK train times (Guiseley ↔ Leeds) using TransportAPI style endpoint.
// No hard-coded secrets; expects EXPO_PUBLIC_TRANSPORT_API_ID and EXPO_PUBLIC_TRANSPORT_API_KEY.
// Falls back to a static sample timetable if env vars missing or call fails.

export interface LiveTrain {
  id: string;
  departure: string; // HH:MM
  arrival: string;   // HH:MM
  origin: string;
  destination: string;
  platform?: string;
  status?: string; // on time / delayed etc
}

const SAMPLE_GSY_LDS: LiveTrain[] = [
  // Earlier options (approx 15 min journey)
  { id: 's-2', departure: '07:02', arrival: '07:17', origin: 'GSY', destination: 'LDS' },
  { id: 's-1', departure: '07:17', arrival: '07:32', origin: 'GSY', destination: 'LDS' },
  // Core window
  { id: 's1', departure: '07:32', arrival: '07:47', origin: 'GSY', destination: 'LDS' },
  { id: 's2', departure: '07:52', arrival: '08:07', origin: 'GSY', destination: 'LDS' }, // user usual train
  { id: 's3', departure: '08:12', arrival: '08:27', origin: 'GSY', destination: 'LDS' },
  // Later options
  { id: 's4', departure: '08:27', arrival: '08:42', origin: 'GSY', destination: 'LDS' },
  { id: 's5', departure: '08:42', arrival: '08:57', origin: 'GSY', destination: 'LDS' },
];

const SAMPLE_LDS_GSY: LiveTrain[] = [
  // Earlier options (approx 15 min journey)
  { id: 'r-2', departure: '16:35', arrival: '16:50', origin: 'LDS', destination: 'GSY' },
  { id: 'r-1', departure: '16:50', arrival: '17:05', origin: 'LDS', destination: 'GSY' },
  // Core window
  { id: 'r1', departure: '17:05', arrival: '17:20', origin: 'LDS', destination: 'GSY' },
  { id: 'r2', departure: '17:20', arrival: '17:35', origin: 'LDS', destination: 'GSY' },
  { id: 'r3', departure: '17:35', arrival: '17:50', origin: 'LDS', destination: 'GSY' },
  // Later options
  { id: 'r4', departure: '17:50', arrival: '18:05', origin: 'LDS', destination: 'GSY' },
  { id: 'r5', departure: '18:05', arrival: '18:20', origin: 'LDS', destination: 'GSY' },
];

interface FetchOptions {
  origin: 'GSY' | 'LDS';
  destination: 'GSY' | 'LDS';
  max?: number;
  provider?: 'transportapi' | 'darwin' | 'sample';
}

export async function fetchLiveTrains({ origin, destination, max = 8, provider }: FetchOptions): Promise<LiveTrain[]> {
  // Restrict to Monday-Friday. getDay(): 0=Sun,6=Sat
  const day = new Date().getDay();
  if (day === 0 || day === 6) return [];

  const selected = provider || (process.env.EXPO_PUBLIC_TRAIN_PROVIDER as any) || 'transportapi';

  if (selected === 'sample') {
    return (origin === 'GSY' ? SAMPLE_GSY_LDS : SAMPLE_LDS_GSY).slice(0, max);
  }

  if (selected === 'darwin') {
    // Placeholder for National Rail Darwin OpenLDBWS SOAP API integration.
    // Would require EXPO_PUBLIC_DARWIN_TOKEN and a server/proxy because SOAP over TLS is not ideal directly from RN.
    // For now we fallback to sample until credentials & proxy are provided.
    return (origin === 'GSY' ? SAMPLE_GSY_LDS : SAMPLE_LDS_GSY).slice(0, max);
  }

  // Default: transportapi
  const appId = process.env.EXPO_PUBLIC_TRANSPORT_API_ID;
  const appKey = process.env.EXPO_PUBLIC_TRANSPORT_API_KEY;
  if (!appId || !appKey) {
    return (origin === 'GSY' ? SAMPLE_GSY_LDS : SAMPLE_LDS_GSY).slice(0, max);
  }
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    darwin: 'false',
    destination: destination,
    train_status: 'passenger'
  });
  const url = `https://transportapi.com/v3/uk/train/station/${origin}/live.json?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('bad status');
    const json: any = await res.json();
    const services: any[] = json.departures?.all || [];
    const mapped: LiveTrain[] = services.slice(0, max).map((svc, idx) => {
      const dep = svc.expected_departure_time || svc.aimed_departure_time;
      const arr = svc.expected_arrival_time || svc.aimed_arrival_time || dep;
      return {
        id: svc.service || `${origin}-${destination}-${idx}`,
        departure: dep,
        arrival: arr,
        origin,
        destination,
        platform: svc.platform,
        status: svc.status,
      } as LiveTrain;
    }).filter(t => t.departure && t.arrival);
    if (!mapped.length) throw new Error('empty');
    return mapped;
  } catch {
    return (origin === 'GSY' ? SAMPLE_GSY_LDS : SAMPLE_LDS_GSY).slice(0, max);
  }
}
