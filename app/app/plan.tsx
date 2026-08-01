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
            <ActivityIndicator />
          </View>
        )}

        {loaded && !plan && !generating && !error && (
          <Text style={styles.empty}>
            No plan yet. Chat with your coach a bit first, then come back here to generate one.
          </Text>
        )}

        {generating && (
          <View style={styles.centered}>
            <ActivityIndicator />
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
          <Text style={styles.buttonText}>
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDD",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerLink: {
    color: "#3E7C59",
    fontWeight: "600",
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
    color: "#666",
  },
  empty: {
    color: "#666",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingTop: 40,
  },
  planText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#222",
  },
  error: {
    color: "#B00020",
    marginTop: 16,
  },
  buttonRow: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DDD",
  },
  button: {
    backgroundColor: "#3E7C59",
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#A9C7B7",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
