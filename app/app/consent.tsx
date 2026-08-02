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
import { colors } from "../src/theme/colors";

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
          <Text style={[styles.buttonText, !reachedEnd && styles.buttonTextDisabled]}>
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
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 24,
    color: colors.ink,
    marginBottom: 8,
  },
  paragraph: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
  },
  bold: {
    fontFamily: "Inter_700Bold",
    color: colors.ink,
  },
  footer: {
    marginTop: 8,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
    color: colors.inkDim,
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
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  buttonText: {
    fontFamily: "Inter_700Bold",
    color: colors.bg,
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: colors.inkFaint,
  },
});
