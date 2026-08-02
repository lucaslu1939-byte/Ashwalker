import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";

type MealCardProps = {
  label: string;
  text: string;
  onPress: () => void;
  onShuffle?: () => void;
  shuffling?: boolean;
  disabled?: boolean;
};

// A single tappable rectangle for one item in the day (celery juice, a
// meal, etc.) — tapping opens the full recipe; an optional Shuffle control
// swaps the item for an alternative without opening anything.
export function MealCard({ label, text, onPress, onShuffle, shuffling, disabled }: MealCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {onShuffle && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onShuffle();
            }}
            disabled={disabled}
          >
            {shuffling ? (
              <ActivityIndicator size="small" color={colors.inkDim} />
            ) : (
              <Text style={[styles.shuffleText, disabled && styles.shuffleTextDisabled]}>
                Shuffle
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElev,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.inkFaint,
  },
  shuffleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.accentOrange,
  },
  shuffleTextDisabled: {
    color: colors.inkFaint,
  },
  text: {
    fontFamily: "Inter_500Medium",
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink,
  },
});
