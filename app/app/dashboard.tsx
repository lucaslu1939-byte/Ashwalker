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
import { GradientCard, cardText } from "../src/components/GradientCard";
import { colors } from "../src/theme/colors";
import type { DayPlan, MealType, WeeklyPlan } from "../src/data/types";
import {
  generateGroceryList,
  generateWeeklyPlan,
  swapRecipe,
} from "../src/services/coachApi";
import { getProfile } from "../src/data/repositories/profileRepository";
import {
  getCurrentWeekPlan,
  isStale,
  saveGroceryListForCurrentWeek,
  saveNewWeeklyPlan,
  updateDayMeal,
} from "../src/data/repositories/weeklyPlanRepository";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export default function Dashboard() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [weekPlan, setWeekPlan] = useState<WeeklyPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [swappingSlot, setSwappingSlot] = useState<string | null>(null);
  const [groceryBusy, setGroceryBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A single shared lock: only one of generate-week / swap-recipe /
  // build-grocery-list may be in flight at a time. Without this, a swap and
  // a "Regenerate this week" fired close together can both resolve against
  // whichever row is newest at write time, corrupting the wrong week.
  const busyRef = useRef<"generating" | "swapping" | "grocery" | null>(null);
  const busy = generating || swappingSlot !== null || groceryBusy;

  useEffect(() => {
    (async () => {
      try {
        const existing = await getCurrentWeekPlan();
        if (existing) {
          // Show what we have immediately — if a refresh below fails, this
          // stays on screen instead of the user losing their week entirely.
          setWeekPlan(existing);
          if (isStale(existing.weekStartDate)) {
            setLoaded(true);
            await handleGenerateWeek();
            return;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load your week.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function handleGenerateWeek() {
    if (busyRef.current) return;
    busyRef.current = "generating";
    setGenerating(true);
    setError(null);

    try {
      const profile = await getProfile();
      const { introNote, days } = await generateWeeklyPlan(profile);
      await saveNewWeeklyPlan(introNote, days);
      setWeekPlan({ weekStartDate: new Date().toISOString(), introNote, days, groceryList: null });
      setSelectedDay(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      busyRef.current = null;
      setGenerating(false);
    }
  }

  async function handleSwap(day: DayPlan, mealType: MealType) {
    const slotKey = `${day.dayNumber}-${mealType}`;
    if (busyRef.current) return;
    busyRef.current = "swapping";
    setSwappingSlot(slotKey);
    setError(null);

    try {
      const profile = await getProfile();
      const avoidRecipes =
        weekPlan?.days.map((d) => d[mealType]).filter((recipe) => recipe.length > 0) ?? [];
      const { recipe } = await swapRecipe(profile, mealType, avoidRecipes);
      await updateDayMeal(day.dayNumber, mealType, recipe);
      setWeekPlan((prev) =>
        prev
          ? {
              ...prev,
              groceryList: null,
              days: prev.days.map((d) =>
                d.dayNumber === day.dayNumber ? { ...d, [mealType]: recipe } : d
              ),
            }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't swap that recipe.");
    } finally {
      busyRef.current = null;
      setSwappingSlot(null);
    }
  }

  async function handleGoToGroceryList() {
    if (!weekPlan || busyRef.current) return;
    if (!weekPlan.groceryList) {
      busyRef.current = "grocery";
      setGroceryBusy(true);
      try {
        const { categories } = await generateGroceryList(weekPlan.days);
        await saveGroceryListForCurrentWeek(categories);
        setWeekPlan((prev) => (prev ? { ...prev, groceryList: categories } : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't build your grocery list.");
        return;
      } finally {
        busyRef.current = null;
        setGroceryBusy(false);
      }
    }
    router.push("/grocery-list");
  }

  const day = weekPlan?.days.find((d) => d.dayNumber === selectedDay) ?? null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/chat")}>
          <Text style={styles.headerLink}>Chat</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Week</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!loaded && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.ink} />
        </View>
      )}

      {loaded && !weekPlan && !generating && (
        <View style={styles.centered}>
          <Text style={styles.empty}>
            {error
              ? error
              : "No week planned yet. Chat with your coach a bit first, then come back here to generate your week."}
          </Text>
        </View>
      )}

      {generating && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.ink} />
          <Text style={styles.generatingText}>Putting your week together...</Text>
        </View>
      )}

      {!generating && weekPlan && day && (
        <>
          <Text style={styles.intro}>{weekPlan.introNote}</Text>

          <View style={styles.dayRow}>
            {weekPlan.days.map((d) => (
              <TouchableOpacity
                key={d.dayNumber}
                style={[styles.dayPill, d.dayNumber === selectedDay && styles.dayPillActive]}
                onPress={() => setSelectedDay(d.dayNumber)}
              >
                <Text
                  style={[
                    styles.dayPillText,
                    d.dayNumber === selectedDay && styles.dayPillTextActive,
                  ]}
                >
                  Day {d.dayNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.mealsBlock}>
              {(["breakfast", "lunch", "dinner"] as MealType[]).map((mealType) => {
                const slotKey = `${day.dayNumber}-${mealType}`;
                const isSwapping = swappingSlot === slotKey;
                return (
                  <View key={mealType} style={styles.mealRow}>
                    <View style={styles.mealRowHeader}>
                      <Text style={styles.mealLabel}>{MEAL_LABELS[mealType]}</Text>
                      <TouchableOpacity
                        onPress={() => handleSwap(day, mealType)}
                        disabled={busy}
                      >
                        {isSwapping ? (
                          <ActivityIndicator size="small" color={colors.inkDim} />
                        ) : (
                          <Text
                            style={[styles.shuffleText, busy && styles.shuffleTextDisabled]}
                          >
                            Shuffle
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.mealText}>{day[mealType]}</Text>
                  </View>
                );
              })}
              <View style={styles.mealRow}>
                <Text style={styles.mealLabel}>Snack</Text>
                <Text style={styles.mealText}>{day.snack}</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <GradientCard flavor="sage">
                <Text style={cardText.label}>Movement</Text>
                <Text style={cardText.body}>{day.movement}</Text>
              </GradientCard>
              <GradientCard flavor="magenta">
                <Text style={cardText.label}>Meditation</Text>
                <Text style={cardText.body}>{day.meditation}</Text>
              </GradientCard>
              <GradientCard flavor="navy" span={2}>
                <Text style={cardText.label}>Frequency Healing</Text>
                <Text style={cardText.body}>{day.frequencyHealing}</Text>
              </GradientCard>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={styles.groceryButton}
              onPress={handleGoToGroceryList}
              disabled={busy}
            >
              {groceryBusy ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : (
                <Text style={styles.groceryButtonText}>View grocery list</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={handleGenerateWeek}
              disabled={busy}
            >
              <Text style={styles.regenerateButtonText}>Regenerate this week</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      {loaded && !weekPlan && !generating && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGenerateWeek}>
            <Text style={styles.primaryButtonText}>Generate my week</Text>
          </TouchableOpacity>
        </View>
      )}
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
    color: colors.ink,
    opacity: 0.7,
  },
  headerSpacer: {
    width: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  empty: {
    fontFamily: "Inter_500Medium",
    color: colors.inkDim,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  generatingText: {
    fontFamily: "Inter_500Medium",
    color: colors.inkDim,
  },
  intro: {
    fontFamily: "Inter_500Medium",
    color: colors.inkDim,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  dayPillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dayPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
    color: colors.inkDim,
  },
  dayPillTextActive: {
    color: colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  mealsBlock: {
    backgroundColor: colors.bgElev,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    gap: 14,
  },
  mealRow: {
    gap: 4,
  },
  mealRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.inkFaint,
  },
  shuffleTextDisabled: {
    color: colors.inkFaint,
  },
  shuffleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.accentLink,
  },
  mealText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  error: {
    fontFamily: "Inter_500Medium",
    color: "#ff8a8a",
    fontSize: 13,
  },
  groceryButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 14,
    alignItems: "center",
  },
  groceryButtonText: {
    fontFamily: "Inter_600SemiBold",
    color: colors.ink,
  },
  regenerateButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  regenerateButtonText: {
    fontFamily: "Inter_500Medium",
    color: colors.inkFaint,
    fontSize: 12.5,
  },
  buttonRow: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: colors.ink,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "Inter_700Bold",
    color: colors.bg,
    fontSize: 16,
  },
});
