import { Tabs } from 'expo-router';
import { Image, View } from 'react-native';
import { navIcon, uiIcon } from '@/lib/assets';

/**
 * Bottom navbar exactly like the legacy app_navbar.dart: the full-colour nav icons (NO
 * tint), icon-only, with the line.png underline on the active tab. Home = paw (the pet
 * room), Quests = todo, Remind = calendar, Shop = shop, Profile = profile.
 */
function TabIcon({ source, focused }: { source: any; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 54, paddingTop: 8, gap: 4 }}>
      <Image source={source} style={{ width: 30, height: 30, opacity: focused ? 1 : 0.45 }} resizeMode="contain" />
      <Image source={navIcon('line')} style={{ width: 22, height: 4, opacity: focused ? 1 : 0 }} resizeMode="contain" />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: 68,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon source={navIcon('paw')} focused={focused} /> }} />
      <Tabs.Screen name="quests" options={{ title: 'Quests', tabBarIcon: ({ focused }) => <TabIcon source={navIcon('todo')} focused={focused} /> }} />
      <Tabs.Screen name="reminders" options={{ title: 'Remind', tabBarIcon: ({ focused }) => <TabIcon source={navIcon('calendar')} focused={focused} /> }} />
      <Tabs.Screen name="shop" options={{ title: 'Shop', tabBarIcon: ({ focused }) => <TabIcon source={uiIcon('shop')} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon source={navIcon('profile')} focused={focused} /> }} />
    </Tabs>
  );
}
