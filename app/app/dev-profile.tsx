import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProfile } from "../src/data/repositories/profileRepository";
import { colors } from "../src/theme/colors";

// Dev-only screen for verifying the update_profile tool is actually
// capturing intake data. Not linked from anywhere end users would find.
export default function DevProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProfile().then((data) => {
      setProfile(data);
      setLoaded(true);
    });
  }, []);

  const entries = Object.entries(profile);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Captured Profile (dev)</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {!loaded && <Text style={styles.empty}>Loading...</Text>}
        {loaded && entries.length === 0 && (
          <Text style={styles.empty}>No profile fields captured yet.</Text>
        )}
        {entries.map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.key}>{key}</Text>
            <Text style={styles.value}>{value}</Text>
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
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  title: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 18,
    color: colors.ink,
  },
  back: {
    fontFamily: "Inter_600SemiBold",
    color: colors.accentLink,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  empty: {
    fontFamily: "Inter_500Medium",
    color: colors.inkFaint,
    fontStyle: "italic",
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
    paddingBottom: 8,
  },
  key: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: colors.accentLink,
    textTransform: "uppercase",
  },
  value: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    marginTop: 2,
    color: colors.ink,
  },
});
