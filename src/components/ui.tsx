import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "../state/AppState";
import { router, useFocusEffect } from "expo-router";
import { listSos } from "../lib/sos";
export function Copy({
  children,
  muted = false,
  title = false,
}: React.PropsWithChildren<{ muted?: boolean; title?: boolean | string }>) {
  const { colors } = useApp();
  return (
    <Text
      style={[
        styles.text,
        { color: muted ? colors.muted : colors.text },
        !!title && styles.title,
      ]}
    >
      {children ?? (typeof title === "string" ? title : null)}
    </Text>
  );
}
export function Screen({
  children,
  title,
  subtitle,
}: React.PropsWithChildren<{ title: string; subtitle?: string }>) {
  const { colors, online, sessionMessage, user, verified } = useApp();
  const [savedCount, setSavedCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void listSos()
        .then((records) => {
          if (active)
            setSavedCount(
              online
                ? records.filter((record) => record.phase !== "received").length
                : 0,
            );
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [online]),
  );
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.flex, { backgroundColor: colors.bg }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Feather name="shield" size={28} color={colors.primary} />
            <View style={styles.flex}>
              <Copy title>{title}</Copy>
              {subtitle && <Copy muted>{subtitle}</Copy>}
            </View>
          </View>
          {!online && (
            <Notice text="Offline • Guides and reference maps are available. SOS requests must be reviewed and sent when connected." />
          )}
          {!!sessionMessage && <Notice text={sessionMessage} />}
          {online && savedCount > 0 && (
            <Card>
              <Copy>
                {savedCount} locally saved SOS record(s) need review.
                Reconnecting does not send them.
              </Copy>
              <Button
                secondary
                title="Review local SOS records"
                onPress={() =>
                  router.push(
                    verified && user?.role === "residents" ? "/resident/sos" : "/guest-sos",
                  )
                }
              />
            </Card>
          )}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Card({ children }: React.PropsWithChildren) {
  const { colors } = useApp();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  danger = false,
  secondary = false,
  disabled = false,
  loading = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Feather>["name"];
}) {
  const { colors } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary
            ? colors.card
            : danger
              ? colors.danger
              : colors.primary,
          borderColor: secondary ? colors.border : "transparent",
          opacity: disabled || loading ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.text : "#fff"} />
      ) : (
        icon && (
          <Feather
            name={icon}
            size={20}
            color={secondary ? colors.text : "#fff"}
          />
        )
      )}
      <Text
        style={[styles.buttonText, { color: secondary ? colors.text : "#fff" }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors } = useApp();
  return (
    <View style={styles.field}>
      <Copy muted>{label}</Copy>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            color: colors.text,
          },
          props.multiline && styles.multiline,
          props.style,
        ]}
      />
    </View>
  );
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  const { colors } = useApp();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.notice,
        {
          backgroundColor: colors.tint,
          borderLeftColor: error ? colors.danger : colors.primary,
        },
      ]}
    >
      <Copy>{text}</Copy>
    </View>
  );
}
export function Unavailable({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  const { colors } = useApp();
  return (
    <Card>
      <Feather name="info" size={25} color={colors.muted} />
      <Copy title>{title}</Copy>
      <Copy muted>{detail}</Copy>
    </Card>
  );
}
export function Loading({ text = "Loading IslaSafe…" }: { text?: string }) {
  const { colors } = useApp();
  return (
    <View style={[styles.loading, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Copy>{text}</Copy>
    </View>
  );
}
export function Dialog({
  visible,
  title,
  children,
  onClose,
  closeLabel = "Cancel",
}: React.PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  closeLabel?: string;
}>) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.dialogScroll}
          >
            <Card>
              <Copy title>{title}</Copy>
              {children}
              <Button secondary title={closeLabel} onPress={onClose} />
            </Card>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function Choices<T extends string>({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useApp();
  return (
    <View style={styles.field}>
      <Copy muted>{label}</Copy>
      <View style={styles.choices}>
        {values.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityLabel={item}
            accessibilityState={{ selected: value === item }}
            onPress={() => onChange(item)}
            style={[
              styles.choice,
              {
                backgroundColor: value === item ? colors.primary : colors.bg,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                { color: value === item ? "#fff" : colors.text },
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { padding: 20, gap: 16, paddingBottom: 36 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  text: { fontSize: 15, lineHeight: 23 },
  title: { fontSize: 23, fontWeight: "700", lineHeight: 31 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 12 },
  button: {
    minHeight: 52,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  field: { gap: 7 },
  input: {
    borderWidth: 1,
    borderRadius: 11,
    minHeight: 52,
    fontSize: 16,
    padding: 13,
  },
  multiline: { minHeight: 116, textAlignVertical: "top" },
  notice: { borderLeftWidth: 3, borderRadius: 10, padding: 14 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "#0009",
    justifyContent: "center",
    padding: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    maxHeight: "90%",
  },
  dialogScroll: { flexShrink: 1 },
});
