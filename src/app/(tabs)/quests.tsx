import React from 'react';
import { View } from 'react-native';
import { useGame } from '@/state/stores';
import { Body, Card, Heading, Muted, Screen } from '@/components/ui';
import { QuickAdd } from '@/components/QuickAdd';
import { QuestRow } from '@/components/QuestRow';
import { spacing } from '@/theme';

export default function Quests() {
  const openTasks = useGame((s) => s.openTasks);

  return (
    <Screen>
      <Heading>Quests</Heading>

      <Card style={{ gap: spacing.sm }}>
        <Body style={{ fontWeight: '600' }}>Brain dump a new quest</Body>
        <QuickAdd />
      </Card>

      {openTasks.length === 0 ? (
        <Card>
          <Muted>No open quests. Dump one above ✨</Muted>
        </Card>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Muted>{openTasks.length} open · long-press a quest to delete</Muted>
          {openTasks.map((t) => (
            <QuestRow key={t.id} task={t} />
          ))}
        </View>
      )}
    </Screen>
  );
}
