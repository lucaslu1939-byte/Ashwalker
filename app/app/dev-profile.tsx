import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProfile } from "../src/data/repositories/profileRepository";

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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDD",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  back: {
    color: "#3E7C59",
    fontWeight: "600",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  empty: {
    color: "#888",
    fontStyle: "italic",
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEE",
    paddingBottom: 8,
  },
  key: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3E7C59",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 15,
    marginTop: 2,
    color: "#222",
  },
});
