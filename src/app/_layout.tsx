import { useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGame, useSettings } from '@/state/stores';
import { setupNotifications } from '@/lib/notifications';
import { Onboarding } from '@/components/Onboarding';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const init = useGame((s) => s.init);
  const { scheme, colors } = useTheme();
  const [initError, setInitError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const ready = useGame((s) => s.ready);
  const onboardingComplete = useSettings((s) => s.onboardingComplete);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setInitError(null);
        // Warm the SQLite worker (loads the WASM engine on web) then release the handle,
        // so the synchronous engine can acquire the OPFS file exclusively. No-op cost on native.
        const SQLite = await import('expo-sqlite');
        const warm = await SQLite.openDatabaseAsync('pawductivity.db');
        await warm.closeAsync();
        if (!cancelled) init(); // migrate DB, apply lazy health decay, hydrate stores
        void setupNotifications(); // Android channel + foreground handler (no-op on web)
      } catch (e) {
        console.error('DB init failed', e);
        if (!cancelled) setInitError(e as Error); // surface instead of a silent stuck "Loading…"
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [init, attempt]);

  // Re-apply health decay + refresh dashboard stats whenever the app returns to the
  // foreground. Backgrounding without a kill keeps this component mounted, so the init
  // effect above never re-runs across midnights — this listener is what advances decay
  // and the "today"/streak figures on resume.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') useGame.getState().resume();
    });
    return () => sub.remove();
  }, []);

  if (initError) {
    return (
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Text style={{ fontSize: 40 }}>🐾</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>Couldn’t start Pawductivity</Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{initError.message}</Text>
          <Pressable
            onPress={() => setAttempt((a) => a + 1)}
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 }}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      {ready && !onboardingComplete ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Onboarding />
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}
