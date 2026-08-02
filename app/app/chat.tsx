import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { sendCoachMessage, type ChatMessage } from "../src/services/coachApi";
import {
  appendMessage,
  getMessages,
} from "../src/data/repositories/conversationRepository";
import { getProfile, updateFields } from "../src/data/repositories/profileRepository";
import { colors } from "../src/theme/colors";

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMessages(), getProfile()]).then(([history, savedProfile]) => {
      setMessages(history);
      setProfile(savedProfile);
      setLoaded(true);
    });
  }, []);

  async function requestCoachReply(conversation: ChatMessage[]) {
    setSending(true);
    setError(null);

    try {
      const { reply, profileUpdates } = await sendCoachMessage(conversation, profile);
      setMessages([...conversation, { role: "assistant", content: reply }]);
      await appendMessage("assistant", reply);

      if (Object.keys(profileUpdates).length > 0) {
        setProfile((prev) => ({ ...prev, ...profileUpdates }));
        await updateFields(profileUpdates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    await appendMessage("user", text);
    await requestCoachReply(nextMessages);
  }

  function handleRetry() {
    if (sending || messages.length === 0) return;
    requestCoachReply(messages);
  }

  if (!loaded) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.ink} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ashwalker</Text>
        <TouchableOpacity onPress={() => router.push("/dashboard")}>
          <Text style={styles.headerLink}>My Week</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.messageList}
          data={messages}
          keyExtractor={(_, index) => String(index)}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.role === "user" ? styles.userBubbleText : styles.assistantBubbleText,
                ]}
              >
                {item.content}
              </Text>
            </View>
          )}
        />
        {error && (
          <View style={styles.errorRow}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity onPress={handleRetry} disabled={sending}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
        {__DEV__ && (
          <View style={styles.devLinkRow}>
            <TouchableOpacity onPress={() => router.push("/dev-profile")}>
              <Text style={styles.devLinkText}>dev: view profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/dashboard-preview")}>
              <Text style={styles.devLinkText}>dev: design preview</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.inkFaint}
            editable={!sending}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    color: colors.accentLink,
  },
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    padding: 16,
    gap: 8,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.ink,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  bubbleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 21,
  },
  userBubbleText: {
    color: colors.bg,
  },
  assistantBubbleText: {
    color: colors.ink,
  },
  devLinkRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 4,
  },
  devLinkText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: colors.inkFaint,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  error: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    color: "#ff8a8a",
  },
  retryText: {
    fontFamily: "Inter_600SemiBold",
    color: colors.accentLink,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bgElev,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sendButtonText: {
    fontFamily: "Inter_700Bold",
    color: colors.bg,
  },
});
