import React, { ReactNode } from 'react';
import {
  Text as RNText,
  TextProps,
  View,
  ViewStyle,
  StyleSheet,
  Pressable,
  Image,
  StyleProp,
  TextStyle,
} from 'react-native';
import { colors, fontFor, radius, shadow } from '../theme/tokens';
import { img } from '../assets/registry';

type Weight = 400 | 500 | 600 | 700 | 800;

// Text that always uses Poppins. weight picks Regular/Bold from the two shipped ttf.
export function Txt({
  weight = 400,
  color = colors.ink,
  size = 14,
  style,
  children,
  ...rest
}: TextProps & {
  weight?: Weight;
  color?: string;
  size?: number;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}) {
  return (
    <RNText
      {...rest}
      style={[{ fontFamily: fontFor(weight), color, fontSize: size }, style]}
    >
      {children}
    </RNText>
  );
}

type BtnVariant = 'orange' | 'teal' | 'ghost';
const BTN_FACE: Record<BtnVariant, string> = {
  orange: colors.orange,
  teal: colors.teal,
  ghost: colors.white,
};
const BTN_SHADE: Record<BtnVariant, string> = {
  orange: colors.orange2,
  teal: '#072f3d',
  ghost: colors.line2,
};

// The prototype's signature 3D "brick" button: a colored shade sits under the face;
// pressing pushes the face down onto it.
export function Btn({
  title,
  onPress,
  variant = 'orange',
  block,
  disabled,
  sm,
  style,
  left,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  block?: boolean;
  disabled?: boolean;
  sm?: boolean;
  style?: StyleProp<ViewStyle>;
  left?: ReactNode;
}) {
  const face = BTN_FACE[variant];
  const shade = BTN_SHADE[variant];
  const textColor = variant === 'ghost' ? colors.teal : colors.white;
  const lip = sm ? 4 : 6;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[block && { width: '100%' }, style, disabled && { opacity: 0.5 }]}
    >
      {({ pressed }) => (
        <View
          style={{
            borderRadius: sm ? radius.sm : radius.md,
            backgroundColor: variant === 'ghost' ? 'transparent' : shade,
            paddingBottom: disabled ? 0 : lip,
          }}
        >
          <View
            style={{
              borderRadius: sm ? radius.sm : radius.md,
              backgroundColor: face,
              paddingVertical: sm ? 9 : 14,
              paddingHorizontal: sm ? 14 : 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transform: [{ translateY: pressed && !disabled ? lip - 2 : 0 }],
              borderWidth: variant === 'ghost' ? 1.5 : 0,
              borderColor: colors.line2,
            }}
          >
            {left}
            <Txt weight={700} color={textColor} size={sm ? 13 : 15}>
              {title}
            </Txt>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.card, style]}>{children}</View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.97 }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export function CoinPill({ amount, style }: { amount: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.coinPill, style]}>
      <Image source={img.coin} style={{ width: 22, height: 22 }} />
      <Txt weight={700} color={colors.coinInk}>
        {amount.toLocaleString('en-US')}
      </Txt>
    </View>
  );
}

export function Chip({ label, color = colors.teal }: { label: string; color?: string }) {
  return (
    <View style={styles.chip}>
      <Txt weight={600} size={11.5} color={color}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.card,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line2,
    paddingVertical: 6,
    paddingLeft: 7,
    paddingRight: 12,
    borderRadius: radius.pill,
    ...shadow.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line2,
  },
});
