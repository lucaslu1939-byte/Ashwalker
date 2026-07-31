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
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
              <Text style={styles.bubbleText}>{item.content}</Text>
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
          <TouchableOpacity style={styles.devLink} onPress={() => router.push("/dev-profile")}>
            <Text style={styles.devLinkText}>dev: view profile</Text>
          </TouchableOpacity>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            editable={!sending}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
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
    backgroundColor: "#fff",
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DCEFE3",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F1F1",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  devLink: {
    alignItems: "center",
    paddingBottom: 4,
  },
  devLinkText: {
    fontSize: 11,
    color: "#AAA",
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
    color: "#B00020",
  },
  retryText: {
    color: "#3E7C59",
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DDD",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: "#3E7C59",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
