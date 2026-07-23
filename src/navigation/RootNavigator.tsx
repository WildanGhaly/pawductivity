import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { MainScreen } from '../screens/MainScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useStore } from '../store/store';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Splash waits for both its timer and store hydration, then routes to Main (if a
// saved profile exists) or Onboarding (first run).
function SplashRoute({ navigation }: any) {
  const hydrated = useStore((s) => s.hydrated);
  const hasState = useStore((s) => !!s.state);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    if (timeUp && hydrated) {
      navigation.replace(hasState ? 'Main' : 'Onboarding');
    }
  }, [timeUp, hydrated, hasState, navigation]);

  return <SplashScreen onDone={() => setTimeUp(true)} />;
}

// Overlay screens (Focus/Shop/Premium/etc.) are added here in later PRs with
// animation: 'slide_from_bottom' to match the prototype's slide-up sheets.
export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Splash" component={SplashRoute} />
      <Stack.Screen name="Onboarding">
        {({ navigation }) => <OnboardingScreen onComplete={() => navigation.replace('Main')} />}
      </Stack.Screen>
      <Stack.Screen name="Main" component={MainScreen} />
    </Stack.Navigator>
  );
}
