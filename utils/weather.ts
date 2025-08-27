// Simple weather utility using the free Open-Meteo API (no API key required)
// Focused on "weather for the day": temp, wind, and rain for given coordinates

export type WeatherCurrent = {
  temperatureC: number | null;
  windSpeedKmh: number | null; // converted from m/s to km/h for readability
  precipitationMm: number | null; // current precip rate mm
};

export type WeatherDaily = {
  precipitationProbabilityMax: number | null; // percent
  precipitationSumMm: number | null; // mm total today
  windSpeedMaxKmh: number | null; // km/h
  tempMaxC?: number | null;
  tempMinC?: number | null;
};

export type WeatherSummary = {
  locationName?: string;
  current: WeatherCurrent;
  daily: WeatherDaily;
  fetchedAt: string; // ISO string
  commute?: { at8C: number | null; at18C: number | null };
};

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number | null;
    wind_speed_10m?: number | null; // m/s
    precipitation?: number | null; // mm
  };
  daily?: {
    time?: string[];
    precipitation_probability_max?: (number | null)[];
    precipitation_sum?: (number | null)[];
    wind_speed_10m_max?: (number | null)[]; // m/s
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: (number | null)[];
  };
};

export async function fetchWeatherSummary(
  latitude: number,
  longitude: number,
  locationName?: string,
  includeHourlyForCommute: boolean = false
): Promise<WeatherSummary> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,precipitation,wind_speed_10m',
    daily: 'precipitation_probability_max,precipitation_sum,wind_speed_10m_max,temperature_2m_max,temperature_2m_min',
    forecast_days: '1',
    timezone: 'auto',
  });
  if (includeHourlyForCommute) {
    params.set('hourly', 'temperature_2m');
  }

  const url = `${OPEN_METEO_BASE}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as OpenMeteoResponse;

  const current: WeatherCurrent = {
    temperatureC: json.current?.temperature_2m ?? null,
    windSpeedKmh: json.current?.wind_speed_10m != null
      ? Math.round((json.current.wind_speed_10m as number) * 3.6)
      : null,
    precipitationMm: json.current?.precipitation ?? null,
  };

  const d = json.daily;
  const daily: WeatherDaily = {
    precipitationProbabilityMax: d?.precipitation_probability_max?.[0] ?? null,
    precipitationSumMm: d?.precipitation_sum?.[0] ?? null,
    windSpeedMaxKmh: d?.wind_speed_10m_max?.[0] != null
      ? Math.round((d!.wind_speed_10m_max![0] as number) * 3.6)
      : null,
    tempMaxC: d?.temperature_2m_max?.[0] ?? null,
    tempMinC: d?.temperature_2m_min?.[0] ?? null,
  };

  let commute: WeatherSummary['commute'] = undefined;
  if (includeHourlyForCommute && json.hourly?.time && json.hourly.temperature_2m) {
    const times = json.hourly.time;
    const temps = json.hourly.temperature_2m;
    const idx8 = times.findIndex((t) => t.endsWith('08:00'));
    const idx18 = times.findIndex((t) => t.endsWith('18:00'));
    commute = {
      at8C: idx8 >= 0 ? (temps[idx8] ?? null) : null,
      at18C: idx18 >= 0 ? (temps[idx18] ?? null) : null,
    };
  }

  return {
    locationName,
    current,
    daily,
  fetchedAt: new Date().toISOString(),
  commute,
  };
}

// Predefined locations for convenience
export const LOCATIONS = {
  // Approximate coordinates
  GUISELEY: { name: 'Guiseley', lat: 53.875, lon: -1.712 },
  LEEDS: { name: 'Leeds', lat: 53.8008, lon: -1.5491 },
};

export function umbrellaAdvice(probability?: number | null, precipSum?: number | null): string {
  if (probability == null && precipSum == null) return '—';
  const prob = probability ?? 0;
  const sum = precipSum ?? 0;
  if (prob >= 60 || sum >= 2) return 'Likely rain — take an umbrella';
  if (prob >= 30) return 'Possible showers — consider a brolly';
  return 'Low chance of rain';
}

export function windAdvice(maxKmh?: number | null): string {
  if (maxKmh == null) return '—';
  if (maxKmh >= 50) return 'Very windy — caution cycling';
  if (maxKmh >= 30) return 'Breezy — hold onto your hat';
  return 'Light winds';
}

function pad(n: number): string { return n < 10 ? `0${n}` : String(n); }
function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Fetches daily+hourly data for exactly the specified date (local timezone via 'auto')
export async function fetchWeatherForDate(
  latitude: number,
  longitude: number,
  date: Date,
  locationName?: string
): Promise<WeatherSummary> {
  const day = ymd(date);
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'precipitation_probability_max,precipitation_sum,wind_speed_10m_max,temperature_2m_max,temperature_2m_min',
    hourly: 'temperature_2m',
    start_date: day,
    end_date: day,
    timezone: 'auto',
  });
  const url = `${OPEN_METEO_BASE}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const json = (await res.json()) as OpenMeteoResponse;

  const d = json.daily;
  const daily: WeatherDaily = {
    precipitationProbabilityMax: d?.precipitation_probability_max?.[0] ?? null,
    precipitationSumMm: d?.precipitation_sum?.[0] ?? null,
    windSpeedMaxKmh: d?.wind_speed_10m_max?.[0] != null
      ? Math.round((d!.wind_speed_10m_max![0] as number) * 3.6)
      : null,
    tempMaxC: d?.temperature_2m_max?.[0] ?? null,
    tempMinC: d?.temperature_2m_min?.[0] ?? null,
  };

  // Commute temps from hourly
  const times = json.hourly?.time ?? [];
  const temps = json.hourly?.temperature_2m ?? [];
  const targetDay = day;
  const idx8 = times.findIndex((t) => t.startsWith(targetDay) && t.endsWith('08:00'));
  const idx18 = times.findIndex((t) => t.startsWith(targetDay) && t.endsWith('18:00'));
  const commute = {
    at8C: idx8 >= 0 ? (temps[idx8] ?? null) : null,
    at18C: idx18 >= 0 ? (temps[idx18] ?? null) : null,
  } as WeatherSummary['commute'];

  return {
    locationName,
    current: { temperatureC: null, windSpeedKmh: null, precipitationMm: null },
    daily,
    fetchedAt: new Date().toISOString(),
    commute,
  };
}

// Internal: get hourly temperature_2m arrays for the date
async function fetchHourlyTempsForDate(latitude: number, longitude: number, date: Date) {
  const day = ymd(date);
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: 'temperature_2m',
    start_date: day,
    end_date: day,
    timezone: 'auto',
  });
  const url = `${OPEN_METEO_BASE}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const json = (await res.json()) as OpenMeteoResponse;
  return {
    times: json.hourly?.time ?? [],
    temps: json.hourly?.temperature_2m ?? [],
  };
}

// Compute the average hourly temperature between two nearby locations for a given day,
// then return the highest average temperature and the time it occurs (local HH:mm).
export async function fetchAvgDailyMaxForLocations(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  date: Date
): Promise<{ maxC: number | null; time: string | null }> {
  const [ha, hb] = await Promise.all([
    fetchHourlyTempsForDate(a.lat, a.lon, date),
    fetchHourlyTempsForDate(b.lat, b.lon, date),
  ]);
  const times = ha.times.length >= hb.times.length ? ha.times : hb.times;
  if (!times.length) return { maxC: null, time: null };

  let bestVal: number | null = null;
  let bestTime: string | null = null;
  for (let i = 0; i < times.length; i++) {
    const ta = ha.temps[i];
    const tb = hb.temps[i];
    const bothNull = (ta == null) && (tb == null);
    if (bothNull) continue;
    const avg = ta != null && tb != null ? (ta + tb) / 2 : (ta ?? tb ?? null);
    if (avg == null) continue;
    if (bestVal == null || avg > bestVal) {
      bestVal = avg;
      // times are local day timestamps like YYYY-MM-DDTHH:00; show HH:mm
      const t = (ha.times[i] ?? hb.times[i] ?? '').slice(-5);
      bestTime = t || null;
    }
  }
  return { maxC: bestVal, time: bestTime };
}
