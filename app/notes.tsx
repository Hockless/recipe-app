import AsyncStorage from '@react-native-async-storage/async-storage';
// Clipboard is imported dynamically where used to avoid runtime crashes if the native module is unavailable
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { shared } from '@/styles/theme';

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  tags?: string[];
  pinned?: boolean;
};

const STORAGE_LIST_KEY = 'notes:list:v1';
const LEGACY_SCRATCHPAD_KEY = 'notes:scratchpad:v1';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState('');
  const [previewMarkdown, setPreviewMarkdown] = useState(false);

  // Load notes and migrate from legacy scratchpad if present
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_LIST_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Note[];
          setNotes(sortNotes(parsed));
          return;
        }
        // Migration: if old scratchpad exists, convert to a single note
        const legacy = await AsyncStorage.getItem(LEGACY_SCRATCHPAD_KEY);
        if (legacy && legacy.trim().length > 0) {
          const now = new Date().toISOString();
          const firstLine = legacy.split('\n')[0]?.trim() || 'Scratchpad';
          const migrated: Note = {
            id: `migrated-${Date.now()}`,
            title: firstLine.substring(0, 60),
            content: legacy,
            createdAt: now,
            updatedAt: now,
          };
          const list = [migrated];
          setNotes(list);
          await AsyncStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(list));
          // keep legacy key for safety; optionally clear in future
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const sortNotes = (arr: Note[]) =>
    [...arr].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const openNew = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  setTagsInput('');
  setIsPinned(false);
    setEditorOpen(true);
  };

  const openEdit = (n: Note) => {
    setEditingId(n.id);
    setTitle(n.title);
    setContent(n.content);
  setTagsInput((n.tags || []).join(', '));
  setIsPinned(!!n.pinned);
    setEditorOpen(true);
  };

  const parseTags = (input: string) =>
    input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);

  const upsertNote = (id: string | null, t: string, c: string) => {
    const now = new Date().toISOString();
    const tags = parseTags(tagsInput);
    const pinned = isPinned;
    if (!id) {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: t?.trim() || deriveTitle(c),
        content: c,
        createdAt: now,
        updatedAt: now,
        tags,
        pinned,
      };
      const next = sortNotes([newNote, ...notes]);
      setNotes(next);
      void AsyncStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(next));
      setEditingId(newNote.id);
    } else {
      const next = sortNotes(
        notes.map((n) =>
          n.id === id
            ? {
                ...n,
                title: t?.trim() || deriveTitle(c),
                content: c,
                updatedAt: now,
                tags,
                pinned,
              }
            : n
        )
      );
      setNotes(next);
      void AsyncStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(next));
    }
  };

  const deriveTitle = (c: string) => {
    const first = (c || '').split('\n')[0]?.trim() || 'Untitled note';
    return first.substring(0, 60);
  };

  const deleteNote = (id: string) => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm('Delete this note? This cannot be undone.')
        : true;
      if (!ok) return;
      const next = notes.filter((n) => n.id !== id);
      setNotes(next);
      void AsyncStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(next));
      if (editingId === id) setEditorOpen(false);
      return;
    }
    Alert.alert('Delete note', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const next = notes.filter((n) => n.id !== id);
          setNotes(next);
          void AsyncStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(next));
          if (editingId === id) setEditorOpen(false);
        },
      },
    ]);
  };

  // Autosave when editing fields change
  useEffect(() => {
    if (!isEditorOpen) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setStatus('saving');
    saveTimeout.current = setTimeout(() => {
      upsertNote(editingId, title, content);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 800);
    }, 400);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, isEditorOpen]);

  const empty = notes.length === 0;

  const noteCountText = useMemo(() => {
    const c = notes.length;
    return c === 1 ? '1 note' : `${c} notes`;
  }, [notes.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const inTitle = n.title.toLowerCase().includes(q);
      const inBody = n.content.toLowerCase().includes(q);
      const inTags = (n.tags || []).some((t) => t.toLowerCase().includes(q));
      return inTitle || inBody || inTags;
    });
  }, [notes, query]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FF6B6B', dark: '#8B0000' }}
      headerImage={
        <ThemedView style={styles.headerContainer}>
          <ThemedText style={styles.headerEmoji}>🗒️</ThemedText>
        </ThemedView>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>Notes</ThemedText>
        <ThemedText style={styles.subtitle}>Create and manage individual notes. Autosaves as you type.</ThemedText>
        <View style={styles.metricsRow}>
          <View style={styles.badge}><ThemedText style={styles.badgeText}>{noteCountText}</ThemedText></View>
        </View>
      </ThemedView>

      <ThemedView style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={openNew} activeOpacity={0.85}>
          <ThemedText style={styles.primaryButtonText}>＋ Add Note</ThemedText>
        </TouchableOpacity>
        <TextInput
          placeholder="Search notes…"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </ThemedView>

      {empty ? (
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyEmoji}>✍️</ThemedText>
          <ThemedText style={styles.emptyTitle}>No notes yet</ThemedText>
          <ThemedText style={styles.emptyDescription}>Tap “Add Note” to start your first note.</ThemedText>
        </ThemedView>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 40 }}>
          {filtered.map((n) => (
            <ThemedView key={n.id} style={styles.noteCard}>
              <TouchableOpacity onPress={() => openEdit(n)} activeOpacity={0.85} style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold" style={styles.noteTitle}>
                  {n.pinned ? '📌 ' : ''}
                  {n.title || 'Untitled note'}
                </ThemedText>
                <ThemedText style={styles.notePreview} numberOfLines={2}>
                  {n.content || ' '}
                </ThemedText>
                {!!(n.tags && n.tags.length) && (
                  <View style={styles.tagRow}>
                    {n.tags.map((t) => (
                      <View key={t} style={styles.tagChip}><ThemedText style={styles.tagText}>#{t}</ThemedText></View>
                    ))}
                  </View>
                )}
                <ThemedText style={styles.noteMeta}>Updated {new Date(n.updatedAt).toLocaleString()}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNote(n.id)}>
                <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ))}
        </ScrollView>
      )}

      {/* Editor Modal */}
      <Modal visible={isEditorOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditorOpen(false)}>
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditorOpen(false)} style={styles.headerBack}>
              <ThemedText style={styles.headerBackText}>Close</ThemedText>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.modalTitle}>{editingId ? 'Edit Note' : 'New Note'}</ThemedText>
            <ThemedText style={{ opacity: 0 }}>Close</ThemedText>
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            keyboardVerticalOffset={Platform.select({ ios: 70, android: 0 })}
          >
            <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
              <ThemedText style={styles.inputLabel}>Title</ThemedText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title (optional — first line used if blank)"
                style={styles.textInput}
              />
              <ThemedText style={styles.inputLabel}>Content</ThemedText>
              {previewMarkdown ? (
                <ThemedView style={[styles.textInput, { minHeight: 220, backgroundColor: '#fff' }]}>
                  <ScrollView>
                    <Markdown>{content || '_Nothing to preview_'}</Markdown>
                  </ScrollView>
                </ThemedView>
              ) : (
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write your note… (Markdown supported)"
                  multiline
                  textAlignVertical="top"
                  style={[styles.textInput, { minHeight: 220 }]}
                />
              )}
              <View style={styles.rowWrap}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.inputLabel}>Tags</ThemedText>
                  <TextInput
                    value={tagsInput}
                    onChangeText={setTagsInput}
                    placeholder="Comma-separated (e.g. dinner, todo)"
                    style={styles.textInput}
                  />
                </View>
              </View>
              <View style={styles.toolbarRow}>
                <TouchableOpacity
                  onPress={() => setIsPinned((p) => !p)}
                  style={[styles.secondaryButton, isPinned && styles.secondaryButtonActive]}
                >
                  <ThemedText style={styles.secondaryButtonText}>{isPinned ? '📌 Pinned' : 'Pin'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPreviewMarkdown((v) => !v)}
                  style={styles.secondaryButton}
                >
                  <ThemedText style={styles.secondaryButtonText}>{previewMarkdown ? 'Edit' : 'Preview'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  try {
                    const mod = await import('expo-clipboard');
                    await mod.setStringAsync(JSON.stringify({ type: 'notes-export-v1', notes }));
                    setStatus('saved');
                    setTimeout(() => setStatus('idle'), 800);
                  } catch (e) {
                    Alert.alert('Clipboard unavailable', 'Clipboard functions are not available in this build. Please rebuild the app or copy manually.');
                  }
                }} style={styles.secondaryButton}>
                  <ThemedText style={styles.secondaryButtonText}>Export</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  try {
                    const mod = await import('expo-clipboard');
                    const text = await mod.getStringAsync();
                    const parsed = JSON.parse(text);
                    if (parsed?.type === 'notes-export-v1' && Array.isArray(parsed.notes)) {
                      const merged = mergeNotes(notes, parsed.notes as Note[]);
                      setNotes(sortNotes(merged));
                      await AsyncStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(sortNotes(merged)));
                    } else {
                      Alert.alert('Invalid import', 'Clipboard does not contain a valid notes export.');
                    }
                  } catch (e) {
                    Alert.alert('Clipboard unavailable', 'Clipboard functions are not available in this build. Please rebuild the app or paste manually.');
                  }
                }} style={styles.secondaryButton}>
                  <ThemedText style={styles.secondaryButtonText}>Import</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.saveStatusRow}>
                <ThemedText style={styles.saveStatusText}>
                  {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : ' '}
                </ThemedText>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </ThemedView>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 10,
  },
  headerEmoji: { fontSize: 64, textAlign: 'center' },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  subtitle: { fontSize: 14, opacity: 0.7, marginTop: 6, textAlign: 'center' },
  metricsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { ...shared.badge, backgroundColor: 'rgba(0,0,0,0.35)' },
  badgeText: shared.badgeText,
  actionsRow: { paddingHorizontal: 20, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 56, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, color: '#333' },
  emptyDescription: { fontSize: 14, color: '#666', textAlign: 'center' },
  list: { paddingHorizontal: 20, marginTop: 12 },
  noteCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 6 },
  notePreview: { fontSize: 14, color: '#555' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagChip: { backgroundColor: '#ececec', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '700', color: '#555' },
  noteMeta: { fontSize: 11, color: '#888', marginTop: 8 },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  deleteButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 54,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBack: { padding: 8 },
  headerBackText: { color: '#FF6B6B', fontWeight: '700' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalContent: { padding: 16, flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  rowWrap: { flexDirection: 'row', gap: 12 },
  toolbarRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 6 },
  secondaryButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  secondaryButtonActive: { backgroundColor: '#ffd7d7' },
  secondaryButtonText: { fontSize: 13, fontWeight: '700', color: '#333' },
  saveStatusRow: { alignItems: 'flex-end' },
  saveStatusText: { fontSize: 12, color: '#666' },
});

// Merge imported notes with local ones by ID; if ID exists, keep the newer updatedAt
function mergeNotes(localNotes: Note[], imported: Note[]): Note[] {
  const byId = new Map<string, Note>();
  for (const n of localNotes) byId.set(n.id, n);
  for (const m of imported) {
    const existing = byId.get(m.id);
    if (!existing) {
      byId.set(m.id, m);
    } else {
      byId.set(
        m.id,
        new Date(m.updatedAt).getTime() > new Date(existing.updatedAt).getTime() ? m : existing
      );
    }
  }
  return Array.from(byId.values());
}
