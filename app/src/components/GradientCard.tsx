import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients, colors, type GradientName } from "../theme/colors";

type GradientCardProps = {
  flavor: GradientName;
  children: ReactNode;
  style?: ViewStyle;
  span?: 1 | 2;
};

// A single card "flavor" from the dashboard's visual language: a diagonal
// two-stop gradient, rounded corners, hairline border, and a soft diagonal
// sheen overlay for a glassy highlight.
export function GradientCard({ flavor, children, style, span = 1 }: GradientCardProps) {
  const [start, end] = gradients[flavor];
  return (
    <View style={[styles.wrapper, span === 2 && styles.spanTwo, style]}>
      <LinearGradient
        colors={[start, end]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 168,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  spanTwo: {
    flexBasis: "100%",
  },
  content: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
});

export const cardText = StyleSheet.create({
  label: {
    fontSize: 10.5,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.onCardLabel,
  },
  sub: {
    fontSize: 10.5,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    color: colors.onCardSub,
  },
  readout: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 34,
    lineHeight: 36,
    color: colors.onCardStrong,
    letterSpacing: -0.3,
  },
  readoutSmall: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    opacity: 0.55,
  },
  body: {
    fontFamily: "Inter_500Medium",
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.onCardStrong,
  },
});
