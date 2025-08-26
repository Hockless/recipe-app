import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { formatLocalTime, getCS2UpcomingMatches, getLeedsFixtures, type NormalEvent } from '@/utils/sports';

export default function MySportsScreen() {
  const [leeds, setLeeds] = useState<NormalEvent[] | null>(null);
  // focusing on Leeds for now
  const [cs2, setCS2] = useState<NormalEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [l, c] = await Promise.all([
          getLeedsFixtures(8),
          getCS2UpcomingMatches(6, 'FaZe'),
        ]);
        console.log('[MySports] Leeds fixtures:', l);
        console.log('[MySports] CS2 matches (FaZe filter):', c);
        if (!cancelled) {
          setLeeds(l);
          setCS2(c);
        }
      } catch (e: any) {
  console.error('[MySports] Failed to load sports data:', e);
        if (!cancelled) setError(e?.message || 'Failed to load sports data');
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
});
