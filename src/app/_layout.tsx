import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGame } from '@/state/stores';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const init = useGame((s) => s.init);
  const { scheme, colors } = useTheme();

  useEffect(() => {
    try {
      init(); // open + migrate DB, apply lazy health decay, hydrate stores
    } catch (e) {
      console.error('DB init failed', e);
    } finally {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [init]);

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
