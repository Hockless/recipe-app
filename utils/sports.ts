// Minimal client for free sports schedules using TheSportsDB (public demo key 3)
// Normalizes events to a common shape for UI.

export type NormalEvent = {
  id: string;
  title: string;
  iso?: string | null; // ISO timestamp if provided
  date?: string | null; // fallback date string (YYYY-MM-DD)
  time?: string | null; // fallback time (HH:mm)
  competition?: string | null;
};

const BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const AF_BASE = (process.env.EXPO_PUBLIC_API_FOOTBALL_BASE as string) || 'https://v3.football.api-sports.io';
const AF_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY as string | undefined;
const RAPID_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY as string | undefined;
const CS2_HOST = (process.env.EXPO_PUBLIC_CS2_HOST as string) || 'csgo-matches-and-tournaments.p.rapidapi.com';
const FPL_BASE = 'https://fantasy.premierleague.com/api'; // Free, no key

async function fetchJson<T>(url: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

async function fetchAF<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  if (!AF_KEY) throw new Error('API-Football key missing');
  const url = new URL(`${AF_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url.toString(), {
      signal: ctrl.signal,
      headers: {
        'x-apisports-key': AF_KEY,
        // Note: If using RapidAPI instead, swap to 'x-rapidapi-key'
      },
    });
    if (!res.ok) throw new Error(`AF HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

// Fantasy Premier League (FPL) – free Premier League fixtures
async function fetchFPL<T>(path: string): Promise<T> {
  const url = `${FPL_BASE}${path}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`FPL HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

async function fetchRapid<T>(host: string, path: string, params: Record<string, string | number | undefined> = {}) {
  if (!RAPID_KEY) throw new Error('RapidAPI key missing');
  const url = new URL(`https://${host}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url.toString(), {
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': host,
        'x-rapidapi-key': RAPID_KEY,
      },
    });
    if (!res.ok) throw new Error(`Rapid HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

function normalizeEvents(events: any[] | undefined | null): NormalEvent[] {
  if (!events) return [];
  return events.map((e) => ({
    id: String(e.idEvent ?? e.id ?? Math.random()),
    title:
      e.strEvent ||
      [e.strHomeTeam, e.strAwayTeam].filter(Boolean).join(' vs ') ||
      e.strFilename ||
      'Match',
    iso: e.strTimestamp ?? e.dateEventLocal ?? null,
    date: e.dateEvent ?? e.dateEventLocal ?? null,
    time: e.strTime || e.strTimeLocal || null,
    competition: e.strLeague ?? e.strSport ?? null,
  }));
}

// Soccer: Leeds United next fixtures
export async function getLeedsFixtures(limit = 5): Promise<NormalEvent[]> {
  // Prefer API-Football if key present; else fallback to TheSportsDB
  if (AF_KEY) {
    try {
      // 1) Find team by search
      const teams = await fetchAF<{
        response: Array<{ team: { id: number; name: string; country?: string }; }>
      }>('/teams', { search: 'Leeds United' });
      const t = (teams.response || []).find(
        (x) => /^leeds united$/i.test(x.team?.name || '') && /england/i.test(x.team?.country || 'England')
      ) || (teams.response || [])[0];
      if (!t?.team?.id) throw new Error('Leeds team not found in AF');

      // 2) Use fixtures next by team (lets AF pick season automatically)
      const fx = await fetchAF<{
        response: Array<{ fixture: { id: number; date: string }; teams: { home: { name: string }, away: { name: string } }, league: { name: string } }>
      }>('/fixtures', { team: t.team.id, next: limit });

      const mapped: NormalEvent[] = (fx.response || []).map((r) => ({
        id: String(r.fixture.id),
        title: `${r.teams.home?.name} vs ${r.teams.away?.name}`,
        iso: r.fixture.date,
        competition: r.league?.name || null,
      }));
      // Safety filter to ensure Leeds is involved
      const onlyLeeds = mapped.filter((e) => /leeds united/i.test(e.title));
      if (onlyLeeds.length) return onlyLeeds.slice(0, limit);
      return mapped.slice(0, limit);
    } catch (e) {
      // fall through to TSD
      // console.debug('AF fallback to TSD:', e);
    }
  }

  // Fallback: TheSportsDB
  const search = await fetchJson<{ teams?: any[] }>(
    `${BASE}/searchteams.php?t=${encodeURIComponent('Leeds United')}`
  );
  const teams = search.teams || [];
  const byExact = teams.find(
    (t) =>
      /^leeds united$/i.test(t.strTeam || '') &&
      /(soccer|football)/i.test(t.strSport || '') &&
      /england/i.test(t.strCountry || '')
  );
  const byAlternate = teams.find(
    (t) =>
      /leeds united/i.test(`${t.strTeam} ${t.strAlternate}`) &&
      /(soccer|football)/i.test(t.strSport || '') &&
      /england/i.test(t.strCountry || '')
  );
  const fallback = teams.find((t) => /leeds/i.test(t.strTeam || '')) || teams[0];
  const team = byExact || byAlternate || fallback;
  if (!team?.idTeam) return [];

  const next = await fetchJson<{ events?: any[] }>(
    `${BASE}/eventsnext.php?id=${encodeURIComponent(team.idTeam)}`
  );
  const onlyLeeds = (next.events || []).filter(
    (e) => /leeds united/i.test(`${e.strHomeTeam || ''} ${e.strAwayTeam || ''}`)
  );
  return normalizeEvents(onlyLeeds).slice(0, limit);
}

// CS2: Upcoming matches via RapidAPI (csgo-matches-and-tournaments)
// Optionally filter by team name substring, e.g., 'FaZe'
export async function getCS2UpcomingMatches(limit = 10, teamFilter?: string): Promise<NormalEvent[]> {
  if (!RAPID_KEY) return [];
  // Endpoint from screenshot: GET /matches?page=1&limit=10
  type RapidTeam = { name?: string };
  type RapidTournament = { name?: string };
  type RapidMatch = {
    id?: string | number;
    name?: string;
    startAt?: string;
    begin_at?: string;
    time?: string;
    team1?: RapidTeam;
    team2?: RapidTeam;
    teams?: RapidTeam[];
    tournament?: RapidTournament;
    league?: { name?: string };
  };
  const data = await fetchRapid<{ data?: RapidMatch[] }>(CS2_HOST, '/matches', { page: 1, limit });
  const items: RapidMatch[] = (data as any).data || (Array.isArray(data) ? (data as any) : []);
  const events: NormalEvent[] = items.map((m) => {
    const t1 = m.team1?.name || m.teams?.[0]?.name || '';
    const t2 = m.team2?.name || m.teams?.[1]?.name || '';
    const title = m.name || (t1 || t2 ? `${t1 || 'TBD'} vs ${t2 || 'TBD'}` : 'Match');
    const iso = m.startAt || m.begin_at || (m.time as any) || null;
    const comp = m.tournament?.name || m.league?.name || null;
    const fallbackId = `${title}-${iso || Math.random()}`;
    return {
      id: String(m.id ?? fallbackId),
      title,
      iso,
      competition: comp,
    } satisfies NormalEvent;
  });
  const filtered = teamFilter ? events.filter((e) => e.title.toLowerCase().includes(teamFilter.toLowerCase())) : events;
  return filtered.slice(0, limit);
}

// UFC: next events for UFC league
export async function getUFCNextEvents(limit = 5): Promise<NormalEvent[]> {
  // Find UFC league id among MMA leagues
  const leagues = await fetchJson<{ leagues?: any[] }>(
    `${BASE}/search_all_leagues.php?s=${encodeURIComponent('Mixed Martial Arts')}`
  );
  const ufc = (leagues.leagues || []).find(
    (l) => /ultimate fighting championship|\bUFC\b/i.test(l.strLeague || '')
  );
  if (!ufc?.idLeague) return [];

  const next = await fetchJson<{ events?: any[] }>(
    `${BASE}/eventsnextleague.php?id=${encodeURIComponent(ufc.idLeague)}`
  );
  return normalizeEvents(next.events).slice(0, limit);
}

// UFC with fight card details (parsed from strFightCard when available)
export async function getUFCNextEventsDetailed(limit = 5): Promise<Array<NormalEvent & { fights: string[] }>> {
  // Identify UFC league as in getUFCNextEvents
  const leagues = await fetchJson<{ leagues?: any[] }>(
    `${BASE}/search_all_leagues.php?s=${encodeURIComponent('Mixed Martial Arts')}`
  );
  const ufc = (leagues.leagues || []).find(
    (l) => /ultimate fighting championship|\bUFC\b/i.test(l.strLeague || '')
  );
  if (!ufc?.idLeague) return [];

  const next = await fetchJson<{ events?: any[] }>(
    `${BASE}/eventsnextleague.php?id=${encodeURIComponent(ufc.idLeague)}`
  );
  const events = (next.events || []).slice(0, limit);

  const detailed = await Promise.allSettled(
    events.map(async (ev: any) => {
      const id = ev.idEvent || ev.id;
      let fights: string[] = [];
      try {
        const detail = await fetchJson<{ events?: any[] }>(
          `${BASE}/lookupevent.php?id=${encodeURIComponent(id)}`
        );
        const d = (detail.events || [])[0] || {};
        const card = d.strFightCard || d.strCard || '';
        if (card) {
          fights = String(card)
            .split(/\r?\n|;|\|/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 20);
        }
      } catch {
        fights = [];
      }
      const norm: NormalEvent = {
        id: String(id ?? Math.random()),
        title: ev.strEvent || dTitle(ev) || 'UFC Event',
        iso: ev.strTimestamp || ev.dateEvent || null,
        date: ev.dateEvent || null,
        time: ev.strTime || null,
        competition: ev.strLeague || 'UFC',
      };
      return { ...norm, fights };
    })
  );

  return detailed
    .filter((r) => r.status === 'fulfilled')
    .map((r: any) => r.value);

  function dTitle(e: any): string | null {
    const home = e.strHomeTeam || '';
    const away = e.strAwayTeam || '';
    if (home || away) return `${home} vs ${away}`.trim();
    return e.strFilename || null;
  }
}

// FaZe Clan Counter-Strike: try to get CS events via TheSportsDB team search
export async function getFaZeCSMatches(limit = 5): Promise<NormalEvent[]> {
  // Attempt 1: search exact CS team name variants
  const queries = [
    'FaZe Clan Counter-Strike',
    'FaZe Counter-Strike',
    'FaZe Clan CS:GO',
    'FaZe Clan',
  ];

  for (const q of queries) {
    const teams = await fetchJson<{ teams?: any[] }>(
      `${BASE}/searchteams.php?t=${encodeURIComponent(q)}`
    );
    const candidates = (teams.teams || []).filter((t) => {
      const name = `${t.strTeam || ''} ${t.strAlternate || ''}`.toLowerCase();
      const sport = (t.strSport || '').toLowerCase();
      const league = (t.strLeague || '').toLowerCase();
      return (
        name.includes('faze') &&
        sport.includes('e') &&
        (league.includes('counter') || name.includes('counter') || name.includes('cs'))
      );
    });

    const team = candidates[0] || teams.teams?.[0];
    if (team?.idTeam) {
      const next = await fetchJson<{ events?: any[] }>(
        `${BASE}/eventsnext.php?id=${encodeURIComponent(team.idTeam)}`
      );
      const norm = normalizeEvents(next.events).filter(
        (e) => /counter|cs/i.test(`${e.competition || ''} ${e.title}`)
      );
      if (norm.length) return norm.slice(0, limit);
    }
  }

  // Fallback: none found
  return [];
}

export function formatLocalTime(e: NormalEvent): string {
  // Prefer ISO timestamp when present
  if (e.iso) {
    const d = new Date(e.iso);
    if (!isNaN(d as any)) return d.toLocaleString();
  }
  if (e.date && e.time) return `${e.date} ${e.time}`;
  if (e.date) return e.date;
  return 'TBA';
}

// Premier League fixtures via FPL
type FPLTeam = { id: number; name: string; short_name: string };
type FPLFixture = {
  id: number;
  event: number | null; // gameweek
  kickoff_time: string | null; // ISO
  team_h: number;
  team_a: number;
};

// Get upcoming Premier League fixtures (league-wide)
export async function getPremierLeagueNextFixtures(limit = 10): Promise<NormalEvent[]> {
  // Load teams to map ids -> names
  const bootstrap = await fetchFPL<{ teams: FPLTeam[] }>('/bootstrap-static/');
  const teams = new Map<number, FPLTeam>(bootstrap.teams.map((t) => [t.id, t]));
  // Get all fixtures; filter to future ones by kickoff_time
  const fixtures = await fetchFPL<FPLFixture[]>('/fixtures/');
  const now = Date.now();
  const upcoming = fixtures
    .filter((f) => f.kickoff_time && new Date(f.kickoff_time).getTime() >= now)
    .sort((a, b) => new Date(a.kickoff_time || 0).getTime() - new Date(b.kickoff_time || 0).getTime())
    .slice(0, limit);

  return upcoming.map((f) => {
    const home = teams.get(f.team_h)?.name || `Team ${f.team_h}`;
    const away = teams.get(f.team_a)?.name || `Team ${f.team_a}`;
    return {
      id: String(f.id),
      title: `${home} vs ${away}`,
      iso: f.kickoff_time,
      competition: f.event ? `Premier League GW ${f.event}` : 'Premier League',
    } satisfies NormalEvent;
  });
}

// Get upcoming fixtures for a specific PL team by (partial) name
export async function getPremierLeagueTeamFixtures(teamName: string, limit = 5): Promise<NormalEvent[]> {
  const bootstrap = await fetchFPL<{ teams: FPLTeam[] }>('/bootstrap-static/');
  const team = bootstrap.teams.find((t) =>
    `${t.name} ${t.short_name}`.toLowerCase().includes(teamName.toLowerCase())
  );
  if (!team) return [];
  const fixtures = await fetchFPL<FPLFixture[]>('/fixtures/');
  const now = Date.now();
  const upcoming = fixtures
    .filter(
      (f) => (f.team_h === team.id || f.team_a === team.id) && f.kickoff_time && new Date(f.kickoff_time).getTime() >= now
    )
    .sort((a, b) => new Date(a.kickoff_time || 0).getTime() - new Date(b.kickoff_time || 0).getTime())
    .slice(0, limit);
  return upcoming.map((f) => {
    const home = bootstrap.teams.find((t) => t.id === f.team_h)?.name || `Team ${f.team_h}`;
    const away = bootstrap.teams.find((t) => t.id === f.team_a)?.name || `Team ${f.team_a}`;
    return {
      id: String(f.id),
      title: `${home} vs ${away}`,
      iso: f.kickoff_time,
      competition: f.event ? `Premier League GW ${f.event}` : 'Premier League',
    } satisfies NormalEvent;
  });
}
