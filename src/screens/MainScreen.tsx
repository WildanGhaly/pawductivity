import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';
import { Txt } from '../components/ui';
import { TabBar, TabKey } from '../components/TabBar';

// PR1 shell: the tab framework runs; real tab content is filled in later PRs
// (Home/Pet in PR3, Quests in PR4, Calendar in PR7).
const LABELS: Record<TabKey, string> = {
  home: 'Home',
  quests: 'Quests',
  pet: 'Pet',
  cal: 'Calendar',
};

export function MainScreen() {
  const [tab, setTab] = useState<TabKey>('home');
  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Txt weight={800} size={22} color={colors.tealInk}>
          {LABELS[tab]}
        </Txt>
        <Txt color={colors.muted} style={{ marginTop: 6 }}>
          Coming together, one PR at a time.
        </Txt>
      </View>
      <TabBar active={tab} onTab={setTab} onCapture={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
