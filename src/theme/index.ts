import { palette, type ColorTokens } from './tokens';

export interface Theme {
  colors: ColorTokens;
  scheme: 'light' | 'dark';
}

/**
 * The product is a warm, sunny-day meadow. The legacy app is light-only
 * (scaffoldBackgroundColor: Colors.white), so the app renders light — no dark theme,
 * which would only muddy the meadow art.
 */
export function useTheme(): Theme {
  return { colors: palette.light, scheme: 'light' };
}

export * from './tokens';
