import * as React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { DimensionValue, TextStyle } from "react-native";

type CardProps = {
  children: React.ReactNode;
  tone?: "default" | "blue" | "red" | "green";
};

export const colors = {
  background: "#f4f1ea",
  card: "#fffdf8",
  ink: "#171717",
  muted: "#6b6862",
  line: "#ded6c8",
  blue: "#2867b2",
  red: "#c33a2b",
  green: "#4f7a52",
  gold: "#a77a26",
};

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 36 }}
    >
      {children}
    </ScrollView>
  );
}

export function AppText({
  children,
  variant = "body",
  color,
}: {
  children: React.ReactNode;
  variant?: "title" | "subtitle" | "label" | "body" | "number";
  color?: string;
}) {
  const style: TextStyle =
    variant === "title"
      ? { fontSize: 30, fontWeight: "800" as const, color: color ?? colors.ink }
      : variant === "subtitle"
        ? { fontSize: 20, fontWeight: "700" as const, color: color ?? colors.ink }
        : variant === "label"
          ? { fontSize: 12, fontWeight: "800" as const, letterSpacing: 0, color: color ?? colors.muted, textTransform: "uppercase" as const }
          : variant === "number"
            ? { fontSize: 28, fontWeight: "800" as const, color: color ?? colors.ink, fontVariant: ["tabular-nums"] }
            : { fontSize: 15, lineHeight: 21, color: color ?? colors.ink };
  return (
    <Text selectable style={style}>
      {children}
    </Text>
  );
}

export function Card({ children, tone = "default" }: CardProps) {
  const borderColor = tone === "blue" ? colors.blue : tone === "red" ? colors.red : tone === "green" ? colors.green : colors.line;
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor,
        borderWidth: 1,
        borderRadius: 8,
        borderCurve: "continuous",
        padding: 14,
        gap: 10,
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
      }}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  tone = "ink",
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: "ink" | "blue" | "red" | "ghost";
  disabled?: boolean;
}) {
  const backgroundColor = tone === "ghost" ? "transparent" : tone === "blue" ? colors.blue : tone === "red" ? colors.red : colors.ink;
  const textColor = tone === "ghost" ? colors.ink : "#fff";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 44,
        borderRadius: 8,
        borderCurve: "continuous",
        borderColor: disabled ? colors.line : tone === "ghost" ? colors.line : backgroundColor,
        borderWidth: 1,
        opacity: disabled ? 0.45 : 1,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

export function OptionGrid<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ id: T; title: string; description?: string }>;
  selected?: T;
  onSelect: (id: T) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={{
              padding: 12,
              borderRadius: 8,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: active ? colors.blue : colors.line,
              backgroundColor: active ? "#e8f0fb" : "#fff",
              gap: 4,
            }}
          >
            <AppText variant="subtitle" color={active ? colors.blue : colors.ink}>
              {option.title}
            </AppText>
            {option.description ? <AppText color={colors.muted}>{option.description}</AppText> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          minHeight: multiline ? 120 : 46,
          borderRadius: 8,
          borderCurve: "continuous",
          borderColor: colors.line,
          borderWidth: 1,
          backgroundColor: "#fff",
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 16,
        }}
      />
    </View>
  );
}

export function Meter({ label, value, color = colors.blue }: { label: string; value: number; color?: string }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as DimensionValue;
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="label">{Math.round(value)}%</AppText>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: "#e7dfd2", overflow: "hidden" }}>
        <View style={{ width, height: 8, backgroundColor: color }} />
      </View>
    </View>
  );
}

export function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={{ minWidth: 92, flex: 1, gap: 2 }}>
      <AppText variant="number" color={color}>
        {value}
      </AppText>
      <AppText variant="label">{label}</AppText>
    </View>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{children}</View>;
}

export function SegmentedSubnav<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ id: T; label: string }>;
  selected: T;
  onSelect: (id: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={{
              minHeight: 38,
              borderRadius: 8,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: active ? colors.blue : colors.line,
              backgroundColor: active ? "#e8f0fb" : colors.card,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: active ? colors.blue : colors.ink, fontSize: 14, fontWeight: "800" }} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
