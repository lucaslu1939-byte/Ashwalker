import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DISCLAIMER_FOOTER,
  DISCLAIMER_INTRO,
  DISCLAIMER_POINTS,
  DISCLAIMER_TITLE,
} from "../src/data/disclaimerText";
import { recordConsent } from "../src/data/repositories/consentRepository";

const SCROLL_END_THRESHOLD = 24;

export default function Consent() {
  const router = useRouter();
  const [reachedEnd, setReachedEnd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const containerHeight = useRef(0);
  const contentHeight = useRef(0);

  function checkFitsWithoutScrolling() {
    if (containerHeight.current > 0 && contentHeight.current > 0) {
      if (contentHeight.current <= containerHeight.current + SCROLL_END_THRESHOLD) {
        setReachedEnd(true);
      }
    }
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom <= SCROLL_END_THRESHOLD) {
      setReachedEnd(true);
    }
  }

  async function handleAgree() {
    if (!reachedEnd || submitting) return;
    setSubmitting(true);
    await recordConsent();
    router.replace("/chat");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        onLayout={(event) => {
          containerHeight.current = event.nativeEvent.layout.height;
          checkFitsWithoutScrolling();
        }}
        onContentSizeChange={(_, height) => {
          contentHeight.current = height;
          checkFitsWithoutScrolling();
        }}
        scrollEventThrottle={16}
      >
        <Text style={styles.title}>{DISCLAIMER_TITLE}</Text>
        <Text style={styles.paragraph}>{DISCLAIMER_INTRO}</Text>
        {DISCLAIMER_POINTS.map((point) => (
          <Text key={point.lead} style={styles.paragraph}>
            <Text style={styles.bold}>{point.lead}</Text> {point.rest}
          </Text>
        ))}
        <Text style={[styles.paragraph, styles.footer]}>{DISCLAIMER_FOOTER}</Text>
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, !reachedEnd && styles.buttonDisabled]}
          onPress={handleAgree}
          disabled={!reachedEnd || submitting}
        >
          <Text style={styles.buttonText}>
            {reachedEnd ? "I understand and agree" : "Scroll to read more"}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },
  bold: {
    fontWeight: "700",
    color: "#111",
  },
  footer: {
    marginTop: 8,
    fontStyle: "italic",
    color: "#555",
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
