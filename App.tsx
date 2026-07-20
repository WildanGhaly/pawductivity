import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';

const LOGO = require('./assets/icon/logo-paw.png');

/**
 * Placeholder shell. Exists so the project produces a real, installable AAB — enough to
 * validate signing, the package name, and the Play review/testing pipeline while the actual
 * app is rebuilt. Replace this with the real app entry point.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Pawductivity</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C4C60',
    gap: 12,
  },
  logo: { width: 140, height: 140 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#E28A4B', fontSize: 16 },
});
