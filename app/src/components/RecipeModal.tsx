import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../theme/colors";
import type { RecipeDetail } from "../data/types";
import { fetchRecipeDetail } from "../services/coachApi";
import {
  cacheRecipeDetail,
  getCachedRecipeDetail,
} from "../data/repositories/recipeDetailRepository";

type RecipeModalProps = {
  mealText: string | null;
  profile: Record<string, string>;
  onClose: () => void;
};

export function RecipeModal({ mealText, profile, onClose }: RecipeModalProps) {
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mealText) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setDetail(null);
    setError(null);
    setLoading(true);

    (async () => {
      try {
        const cached = await getCachedRecipeDetail(mealText);
        if (cached) {
          if (!cancelled) setDetail(cached);
          return;
        }
        const fetched = await fetchRecipeDetail(profile, mealText);
        await cacheRecipeDetail(mealText, fetched);
        if (!cancelled) setDetail(fetched);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load the recipe.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // profile is read at fetch time but shouldn't retrigger the effect on
    // every keystroke elsewhere in the app — only mealText opening/closing
    // the modal should.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealText]);

  return (
    <Modal visible={mealText !== null} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeLink}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {mealText && <Text style={styles.mealText}>{mealText}</Text>}

          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.ink} />
            </View>
          )}

          {error && !loading && (
            <View style={styles.centered}>
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          {detail && !loading && (
            <>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {detail.ingredients.map((item, i) => (
                <View key={i} style={styles.row}>
                  <View style={styles.bullet} />
                  <Text style={styles.rowText}>{item}</Text>
                </View>
              ))}

              <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Instructions</Text>
              {detail.instructions.map((step, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.stepNumber}>{i + 1}.</Text>
                  <Text style={styles.rowText}>{step}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
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
    paddingTop: 60,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  headerTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 17,
    color: colors.ink,
  },
  closeLink: {
    fontFamily: "Inter_600SemiBold",
    color: colors.accentOrange,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 20,
    gap: 10,
    paddingBottom: 60,
  },
  mealText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
    marginBottom: 8,
  },
  centered: {
    paddingVertical: 40,
    alignItems: "center",
  },
  error: {
    fontFamily: "Inter_500Medium",
    color: "#ff8a8a",
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.inkFaint,
    marginBottom: 4,
  },
  sectionSpacing: {
    marginTop: 18,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 3,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accentOrange,
    marginTop: 8,
  },
  stepNumber: {
    fontFamily: "Inter_700Bold",
    color: colors.accentOrange,
    fontSize: 14.5,
    minWidth: 20,
  },
  rowText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.ink,
  },
});
