import { Tabs } from 'expo-router';
import { Image, View } from 'react-native';
import { navIcon, uiIcon } from '@/lib/assets';

/**
 * Bottom navbar exactly like the legacy app_navbar.dart: the full-colour nav icons (NO
 * tint), icon-only, with the line.png underline on the active tab. Home = paw (the pet
 * room), Quests = todo, Remind = calendar, Shop = shop, Profile = profile.
 */
function TabIcon({ source, focused }: { source: any; focused: boolean }) {
  // Legacy app_navbar.dart draws every icon at full colour/opacity — the active tab is
  // distinguished only by the line.png underline. (A dimmed inactive icon just looked
  // washed-out and unreadable on the white bar.)
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 54, paddingTop: 8, gap: 4 }}>
      <Image source={source} style={{ width: 32, height: 32 }} resizeMode="contain" />
      <Image source={navIcon('line')} style={{ width: 24, height: 4, opacity: focused ? 1 : 0 }} resizeMode="contain" />
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
