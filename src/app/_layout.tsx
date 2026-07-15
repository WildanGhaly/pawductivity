import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGame } from '@/state/stores';
import { setupNotifications } from '@/lib/notifications';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const init = useGame((s) => s.init);
  const { scheme, colors } = useTheme();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Warm up the SQLite engine before the synchronous data layer runs.
        // On web this initializes the WASM worker up front so the sync API
        // doesn't race its own async worker startup; on native it's a cheap open.
        const SQLite = await import('expo-sqlite');
        // Warm the SQLite worker (loads the WASM engine on web) then release the handle,
        // so the synchronous engine can acquire the OPFS file exclusively. No-op cost on native.
        const warm = await SQLite.openDatabaseAsync('pawductivity.db');
        await warm.closeAsync();
        if (!cancelled) init(); // migrate DB, apply lazy health decay, hydrate stores
        void setupNotifications(); // Android channel + foreground handler (no-op on web)
      } catch (e) {
        console.error('DB init failed', e);
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
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
