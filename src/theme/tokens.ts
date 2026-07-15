/**
 * Design tokens — the single palette/scale source (see context/design/brand-and-tokens.md).
 * Brand: primary teal #0C4C60, accent orange #E28A4B, health yellow #FFDA7C.
 * (NativeWind is the KB's intended styling layer; this typed token set + StyleSheet is the
 *  MVP implementation and also feeds any future Lottie recoloring.)
 */

export const brand = {
  teal: '#0C4C60',
  tealDark: '#083544',
  tealLight: '#12708C',
  orange: '#E28A4B',
  orangeLight: '#F0A96C',
  healthYellow: '#FFDA7C',
  splash: '#00688B',
} as const;

export const palette = {
  light: {
    bg: '#F6F8F9',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardAlt: '#EEF3F5',
    text: '#0B2530',
    textMuted: '#5B7480',
    border: '#DCE5E9',
    primary: brand.teal,
    onPrimary: '#FFFFFF',
    accent: brand.orange,
    onAccent: '#FFFFFF',
    health: brand.healthYellow,
    success: '#2E9E6B',
    onSuccess: '#FFFFFF',
    danger: '#D5573B',
    warning: '#E0A93B',
    coin: '#F4B740',
    overlay: 'rgba(9,37,48,0.45)',
  },
  dark: {
    bg: '#071A22',
    surface: '#0C2530',
    card: '#0F2C38',
    cardAlt: '#12333F',
    text: '#EAF2F5',
    textMuted: '#8AA4AE',
    border: '#1C3B47',
    primary: brand.tealLight,
    onPrimary: '#03151C',
    accent: brand.orangeLight,
    onAccent: '#2A1608',
    health: brand.healthYellow,
    success: '#41B983',
    // Dark ink so the ✓ glyph clears WCAG 3:1 on the lighter dark-mode success green
    // (white would be ~2.47:1). Mirrors the dark onPrimary/onAccent inks.
    onSuccess: '#04241A',
    danger: '#E5715A',
    warning: '#EBB84F',
    coin: '#F4B740',
    overlay: 'rgba(0,0,0,0.55)',
  },
};

export type ColorTokens = { [K in keyof typeof palette.light]: string };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const font = {
  size: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, display: 34 },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // The legacy app's typeface (assets/Poppins-*.ttf), loaded in _layout.
  family: {
    regular: 'Poppins',
    bold: 'PoppinsBold',
  },
} as const;
