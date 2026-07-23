import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { fonts } from './src/assets/registry';
import { colors } from './src/theme/tokens';

export default function App() {
  const [loaded] = useFonts(fonts);

  if (!loaded) {
    // Keep the frame teal so the transition into the splash gradient is seamless.
    return <View style={{ flex: 1, backgroundColor: colors.teal }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
