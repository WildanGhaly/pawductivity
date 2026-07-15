import { Tabs } from 'expo-router';
import { Image, type ColorValue } from 'react-native';
import { navIcon, uiIcon } from '@/lib/assets';
import { useTheme } from '@/theme';

function TabIcon({ source, color }: { source: any; color: ColorValue }) {
  return <Image source={source} style={{ width: 26, height: 26, tintColor: color }} resizeMode="contain" />;
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon source={navIcon('home')} color={color} /> }}
      />
      <Tabs.Screen
        name="quests"
        options={{ title: 'Quests', tabBarIcon: ({ color }) => <TabIcon source={navIcon('todo')} color={color} /> }}
      />
      <Tabs.Screen
        name="reminders"
        options={{ title: 'Remind', tabBarIcon: ({ color }) => <TabIcon source={navIcon('calendar')} color={color} /> }}
      />
      <Tabs.Screen
        name="shop"
        options={{ title: 'Shop', tabBarIcon: ({ color }) => <TabIcon source={uiIcon('shop')} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon source={navIcon('profile')} color={color} /> }}
      />
    </Tabs>
  );
}
