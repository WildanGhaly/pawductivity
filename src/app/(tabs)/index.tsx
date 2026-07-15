import React from 'react';
import { View } from 'react-native';
import { selectActivePet, useGame } from '@/state/stores';
import { Body, Card, CoinPill, Heading, Muted, Pill, ProgressBar, Screen, StatTile } from '@/components/ui';
import { CompanionView } from '@/components/CompanionView';
import { WeeklyChart } from '@/components/WeeklyChart';
import { QuickAdd } from '@/components/QuickAdd';
import { QuestRow } from '@/components/QuestRow';
import { companionLine, moodFor } from '@/lib/companion';
import { formatDuration } from '@/lib/date';
import { spacing, useTheme } from '@/theme';

export default function Home() {
  const { colors } = useTheme();
  const ready = useGame((s) => s.ready);
  const profile = useGame((s) => s.profile);
  const openTasks = useGame((s) => s.openTasks);
  const pet = useGame(selectActivePet);
  const focusToday = useGame((s) => s.focusToday);
  const doneToday = useGame((s) => s.doneToday);
  const streak = useGame((s) => s.streak);
  const week = useGame((s) => s.week);

  if (!ready || !profile) {
    return (
      <Screen scroll={false}>
        <Muted>Loading…</Muted>
      </Screen>
    );
  }

  const mood = pet ? moodFor(pet.health) : null;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Muted>Welcome back</Muted>
          <Heading>{profile.display_name}</Heading>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          {streak > 0 ? <Pill label={`🔥 ${streak}`} color={colors.accent} textColor={colors.onAccent} /> : null}
          <CoinPill amount={profile.coins} />
        </View>
      </View>

      {pet && mood ? (
        <Card style={{ alignItems: 'center', gap: spacing.sm }}>
          <CompanionView species={pet.species} stage={pet.evolution_stage} health={pet.health} />
          <Heading>
            {pet.name} {mood.emoji}
          </Heading>
          <Muted>{companionLine(pet.health, openTasks.length)}</Muted>
          <View style={{ width: '100%', gap: 4, marginTop: spacing.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Muted>Health · {mood.label}</Muted>
              <Muted>{pet.health}/100</Muted>
            </View>
            <ProgressBar value={pet.health} max={100} color={colors.health} />
          </View>
        </Card>
      ) : null}

      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Body style={{ fontWeight: '600' }}>Level {profile.level}</Body>
          <Muted>
            {profile.current_xp}/{profile.needed_xp} XP
          </Muted>
        </View>
        <ProgressBar value={profile.current_xp} max={profile.needed_xp} />
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatTile label="Focus today" value={formatDuration(focusToday)} />
        <StatTile label="Quests done" value={String(doneToday)} />
        <StatTile label="Open" value={String(openTasks.length)} />
      </View>

      <Card>
        <WeeklyChart data={week} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Body style={{ fontWeight: '600' }}>Brain dump</Body>
        <QuickAdd />
      </Card>

      {openTasks.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Body style={{ fontWeight: '600' }}>Today’s quests</Body>
          {openTasks.slice(0, 4).map((t) => (
            <QuestRow key={t.id} task={t} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
