import { useColorScheme } from 'react-native';
import { useSettings } from '../state/stores';
import { palette, type ColorTokens } from './tokens';

export interface Theme {
  colors: ColorTokens;
  scheme: 'light' | 'dark';
}

/** Active theme = user preference, falling back to the OS color scheme. */
export function useTheme(): Theme {
  const system = useColorScheme();
  const pref = useSettings((s) => s.colorScheme);
  const scheme: 'light' | 'dark' = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  return { colors: palette[scheme], scheme };
}

export * from './tokens';
