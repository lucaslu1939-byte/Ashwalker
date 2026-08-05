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
import type { JournalEntry } from "../src/data/types";
import {
  getEntry,
  listRecentEntries,
  saveEntry,
  todayDateString,
} from "../src/data/repositories/journalRepository";

const NOTES_LIMIT = 500;
const SCALE = [1, 2, 3, 4, 5];

type AdherenceKey = "didMorningRoutine" | "didMeals" | "didMovement" | "didMeditation";
const ADHERENCE_ITEMS: { key: AdherenceKey; label: string }[] = [
  { key: "didMorningRoutine", label: "Morning Routine" },
  { key: "didMeals", label: "Meals" },
  { key: "didMovement", label: "Movement" },
  { key: "didMeditation", label: "Meditation" },
];

function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function adherenceSummary(entry: JournalEntry): string {
  const followed = ADHERENCE_ITEMS.filter((item) => entry[item.key]).map((item) => item.label);
  return followed.length > 0 ? followed.join(", ") : "None logged";
}

export default function Journal() {
  const router = useRouter();
  const today = todayDateString();
  const [loaded, setLoaded] = useState(false);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [adherence, setAdherence] = useState<Record<AdherenceKey, boolean>>({
    didMorningRoutine: false,
    didMeals: false,
    didMovement: false,
    didMeditation: false,
  });
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Same synchronous-lock pattern as book-notes.tsx's savingRef — React state
  // updates aren't synchronous, so a rapid double-tap on Save can otherwise
  // enter handleSave twice before `saving` re-renders.
  const savingRef = useRef(false);

  async function refresh() {
    const [existing, recent] = await Promise.all([getEntry(today), listRecentEntries()]);
    if (existing) {
      setMood(existing.mood);
      setEnergy(existing.energy);
      setAdherence({
        didMorningRoutine: existing.didMorningRoutine,
        didMeals: existing.didMeals,
        didMovement: existing.didMovement,
        didMeditation: existing.didMeditation,
      });
      setNotes(existing.notes ?? "");
    }
    setHistory(recent);
  }

  useEffect(() => {
    refresh().then(() => setLoaded(true));
  }, []);

  async function handleSave() {
    if (savingRef.current) return;
    if (mood === null || energy === null) {
      setError("Pick a mood and energy level first.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await saveEntry(today, {
        mood,
        energy,
        didMorningRoutine: adherence.didMorningRoutine,
        didMeals: adherence.didMeals,
        didMovement: adherence.didMovement,
        didMeditation: adherence.didMeditation,
        notes: notes.trim() || null,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save today's entry.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function toggleAdherence(key: AdherenceKey) {
    setAdherence((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const pastEntries = history.filter((entry) => entry.entryDate !== today);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerLink}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {!loaded ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <>
            <Text style={styles.sectionLabel}>Today</Text>

            <Text style={styles.fieldLabel}>Mood</Text>
            <View style={styles.scaleRow}>
              {SCALE.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.scaleButton, mood === value && styles.scaleButtonActive]}
                  onPress={() => setMood(value)}
                  disabled={saving}
                >
                  <Text style={[styles.scaleButtonText, mood === value && styles.scaleButtonTextActive]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Energy</Text>
            <View style={styles.scaleRow}>
              {SCALE.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.scaleButton, energy === value && styles.scaleButtonActive]}
                  onPress={() => setEnergy(value)}
                  disabled={saving}
                >
                  <Text
                    style={[styles.scaleButtonText, energy === value && styles.scaleButtonTextActive]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Followed today</Text>
            <View style={styles.chipRow}>
              {ADHERENCE_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.chip, adherence[item.key] && styles.chipActive]}
                  onPress={() => toggleAdherence(item.key)}
                  disabled={saving}
                >
                  <Text style={[styles.chipText, adherence[item.key] && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={(text) => setNotes(text.slice(0, NOTES_LIMIT))}
              placeholder="Anything else worth remembering about today..."
              placeholderTextColor={colors.inkFaint}
              multiline
              editable={!saving}
            />
            <Text style={styles.charCount}>
              {NOTES_LIMIT - notes.length} characters left
            </Text>

            {error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.bg} />
              ) : (
                <Text style={styles.saveButtonText}>Save today's entry</Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, styles.historyLabel]}>Last 14 days</Text>
            {pastEntries.length === 0 && (
              <Text style={styles.helper}>No past entries yet.</Text>
            )}
            {pastEntries.map((entry) => (
              <View key={entry.entryDate} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>{formatDateLabel(entry.entryDate)}</Text>
                  <Text style={styles.entryScores}>
                    Mood {entry.mood}/5 · Energy {entry.energy}/5
                  </Text>
                </View>
                <Text style={styles.entryAdherence}>{adherenceSummary(entry)}</Text>
                {entry.notes && (
                  <Text style={styles.entryNotes} numberOfLines={2}>
                    {entry.notes}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}
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
  historyLabel: {
    marginTop: 24,
  },
  helper: {
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.inkDim,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: colors.ink,
    marginTop: 6,
  },
  scaleRow: {
    flexDirection: "row",
    gap: 8,
  },
  scaleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bgElev,
    alignItems: "center",
    justifyContent: "center",
  },
  scaleButtonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  scaleButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: colors.inkDim,
  },
  scaleButtonTextActive: {
    color: colors.bg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bgElev,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: colors.inkDim,
  },
  chipTextActive: {
    color: colors.bg,
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
    minHeight: 90,
    textAlignVertical: "top",
  },
  charCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: colors.inkFaint,
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
    marginTop: 4,
  },
  saveButtonText: {
    fontFamily: "Inter_700Bold",
    color: colors.bg,
  },
  entryCard: {
    backgroundColor: colors.bgElev,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    gap: 4,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryDate: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  entryScores: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: colors.inkFaint,
  },
  entryAdherence: {
    fontFamily: "Inter_500Medium",
    fontSize: 12.5,
    color: colors.inkDim,
  },
  entryNotes: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkDim,
    marginTop: 2,
  },
});
