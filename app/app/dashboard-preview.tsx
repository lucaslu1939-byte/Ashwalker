import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientCard, cardText } from "../src/components/GradientCard";
import { ProgressRing } from "../src/components/ProgressRing";
import { colors } from "../src/theme/colors";

// Dev-only visual smoke test for the new design system — not linked from
// anywhere an end user would find it, and not wired to real data. Confirms
// the gradient-card + ring + font language renders correctly before it's
// used to build the actual weekly dashboard.
export default function DashboardPreview() {

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Text style={styles.brand}>Ashwalker</Text>
      <Text style={styles.greeting}>DESIGN SYSTEM PREVIEW</Text>

      <View style={styles.grid}>
        <GradientCard flavor="mauve">
          <Text style={cardText.label}>Fasting Window</Text>
          <View style={styles.ringWrap}>
            <ProgressRing progress={0.78} />
            <View style={styles.ringCenter}>
              <Text style={styles.ringNum}>14:20</Text>
              <Text style={styles.ringUnit}>Elapsed</Text>
            </View>
          </View>
          <Text style={cardText.sub}>6h 40m to target</Text>
        </GradientCard>

        <GradientCard flavor="magenta">
          <Text style={cardText.label}>Cellular Cleanse</Text>
          <Text style={cardText.readout}>
            72<Text style={cardText.readoutSmall}>%</Text>
          </Text>
          <Text style={cardText.sub}>Elimination pathways active</Text>
        </GradientCard>

        <GradientCard flavor="navy" span={2}>
          <Text style={cardText.label}>Energy Reserve</Text>
          <View style={styles.barsRow}>
            {[38, 55, 72, 100, 64, 44].map((h, i) => (
              <View key={i} style={[styles.bar, { height: `${h}%` }]} />
            ))}
          </View>
          <Text style={cardText.sub}>Vitality trending up</Text>
        </GradientCard>

        <GradientCard flavor="amber" span={2}>
          <Text style={cardText.label}>Digestive Rest</Text>
          <Text style={cardText.readout}>
            18<Text style={cardText.readoutSmall}>hrs today</Text>
          </Text>
          <Text style={cardText.sub}>Longest stretch: 6:00am–12:00pm</Text>
        </GradientCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
  },
  brand: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 22,
    color: colors.ink,
  },
  greeting: {
    marginTop: 6,
    marginBottom: 20,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: colors.inkFaint,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  ringWrap: {
    alignSelf: "center",
    position: "relative",
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ringNum: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 20,
    color: "#fff",
  },
  ringUnit: {
    fontFamily: "Inter_700Bold",
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
    marginTop: 1,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    height: 58,
    alignSelf: "center",
  },
  bar: {
    width: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
});
