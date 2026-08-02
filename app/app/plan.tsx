import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateDietPlan } from "../src/services/coachApi";
import { getProfile } from "../src/data/repositories/profileRepository";
import { getLatestPlan, savePlan } from "../src/data/repositories/planRepository";
import { colors } from "../src/theme/colors";

export default function Plan() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // React state updates aren't synchronous, so a state-only guard can miss
  // two taps that both fire before the first re-render commits. A ref is
  // checked and set in the same tick, closing that window.
  const generatingRef = useRef(false);

  useEffect(() => {
    getLatestPlan()
      .then((existing) => {
        setPlan(existing?.content ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Couldn't load your saved plan.");
      })
      .finally(() => {
        setLoaded(true);
      });
  }, []);

  async function handleGenerate() {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    setError(null);

    try {
      const profile = await getProfile();
      const { plan: newPlan } = await generateDietPlan(profile);
      setPlan(newPlan);
      await savePlan(newPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerLink}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!loaded && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.ink} />
          </View>
        )}

        {loaded && !plan && !generating && !error && (
          <Text style={styles.empty}>
            No plan yet. Chat with your coach a bit first, then come back here to generate one.
          </Text>
        )}

        {generating && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.ink} />
            <Text style={styles.generatingText}>Putting your plan together...</Text>
          </View>
        )}

        {!generating && plan && <Text style={styles.planText}>{plan}</Text>}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, generating && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={generating}
        >
          <Text style={[styles.buttonText, generating && styles.buttonTextDisabled]}>
            {generating ? "Generating..." : plan ? "Regenerate my plan" : "Generate my plan"}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 17,
    color: colors.ink,
  },
  headerLink: {
    fontFamily: "Inter_600SemiBold",
    color: colors.accentLink,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  generatingText: {
    fontFamily: "Inter_500Medium",
    color: colors.inkDim,
  },
  empty: {
    fontFamily: "Inter_500Medium",
    color: colors.inkDim,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingTop: 40,
  },
  planText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
  },
  error: {
    fontFamily: "Inter_500Medium",
    color: "#ff8a8a",
    marginTop: 16,
  },
  buttonRow: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  button: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  buttonText: {
    fontFamily: "Inter_700Bold",
    color: colors.bg,
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: colors.inkFaint,
  },
});
