import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed static import to avoid bundling issues on web
// import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Storage keys
const KEY_PAUSED = 'binPaused';
const KEY_NEXT_COLOR = 'binNextBinColor'; // 'green' | 'black'
const KEY_SCHEDULED_ID = 'binScheduledId';

 type BinColor = 'green' | 'black';

// Dynamically loaded notifications module (native only)
let NotificationsMod: typeof import('expo-notifications') | null = null;
const isWeb = Platform.OS === 'web';

export default function BinRemindersScreen() {
  const router = useRouter();
  const [paused, setPaused] = useState<boolean>(false);
  const [nextColor, setNextColor] = useState<BinColor>('green');
  const [scheduledId, setScheduledId] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [pausedRaw, colorRaw, idRaw] = await Promise.all([
          AsyncStorage.getItem(KEY_PAUSED),
          AsyncStorage.getItem(KEY_NEXT_COLOR),
          AsyncStorage.getItem(KEY_SCHEDULED_ID),
        ]);
        setPaused(pausedRaw ? JSON.parse(pausedRaw) : false);
        setNextColor((colorRaw as BinColor) || 'green');
        setScheduledId(idRaw || null);
      } catch (e) {
        console.warn('Failed to load bin reminder settings', e);
      }

      if (!isWeb) {
        // Load notifications module only on native
        const mod = await import('expo-notifications');
        NotificationsMod = mod;

        // Permissions
        const { status } = await mod.requestPermissionsAsync();
        setPermissionGranted(status === 'granted');

        // Android channel
        if (Platform.OS === 'android') {
          await mod.setNotificationChannelAsync('default', {
            name: 'default',
            importance: mod.AndroidImportance.DEFAULT,
          });
        }

        // Set handler
        mod.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            // Newer iOS presentation options
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      } else {
        // Web: no native notifications from expo-notifications
        setPermissionGranted(false);
      }
    })();
  }, []);

  const savePaused = async (value: boolean) => {
    setPaused(value);
    await AsyncStorage.setItem(KEY_PAUSED, JSON.stringify(value));
  };

  const saveNextColor = async (color: BinColor) => {
    setNextColor(color);
    await AsyncStorage.setItem(KEY_NEXT_COLOR, color);
  };

  const saveScheduledId = async (id: string | null) => {
    setScheduledId(id);
    if (id) {
      await AsyncStorage.setItem(KEY_SCHEDULED_ID, id);
    } else {
      await AsyncStorage.removeItem(KEY_SCHEDULED_ID);
    }
  };

  const other = (c: BinColor): BinColor => (c === 'green' ? 'black' : 'green');

  const getNextTuesday17 = () => {
    const now = new Date();
    const next = new Date(now);
    const day = now.getDay(); // Sun 0 ... Sat 6, Tue = 2
    const daysAhead = (2 - day + 7) % 7; // how many days until next Tuesday (0 if today Tue)
    next.setDate(
      now.getDate() + (daysAhead === 0 && (now.getHours() < 17 || (now.getHours() === 16 && now.getMinutes() <= 59)) ? 0 : (daysAhead === 0 ? 7 : daysAhead))
    );
    next.setHours(17, 0, 0, 0);
    return next;
  };

  const ensureNativeNotifications = (): boolean => {
    if (isWeb || !NotificationsMod) {
      Alert.alert('Not available on web', 'Use the mobile app to schedule or test bin reminders.');
      return false;
    }
    return true;
  };

  const scheduleNext = async () => {
    if (!ensureNativeNotifications()) return;

    const when = getNextTuesday17();

    // Permissions
    if (!permissionGranted) {
      const { status } = await NotificationsMod!.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable notifications to schedule bin reminders.');
        return;
      }
      setPermissionGranted(true);
    }

    // Cancel previous if any
    if (scheduledId) {
      try { await NotificationsMod!.cancelScheduledNotificationAsync(scheduledId); } catch {}
      await saveScheduledId(null);
    }

    const titleColor = nextColor === 'green' ? 'Green' : 'Black';
    const id = await NotificationsMod!.scheduleNotificationAsync({
      content: {
        title: `Bin night (${titleColor} bin)` ,
        body: `Take out the ${titleColor.toLowerCase()} bin tonight.`,
        sound: true,
      },
      trigger: when as any,
    });

    await saveScheduledId(id);

    // Flip to the other color for the following week
    await saveNextColor(other(nextColor));

    Alert.alert('Scheduled', `Reminder set for ${when.toLocaleString('en-GB')} (${titleColor}).`);
  };

  const cancelSchedule = async () => {
    if (!NotificationsMod) return; // nothing to cancel on web
    if (scheduledId) {
      try { await NotificationsMod.cancelScheduledNotificationAsync(scheduledId); } catch {}
      await saveScheduledId(null);
    }
  };

  const togglePause = async () => {
    if (!paused) {
      // Pausing
      await savePaused(true);
      await cancelSchedule();
      Alert.alert('Paused', 'Bin reminders paused.');
    } else {
      // Unpausing: user can keep current next color or set explicitly, then schedule
      await savePaused(false);
      Alert.alert(
        'Resumed',
        `Reminders resumed. Next colour is set to ${nextColor}. You can change it below and tap "Schedule next Tuesday".`,
        [{ text: 'OK' }]
      );
    }
  };

  const setNextTo = async (color: BinColor) => {
    await saveNextColor(color);
    Alert.alert('Next colour set', `Next bin colour set to ${color}.`);
  };

  const sendTest = async () => {
    if (!ensureNativeNotifications()) return;
    await NotificationsMod!.scheduleNotificationAsync({
      content: {
        title: 'Bin reminder (test)',
        body: `This is a test notification. Next scheduled colour: ${nextColor}.`,
      },
      trigger: { seconds: 2 } as any,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Bin Reminders</ThemedText>
        <ThemedText style={styles.subtitle}>Tuesday 5pm reminders with weekly colour rotation</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        {isWeb && (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.label}>Web not supported</ThemedText>
            <ThemedText style={styles.value}>
              Bin reminders use native notifications. Please use the Android or iOS app to schedule reminders.
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>Status</ThemedText>
          <ThemedText style={styles.value}>{paused ? 'Paused' : 'Active'}</ThemedText>
          <TouchableOpacity style={[styles.primaryButton, paused ? styles.resume : styles.pause]} onPress={togglePause}>
            <ThemedText style={styles.primaryButtonText}>{paused ? '▶ Resume' : '⏸ Pause'}</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>Next bin colour</ThemedText>
          <ThemedText style={styles.value}>{nextColor}</ThemedText>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.choiceButton, styles.greenBtn]} onPress={() => setNextTo('green')}>
              <ThemedText style={styles.choiceText}>Set next: Green</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.choiceButton, styles.blackBtn]} onPress={() => setNextTo('black')}>
              <ThemedText style={styles.choiceText}>Set next: Black</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>Scheduling</ThemedText>
          <TouchableOpacity style={[styles.primaryButton, styles.schedule]} onPress={scheduleNext} disabled={paused}>
            <ThemedText style={styles.primaryButtonText}>📅 Schedule next Tuesday 5pm</ThemedText>
          </TouchableOpacity>
          {!!scheduledId && (
            <TouchableOpacity style={[styles.secondaryButton]} onPress={cancelSchedule}>
              <ThemedText style={styles.secondaryButtonText}>Cancel scheduled reminder</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>Test</ThemedText>
          <TouchableOpacity style={[styles.primaryButton, styles.test]} onPress={sendTest}>
            <ThemedText style={styles.primaryButtonText}>🔔 Send test notification</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FF6B6B',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  choiceButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  choiceText: {
    color: '#fff',
    fontWeight: '700',
  },
  greenBtn: {
    backgroundColor: '#2e7d32',
  },
  blackBtn: {
    backgroundColor: '#333',
  },
  pause: {
    backgroundColor: '#ff7043',
  },
  resume: {
    backgroundColor: '#4CAF50',
  },
  schedule: {
    backgroundColor: '#1976d2',
  },
  test: {
    backgroundColor: '#455a64',
  },
});
