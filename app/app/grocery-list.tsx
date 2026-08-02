import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../src/theme/colors";
import type { GroceryCategory } from "../src/data/types";
import { generateGroceryList } from "../src/services/coachApi";
import {
  getCurrentWeekPlan,
  saveGroceryListForCurrentWeek,
} from "../src/data/repositories/weeklyPlanRepository";

export default function GroceryList() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [categories, setCategories] = useState<GroceryCategory[] | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentWeekPlan()
      .then((plan) => setCategories(plan?.groceryList ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your list."))
      .finally(() => setLoaded(true));
  }, []);

  async function handleRegenerate() {
    if (regenerating) return;
    setRegenerating(true);
    setError(null);

    try {
      const plan = await getCurrentWeekPlan();
      if (!plan) {
        setError("Generate your week first, then come back for the grocery list.");
        return;
      }
      const { categories: newCategories } = await generateGroceryList(plan.days);
      await saveGroceryListForCurrentWeek(newCategories);
      setCategories(newCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't build your grocery list.");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerLink}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grocery List</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!loaded && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.ink} />
        </View>
      )}

      {loaded && (
        <ScrollView contentContainerStyle={styles.content}>
          {!categories && !regenerating && (
            <Text style={styles.empty}>
              No list yet. Head back to My Week and tap "View grocery list" once you have a plan.
            </Text>
          )}

          {regenerating && (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.generatingText}>Building your list...</Text>
            </View>
          )}

          {!regenerating &&
            categories &&
            categories.map((category) => (
              <View key={category.name} style={styles.categoryBlock}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                {category.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, regenerating && styles.buttonDisabled]}
          onPress={handleRegenerate}
          disabled={regenerating}
        >
          <Text style={styles.buttonText}>
            {regenerating ? "Building..." : categories ? "Regenerate list" : "Build my list"}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 60,
  },
  generatingText: {
    fontFamily: "Inter_500Medium",
    color: colors.inkDim,
  },
  content: {
    padding: 16,
    gap: 22,
  },
  empty: {
    fontFamily: "Inter_500Medium",
    color: colors.inkDim,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingTop: 40,
  },
  categoryBlock: {
    gap: 10,
  },
  categoryTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.inkFaint,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accentLink,
  },
  itemText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14.5,
    color: colors.ink,
    flexShrink: 1,
  },
  error: {
    fontFamily: "Inter_500Medium",
    color: "#ff8a8a",
    fontSize: 13,
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
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: "Inter_700Bold",
    color: colors.bg,
    fontSize: 16,
  },
});
