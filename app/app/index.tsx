import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { hasConsented } from "../src/data/repositories/consentRepository";

export default function Index() {
  const [consented, setConsented] = useState<boolean | null>(null);

  useEffect(() => {
    hasConsented().then(setConsented);
  }, []);

  if (consented === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={consented ? "/chat" : "/consent"} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
