import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../src/theme/colors";
import type { BookSource } from "../src/data/types";
import {
  deleteBookSource,
  listBookSources,
  saveBookSource,
  totalBookSourceChars,
} from "../src/data/repositories/bookSourceRepository";

const TOTAL_BUDGET = 40_000;

export default function BookNotes() {
  const router = useRouter();
  const [sources, setSources] = useState<BookSource[]>([]);
  const [totalChars, setTotalChars] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // React state updates aren't synchronous, so a rapid double-tap on Save
  // can enter handleSave twice before `saving` re-renders — this ref blocks
  // the second call immediately, same pattern as dashboard.tsx's busyRef.
  const savingRef = useRef(false);

  async function refresh() {
    const [list, total] = await Promise.all([listBookSources(), totalBookSourceChars()]);
    setSources(list);
    setTotalChars(total);
  }

  useEffect(() => {
    refresh().then(() => setLoaded(true));
  }, []);

  async function handleSave() {
    if (savingRef.current) return;
    const trimmedTitle = title.trim();
    const trimmedText = text.trim();
    if (!trimmedTitle || !trimmedText) return;

    // Titles get concatenated into the prompt alongside the excerpt text
    // (see getConcatenatedBookNotes's "--- {title} ---" separator), so both
    // count against the budget — not just the excerpt.
    const addedChars = trimmedTitle.length + trimmedText.length;
    if (totalChars + addedChars > TOTAL_BUDGET) {
      setError(
        `That would put you over your ${TOTAL_BUDGET.toLocaleString()}-character notes budget. Delete or trim something first.`
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await saveBookSource(trimmedTitle, trimmedText);
      setTitle("");
      setText("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that note.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteBookSource(id);
    await refresh();
  }

  const remaining = TOTAL_BUDGET - totalChars - title.trim().length - text.trim().length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Books</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerLink}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Add a note</Text>
        <Text style={styles.helper}>
          Paste or type an excerpt from a book you own. Your coach will draw on this directly
          alongside its general wellness knowledge.
        </Text>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Title, e.g. Cleanse to Heal - Morning Cleanse"
          placeholderTextColor={colors.inkFaint}
          editable={!saving}
        />
        <TextInput
          style={styles.textArea}
          value={text}
          onChangeText={setText}
          placeholder="Paste or type your notes here..."
          placeholderTextColor={colors.inkFaint}
          multiline
          editable={!saving}
        />
        <Text style={[styles.budgetText, remaining < 0 && styles.budgetOver]}>
          {remaining >= 0
            ? `${remaining.toLocaleString()} characters left in your notes budget`
            : `${Math.abs(remaining).toLocaleString()} characters over budget`}
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving || !title.trim() || !text.trim()}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Text style={styles.saveButtonText}>Save note</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, styles.savedLabel]}>
          Saved notes ({totalChars.toLocaleString()} / {TOTAL_BUDGET.toLocaleString()} chars)
        </Text>
        {!loaded && <ActivityIndicator color={colors.ink} />}
        {loaded && sources.length === 0 && (
          <Text style={styles.helper}>No notes saved yet.</Text>
        )}
        {sources.map((source) => (
          <View key={source.id} style={styles.sourceCard}>
            <View style={styles.sourceHeader}>
              <Text style={styles.sourceTitle}>{source.title}</Text>
              <TouchableOpacity onPress={() => handleDelete(source.id)}>
                <Text style={styles.deleteLink}>Delete</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sourceMeta}>{source.charCount.toLocaleString()} characters</Text>
            <Text style={styles.sourcePreview} numberOfLines={3}>
              {source.sourceText}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  title: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 17,
    color: colors.ink,
  },
  headerLink: {
    fontFamily: "Inter_600SemiBold",
    color: colors.accentLink,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.inkFaint,
    marginTop: 8,
  },
  savedLabel: {
    marginTop: 24,
  },
  helper: {
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.inkDim,
  },
  titleInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bgElev,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textArea: {
    fontFamily: "Inter_400Regular",
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bgElev,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 160,
    textAlignVertical: "top",
  },
  budgetText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: colors.inkFaint,
  },
  budgetOver: {
    color: "#ff8a8a",
  },
  error: {
    fontFamily: "Inter_500Medium",
    color: "#ff8a8a",
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: colors.ink,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontFamily: "Inter_700Bold",
    color: colors.bg,
  },
  sourceCard: {
    backgroundColor: colors.bgElev,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    gap: 4,
  },
  sourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14.5,
    color: colors.ink,
    flex: 1,
    marginRight: 8,
  },
  deleteLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
    color: "#ff8a8a",
  },
  sourceMeta: {
    fontFamily: "Inter_500Medium",
    fontSize: 11.5,
    color: colors.inkFaint,
  },
  sourcePreview: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkDim,
    marginTop: 4,
  },
});
