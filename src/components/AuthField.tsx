import { useMemo, useState, type RefObject } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "../state/AppState";
import { authPalettes } from "../theme/colors";

export function AuthField({ label, icon, password = false, compact = false, inputRef, ...props }: TextInputProps & {
  label: string; icon: "user" | "mail" | "lock" | "key"; password?: boolean;
  compact?: boolean; inputRef?: RefObject<TextInput | null>;
}) {
  const { theme } = useApp();
  const colors = authPalettes[theme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrap, focused && styles.inputFocused]}>
      <Feather name={icon} size={18} color={focused ? colors.accent : colors.muted} />
      <TextInput {...props} ref={inputRef} accessibilityLabel={label}
        autoCapitalize={props.autoCapitalize ?? "none"} autoCorrect={false}
        placeholderTextColor={colors.placeholder} secureTextEntry={password && !visible}
        onFocus={event => { setFocused(true); props.onFocus?.(event); }}
        onBlur={event => { setFocused(false); props.onBlur?.(event); }}
        style={[styles.input, compact && styles.inputCompact]} />
      {password && <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        accessibilityState={{ checked: visible, disabled: props.editable === false }} disabled={props.editable === false}
        onPress={() => setVisible(value => !value)} style={({ pressed }) => [styles.eye, pressed && styles.pressed]}>
        <Feather name={visible ? "eye-off" : "eye"} size={19} color={colors.muted} />
      </Pressable>}
    </View>
  </View>;
}

const createStyles = (colors: typeof authPalettes.dark) => StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.label, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 15, paddingLeft: 15 },
  inputFocused: { borderColor: colors.focusBorder, backgroundColor: colors.inputFocus },
  input: { flex: 1, minWidth: 0, minHeight: 54, fontSize: 16, color: colors.text, paddingVertical: 14, paddingRight: 12 },
  inputCompact: { minHeight: 48, paddingVertical: 11 },
  eye: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.6 },
});
