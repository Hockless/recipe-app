import { BackButton } from '@/components/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { shared } from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';

type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO or simple text date e.g. 2025-08-21 14:30
  notes?: string;
  createdAt: string;
  done?: boolean;
  notify?: boolean; // request local notification at date/time (native only)
  notificationId?: string | null;
  repeat?: 'none' | 'daily' | 'weekly';
};

const STORAGE_KEY = 'personalCalendarEvents';

export default function PersonalCalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [notify, setNotify] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');

  // Date/time picker (native optional)
  const [RNDateTimePicker, setRNDateTimePicker] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Native notifications (dynamic import to avoid web issues)
  const isWeb = Platform.OS === 'web';
  // No persistent ref needed; we dynamically import where needed

  const handleBack = () => {
    if ((router as any).canGoBack?.()) router.back(); else router.replace('/');
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setEvents(raw ? JSON.parse(raw) : []);
      } catch (e) {
        console.warn('Failed to load calendar events', e);
      }

      if (!isWeb) {
  const mod = await import('expo-notifications');
  await mod.requestPermissionsAsync();
        if (Platform.OS === 'android') {
          await mod.setNotificationChannelAsync('calendar', {
            name: 'Calendar',
            importance: mod.AndroidImportance.DEFAULT,
          });
        }
      }

      // Try load native date/time picker if installed
      if (!isWeb) {
        try {
          const dt = await import('@react-native-community/datetimepicker');
          setRNDateTimePicker(dt.default);
        } catch {
          setRNDateTimePicker(null);
        }
      }
    })();
  }, [isWeb]);

  const saveEvents = async (list: CalendarEvent[]) => {
    setEvents(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const parseDate = useCallback((str: string): Date | null => {
    if (!str?.trim()) return null;
    const t = Date.parse(str);
    return isNaN(t) ? null : new Date(t);
  }, []);

  const getDateForScheduling = (ev: CalendarEvent): Date | null => {
    // Prefer parsed date from ev.date
    const parsed = parseDate(ev.date);
    return parsed;
  };

  // Compute the next occurrence date for repeating events based on current time
  const nextOccurrence = useCallback((ev: CalendarEvent, ref: Date): Date | null => {
    const base = parseDate(ev.date);
    if (!base) return null;
    if (ev.repeat === 'daily') {
      const candidate = new Date(ref);
      candidate.setHours(base.getHours(), base.getMinutes(), 0, 0);
      if (candidate.getTime() <= ref.getTime()) {
        candidate.setDate(candidate.getDate() + 1);
      }
      return candidate;
    }
    if (ev.repeat === 'weekly') {
      const targetDow = base.getDay(); // 0-6 (Sun-Sat)
      const candidate = new Date(ref);
      candidate.setHours(base.getHours(), base.getMinutes(), 0, 0);
      const diff = (targetDow - candidate.getDay() + 7) % 7;
      if (diff === 0 && candidate.getTime() <= ref.getTime()) {
        candidate.setDate(candidate.getDate() + 7);
      } else if (diff > 0) {
        candidate.setDate(candidate.getDate() + diff);
      }
      return candidate;
    }
    // one-time
    return base;
  }, [parseDate]);

  const scheduleNotificationIfNeeded = async (ev: CalendarEvent): Promise<string | null> => {
    if (isWeb) return null;
    const d = getDateForScheduling(ev);
    if (!d || (ev.repeat === 'none' && d.getTime() <= Date.now())) return null;
    try {
      const mod = await import('expo-notifications');
      let trigger: any = d;
      if (ev.repeat === 'daily') {
        trigger = { hour: d.getHours(), minute: d.getMinutes(), repeats: true, channelId: 'calendar' };
      } else if (ev.repeat === 'weekly') {
        // Expo uses 1 (Sunday) ... 7 (Saturday)
        const weekday = ((d.getDay() + 1) as 1|2|3|4|5|6|7);
        trigger = { weekday, hour: d.getHours(), minute: d.getMinutes(), repeats: true, channelId: 'calendar' } as any;
      }
      const id = await mod.scheduleNotificationAsync({
        content: { title: `Event: ${ev.title}`, body: ev.notes || ev.date, sound: true },
        trigger,
      });
      return id;
    } catch {
      return null;
    }
  };

  const cancelNotificationIfAny = async (id?: string | null) => {
    if (!id) return;
    try {
      const mod = await import('expo-notifications');
      await mod.cancelScheduledNotificationAsync(id);
    } catch {}
  };

  const addEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for the event.');
      return;
    }
    // If native picker selectedDate exists, format date string from it
    const dateStr = selectedDate ? `${selectedDate.toISOString().slice(0,16).replace('T',' ')}` : date.trim();
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: title.trim(),
      date: dateStr,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      done: false,
      notify: notify && !isWeb ? true : false,
      notificationId: null,
      repeat,
    };
    if (newEvent.notify) {
      newEvent.notificationId = await scheduleNotificationIfNeeded(newEvent);
    }
    const updated = [...events, newEvent];
    await saveEvents(updated);
    setTitle('');
  setDate('');
    setNotes('');
    setNotify(false);
  setRepeat('none');
  setSelectedDate(null);
  };

  const startEdit = (ev: CalendarEvent) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setDate(ev.date);
    setNotes(ev.notes || '');
    setNotify(!!ev.notify);
  setRepeat(ev.repeat || 'none');
  const d = parseDate(ev.date);
  setSelectedDate(d);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDate('');
    setNotes('');
    setNotify(false);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const idx = events.findIndex(e => e.id === editingId);
    if (idx < 0) return;
    const prev = events[idx];
    const dateStr = selectedDate ? `${selectedDate.toISOString().slice(0,16).replace('T',' ')}` : date.trim();
    const updatedEv: CalendarEvent = {
      ...prev,
      title: title.trim() || prev.title,
      date: dateStr,
      notes: notes.trim() || undefined,
      notify: notify && !isWeb ? true : false,
      repeat,
    };
  // Notification changes: cancel if date changed, notify turned off, or repeat changed
  if (prev.notificationId && (prev.date !== updatedEv.date || !updatedEv.notify || prev.repeat !== updatedEv.repeat)) {
      await cancelNotificationIfAny(prev.notificationId);
      updatedEv.notificationId = null;
    }
  if (updatedEv.notify && !updatedEv.notificationId) {
      updatedEv.notificationId = await scheduleNotificationIfNeeded(updatedEv);
    }
    const list = [...events];
    list[idx] = updatedEv;
    await saveEvents(list);
    cancelEdit();
  };

  const removeEvent = async (id: string) => {
    const ev = events.find(e => e.id === id);
    if (ev?.notificationId) await cancelNotificationIfAny(ev.notificationId);
    const updated = events.filter(e => e.id !== id);
    await saveEvents(updated);
  };

  const toggleDone = async (id: string) => {
    const list = events.map(e => (e.id === id ? { ...e, done: !e.done } : e));
    await saveEvents(list);
  };

  const now = Date.now();
  const { upcoming, past } = useMemo(() => {
    const ref = new Date(now);
    const annotated = events.map(e => ({ e, next: nextOccurrence(e, ref) }));
    const withNext = annotated.filter(x => !!x.next) as { e: CalendarEvent; next: Date }[];
    const upcoming = withNext
      .filter(x => x.next.getTime() >= now)
      .sort((a, b) => a.next.getTime() - b.next.getTime())
      .map(x => x.e);
    const undated = annotated.filter(x => !x.next).map(x => x.e);
    const past = withNext
      .filter(x => x.e.repeat === 'none' && x.next.getTime() < now)
      .sort((a, b) => b.next.getTime() - a.next.getTime())
      .map(x => x.e);
    return { upcoming: [...upcoming, ...undated], past };
  }, [events, now, nextOccurrence]);

  const byDay = (list: CalendarEvent[]) => {
    const map: Record<string, CalendarEvent[]> = {};
    list.forEach(e => {
      const d = nextOccurrence(e, new Date(now));
      const key = d ? d.toISOString().split('T')[0] : 'No date';
      (map[key] = map[key] || []).push(e);
    });
    return Object.entries(map);
  };

  const rel = (d: Date | null) => {
    if (!d) return '';
    const ms = d.getTime() - now;
    const mins = Math.round(ms / 60000);
    if (Math.abs(mins) < 60) return `${mins >= 0 ? 'in' : ''} ${Math.abs(mins)} min${Math.abs(mins) === 1 ? '' : 's'}${mins < 0 ? ' ago' : ''}`;
    const hrs = Math.round(ms / 3600000);
    if (Math.abs(hrs) < 24) return `${hrs >= 0 ? 'in' : ''} ${Math.abs(hrs)} hour${Math.abs(hrs) === 1 ? '' : 's'}${hrs < 0 ? ' ago' : ''}`;
    const days = Math.round(ms / 86400000);
    return `${days >= 0 ? 'in' : ''} ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}${days < 0 ? ' ago' : ''}`;
  };

  return (
    <ScrollView style={shared.screenContainer}>
      <ThemedView style={shared.headerBar}>
        <BackButton onPress={handleBack} />
        <ThemedText type="title" style={shared.screenTitle}>Personal Calendar</ThemedText>
        <ThemedText style={styles.subtitle}>Track your events and notes</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>New Event</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />
          {RNDateTimePicker ? (
            <View style={styles.rowSplit}>
              <TouchableOpacity style={[shared.buttonPill, styles.pickBtn]} onPress={() => setShowDatePicker(true)}>
                <ThemedText style={shared.buttonPillText}>Pick Date</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[shared.buttonPill, styles.pickBtn]} onPress={() => setShowTimePicker(true)}>
                <ThemedText style={shared.buttonPillText}>Pick Time</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Date (e.g. 2025-08-21 14:30)"
              value={date}
              onChangeText={setDate}
              placeholderTextColor="#999"
            />
          )}
          {!!selectedDate && (
            <ThemedText style={styles.helperText}>
              Selected: {selectedDate.toLocaleString()}
            </ThemedText>
          )}
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor="#999"
            multiline
          />
          <View style={styles.rowSplit}>
            <TouchableOpacity style={[shared.buttonPill, styles.repeatChip, repeat === 'none' && styles.repeatChipOn]} onPress={() => setRepeat('none')}>
              <ThemedText style={shared.buttonPillText}>One-time</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[shared.buttonPill, styles.repeatChip, repeat === 'daily' && styles.repeatChipOn]} onPress={() => setRepeat('daily')}>
              <ThemedText style={shared.buttonPillText}>Daily</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[shared.buttonPill, styles.repeatChip, repeat === 'weekly' && styles.repeatChipOn]} onPress={() => setRepeat('weekly')}>
              <ThemedText style={shared.buttonPillText}>Weekly</ThemedText>
            </TouchableOpacity>
          </View>
          {!isWeb && (
            <View style={styles.notifyRow}>
              <ThemedText style={styles.notifyLabel}>Notify at time</ThemedText>
              <Switch value={notify} onValueChange={setNotify} />
            </View>
          )}
          {editingId ? (
            <View style={styles.rowGap}>
              <TouchableOpacity style={[shared.buttonPill, styles.saveBtn]} onPress={saveEdit}>
                <ThemedText style={shared.buttonPillText}>Save Changes</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[shared.buttonPill, styles.cancelBtn]} onPress={cancelEdit}>
                <ThemedText style={shared.buttonPillText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[shared.buttonPill, styles.primaryBtn]} onPress={addEvent}>
              <ThemedText style={shared.buttonPillText}>Add Event</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText style={styles.label}>Upcoming</ThemedText>
          {upcoming.length === 0 ? (
            <ThemedText style={styles.emptyText}>No upcoming events. Add your first one above.</ThemedText>
          ) : (
            <View style={styles.list}>
              {byDay(upcoming).map(([day, items]) => (
                <View key={day} style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>{day}</ThemedText>
                  {items.map(ev => {
                    const d = nextOccurrence(ev, new Date(now));
                    return (
                      <ThemedView key={ev.id} style={[styles.eventRow, ev.done && styles.eventRowDone]}>
                        <TouchableOpacity onPress={() => toggleDone(ev.id)} style={[shared.buttonPill, styles.doneBtn, ev.done && styles.doneBtnOn]}>
                          <ThemedText style={shared.buttonPillText}>{ev.done ? '✓' : '○'}</ThemedText>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={[styles.eventTitle, ev.done && styles.eventTextDone]}>{ev.title}</ThemedText>
                          <ThemedText style={styles.eventDate}>
                            {d ? `${d.toLocaleString()} (${rel(d)})` : (ev.date || 'No date')}
                            {ev.repeat && ev.repeat !== 'none' ? ` • ${ev.repeat === 'daily' ? 'Daily' : 'Weekly'}` : ''}
                          </ThemedText>
                          {!!ev.notes && <ThemedText style={[styles.eventNotes, ev.done && styles.eventTextDone]}>{ev.notes}</ThemedText>}
                        </View>
                        <View style={styles.rowGap}>
                          <TouchableOpacity style={[shared.buttonPill, styles.editBtn]} onPress={() => startEdit(ev)}>
                            <ThemedText style={shared.buttonPillText}>Edit</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity style={[shared.buttonPill, styles.deleteBtn]} onPress={() => removeEvent(ev.id)}>
                            <ThemedText style={shared.buttonPillText}>Delete</ThemedText>
                          </TouchableOpacity>
                        </View>
                      </ThemedView>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </ThemedView>

  {past.length > 0 && (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.label}>Past</ThemedText>
            <View style={styles.list}>
              {byDay(past).map(([day, items]) => (
                <View key={day} style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>{day}</ThemedText>
                  {items.map(ev => (
                    <ThemedView key={ev.id} style={[styles.eventRow, styles.eventRowPast]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.eventTitle}>{ev.title}</ThemedText>
                        <ThemedText style={styles.eventDate}>{ev.date}</ThemedText>
                        {!!ev.notes && <ThemedText style={styles.eventNotes}>{ev.notes}</ThemedText>}
                      </View>
                      <TouchableOpacity style={[shared.buttonPill, styles.deleteBtn]} onPress={() => removeEvent(ev.id)}>
                        <ThemedText style={shared.buttonPillText}>Delete</ThemedText>
                      </TouchableOpacity>
                    </ThemedView>
                  ))}
                </View>
              ))}
            </View>
          </ThemedView>
        )}
      </ThemedView>

      {/* Native pickers */}
      {RNDateTimePicker && showDatePicker && (
        <RNDateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          onChange={(_: any, d?: Date) => {
            setShowDatePicker(false);
            if (d) {
              const merged = new Date(selectedDate || d);
              merged.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              setSelectedDate(merged);
            }
          }}
        />
      )}
      {RNDateTimePicker && showTimePicker && (
        <RNDateTimePicker
          value={selectedDate || new Date()}
          mode="time"
          onChange={(_: any, d?: Date) => {
            setShowTimePicker(false);
            if (d) {
              const merged = new Date(selectedDate || new Date());
              merged.setHours(d.getHours(), d.getMinutes(), 0, 0);
              setSelectedDate(merged);
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: '#fff', fontSize: 16, opacity: 0.9 },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: { fontSize: 14, color: '#666', marginBottom: 10, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: '#4CAF50', alignSelf: 'flex-start' },
  saveBtn: { backgroundColor: '#1976d2', alignSelf: 'flex-start' },
  cancelBtn: { backgroundColor: '#757575', alignSelf: 'flex-start' },
  rowGap: { gap: 8 },
  rowSplit: { flexDirection: 'row', gap: 10 },
  list: { gap: 12 },
  section: { gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#444', opacity: 0.9 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  eventRowPast: { opacity: 0.85 },
  eventRowDone: { opacity: 0.6 },
  eventTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  eventDate: { fontSize: 14, color: '#555', marginTop: 2 },
  eventNotes: { fontSize: 14, color: '#777', marginTop: 2, fontStyle: 'italic' },
  eventTextDone: { textDecorationLine: 'line-through', color: '#777' },
  doneBtn: { backgroundColor: '#bbb' },
  doneBtnOn: { backgroundColor: '#2e7d32' },
  editBtn: { backgroundColor: '#9C27B0' },
  deleteBtn: { backgroundColor: '#ff7043' },
  emptyText: { color: '#666', fontStyle: 'italic' },
  notifyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  notifyLabel: { color: '#333', fontWeight: '600' },
  helperText: { fontSize: 12, color: '#555', marginBottom: 8 },
  pickBtn: { backgroundColor: '#6c757d' },
  repeatChip: { backgroundColor: '#bbb' },
  repeatChipOn: { backgroundColor: '#FF6B6B' },
});
