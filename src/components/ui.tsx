import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uiIcon } from '@/lib/assets';
import { font, radius, spacing, useTheme } from '@/theme';

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  background,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Optional full-bleed backdrop (e.g. the meadow) rendered behind the content. */
  background?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl * 2, gap: spacing.lg }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: spacing.lg, gap: spacing.lg }}>{children}</View>
  );
  return (
    // Always paint a solid bg; the optional background node (meadow/room image) sits on top.
    // Never transparent — a failed background image must fall back to the theme colour, not black.
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      {background}
      {body}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          // soft float over the meadow
          shadowColor: '#0B2530',
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 5 },
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Heading({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return (
    <Text style={[{ color: colors.text, fontSize: font.size.xl, fontFamily: font.family.bold }, style]}>{children}</Text>
  );
}

export function Muted({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return <Text style={[{ color: colors.textMuted, fontSize: font.size.sm, fontFamily: font.family.regular }, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  // Custom fonts ignore fontWeight, so pick the bold family when a bold weight is requested.
  const w = (StyleSheet.flatten(style) as TextStyle | undefined)?.fontWeight;
  const family = w === '600' || w === '700' || w === '800' || w === 'bold' ? font.family.bold : font.family.regular;
  return <Text style={[{ color: colors.text, fontSize: font.size.md, fontFamily: family }, style]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'accent' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg =
    variant === 'primary' ? colors.primary : variant === 'accent' ? colors.accent : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'ghost' ? colors.primary : variant === 'accent' ? colors.onAccent : colors.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.primary,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text numberOfLines={1} style={{ color: fg, fontFamily: font.family.bold, fontSize: font.size.md }}>{label}</Text>
      )}
    </Pressable>
  );
}

export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const { colors } = useTheme();
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: colors.cardAlt, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color ?? colors.primary, borderRadius: radius.pill }} />
    </View>
  );
}

export function Pill({ label, color, textColor }: { label: string; color?: string; textColor?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: color ?? colors.cardAlt, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.md, alignSelf: 'flex-start' }}>
      <Text style={{ color: textColor ?? colors.textMuted, fontSize: font.size.xs, fontFamily: font.family.bold }}>{label}</Text>
    </View>
  );
}

export function CoinPill({ amount }: { amount: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardAlt, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md }}>
      <Image source={uiIcon('coin')} style={{ width: 18, height: 18 }} resizeMode="contain" />
      <Text style={{ color: colors.text, fontFamily: font.family.bold, fontSize: font.size.md }}>{amount}</Text>
    </View>
  );
}

export function StatTile({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.cardAlt, borderRadius: radius.md, padding: spacing.md, gap: 2 }}>
      <Text style={{ color: colors.text, fontSize: font.size.lg, fontFamily: font.family.bold }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: font.size.xs, fontFamily: font.family.regular }}>{label}</Text>
    </View>
  );
}

export const gap = (n: number): ViewStyle => ({ gap: n });
