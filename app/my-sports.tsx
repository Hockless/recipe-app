import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { formatLocalTime, getCS2UpcomingMatches, getLeedsFixtures, getPremierLeagueNextFixtures, getPremierLeagueTeamFixtures, getUFCNextEventsDetailed, type NormalEvent } from '@/utils/sports';

export default function MySportsScreen() {
  const [leeds, setLeeds] = useState<NormalEvent[] | null>(null);
  // focusing on Leeds for now
  const [cs2, setCS2] = useState<NormalEvent[] | null>(null);
  const [pl, setPL] = useState<NormalEvent[] | null>(null);
  const [plTeam, setPLTeam] = useState<NormalEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ufc, setUFC] = useState<{ id: string; title: string; iso?: string | null; fights: string[] }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Load Leeds + CS2 and do not fail the entire page if one source fails
      try {
        const [lRes, cRes, uRes] = await Promise.allSettled([
          getLeedsFixtures(8),
          getCS2UpcomingMatches(6, 'FaZe'),
          getUFCNextEventsDetailed(5),
        ]);
        if (!cancelled) {
          if (lRes.status === 'fulfilled') {
            setLeeds(lRes.value);
            setError(null);
          } else {
            setLeeds([]);
            setError(lRes.reason?.message || 'Failed to load Leeds fixtures');
          }
          if (cRes.status === 'fulfilled') setCS2(cRes.value); else setCS2([]);
          if (uRes.status === 'fulfilled') setUFC(uRes.value); else setUFC([]);
        }
      } catch (e) {
        // ignore top-level; we handle per-promise
      }

      // FPL is blocked by CORS on web; only attempt on native
      if (Platform.OS !== 'web') {
        try {
          const [leagueRes, teamRes] = await Promise.allSettled([
            getPremierLeagueNextFixtures(8),
            getPremierLeagueTeamFixtures('Leeds United', 6),
          ]);
          if (!cancelled) {
            setPL(leagueRes.status === 'fulfilled' ? leagueRes.value : []);
            setPLTeam(teamRes.status === 'fulfilled' ? teamRes.value : []);
          }
        } catch {
          if (!cancelled) {
            setPL([]);
            setPLTeam([]);
          }
        }
      } else {
        // On web, explicitly show unavailable state
        if (!cancelled) {
          setPL([]);
          setPLTeam([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const Loading = () => (
    <View style={styles.loadingRow}>
      <ActivityIndicator />
      <ThemedText style={styles.loadingText}>Loading…</ThemedText>
    </View>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#CCE5FF', dark: '#0B1E3A' }}
      headerImage={<Ionicons size={310} name="football" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Sports</ThemedText>
      </ThemedView>
  <ThemedText>Leeds United fixtures (uses API-Football if key set, else TheSportsDB).</ThemedText>

      {error && (
        <ThemedView style={styles.errorCard}>
          <ThemedText type="defaultSemiBold">Couldn’t load some data</ThemedText>
          <ThemedText>{error}</ThemedText>
        </ThemedView>
      )}

  <Collapsible title="Leeds United (next fixtures)">
        {leeds === null ? (
          <Loading />
        ) : leeds.length === 0 ? (
          <ThemedText>No upcoming fixtures found.</ThemedText>
        ) : (
          leeds.map((e) => (
            <ThemedView key={e.id} style={styles.row}>
              <ThemedText style={styles.eventTitle}>{e.title}</ThemedText>
              <ThemedText style={styles.timeText}>{formatLocalTime(e)}</ThemedText>
              {e.competition && (
                <ThemedText style={styles.compText}>{e.competition}</ThemedText>
              )}
            </ThemedView>
          ))
        )}
      </Collapsible>

      <Collapsible title="Premier League – next fixtures (via FPL free API)">
        {Platform.OS === 'web' ? (
          <ThemedText>
            Not available on web due to CORS. View on Android/iOS device.
          </ThemedText>
        ) : pl === null ? (
          <Loading />
        ) : pl.length === 0 ? (
          <ThemedText>No upcoming fixtures found.</ThemedText>
        ) : (
          pl.map((e) => (
            <ThemedView key={e.id} style={styles.row}>
              <ThemedText style={styles.eventTitle}>{e.title}</ThemedText>
              <ThemedText style={styles.timeText}>{formatLocalTime(e)}</ThemedText>
              {e.competition && (
                <ThemedText style={styles.compText}>{e.competition}</ThemedText>
              )}
            </ThemedView>
          ))
        )}
      </Collapsible>

      <Collapsible title="Premier League – Leeds United (FPL)">
        {Platform.OS === 'web' ? (
          <ThemedText>
            Not available on web due to CORS. View on Android/iOS device.
          </ThemedText>
        ) : plTeam === null ? (
          <Loading />
        ) : plTeam.length === 0 ? (
          <ThemedText>No upcoming fixtures found.</ThemedText>
        ) : (
          plTeam.map((e) => (
            <ThemedView key={e.id} style={styles.row}>
              <ThemedText style={styles.eventTitle}>{e.title}</ThemedText>
              <ThemedText style={styles.timeText}>{formatLocalTime(e)}</ThemedText>
              {e.competition && (
                <ThemedText style={styles.compText}>{e.competition}</ThemedText>
              )}
            </ThemedView>
          ))
        )}
      </Collapsible>

      <Collapsible title="CS2 – Upcoming (via RapidAPI)">
        {cs2 === null ? (
          <Loading />
        ) : cs2.length === 0 ? (
          <ThemedText>
            No matches found. Set EXPO_PUBLIC_RAPIDAPI_KEY to enable this section.
          </ThemedText>
        ) : (
          cs2.map((e) => (
            <ThemedView key={e.id} style={styles.row}>
              <ThemedText style={styles.eventTitle}>{e.title}</ThemedText>
              <ThemedText style={styles.timeText}>{formatLocalTime(e)}</ThemedText>
              {e.competition && (
                <ThemedText style={styles.compText}>{e.competition}</ThemedText>
              )}
            </ThemedView>
          ))
        )}
      </Collapsible>

      <Collapsible title="UFC – Upcoming fight cards">
        {ufc === null ? (
          <Loading />
        ) : ufc.length === 0 ? (
          <ThemedText>No upcoming UFC events found.</ThemedText>
        ) : (
          ufc.map((ev) => (
            <ThemedView key={ev.id} style={styles.ufcEvent}>
              <ThemedText style={styles.eventTitle}>{ev.title}</ThemedText>
              {ev.iso && <ThemedText style={styles.timeText}>{new Date(ev.iso).toLocaleString()}</ThemedText>}
              {ev.fights.length > 0 ? (
                <View style={styles.fightList}>
                  {ev.fights.map((f, i) => (
                    <ThemedText key={`${ev.id}-f-${i}`} style={styles.fightLine}>• {f}</ThemedText>
                  ))}
                </View>
              ) : (
                <ThemedText style={styles.compText}>Fight card TBA</ThemedText>
              )}
            </ThemedView>
          ))
        )}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#4B89DC',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  eventTitle: { fontWeight: '600' },
  timeText: { opacity: 0.8, marginTop: 2 },
  compText: { opacity: 0.65, marginTop: 2, fontSize: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { opacity: 0.8 },
  errorCard: {
    backgroundColor: 'rgba(255,0,0,0.07)',
    borderColor: 'rgba(255,0,0,0.15)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ufcEvent: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  fightList: { marginTop: 6, paddingLeft: 10 },
  fightLine: { fontSize: 14, lineHeight: 20 },
});
