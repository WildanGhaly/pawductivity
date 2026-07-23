import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { MainScreen } from '../screens/MainScreen';

export type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Splash is a stack screen that navigates on to Main when its timer finishes.
// Overlay screens (Focus/Shop/Premium/etc.) are added here in later PRs with
// animation: 'slide_from_bottom' to match the prototype's slide-up sheets.
export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Splash">
        {({ navigation }) => (
          <SplashScreen onDone={() => navigation.replace('Main')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Main" component={MainScreen} />
    </Stack.Navigator>
  );
}
