import React from 'react';
import { View } from 'react-native';
import { selectActivePet, useGame } from '@/state/stores';
import { Body, Card, CoinPill, Heading, Muted, Pill, ProgressBar, Screen, StatTile } from '@/components/ui';
import { CompanionView } from '@/components/CompanionView';
import { MeadowBackground } from '@/components/MeadowBackground';
import { WeeklyChart } from '@/components/WeeklyChart';
import { QuickAdd } from '@/components/QuickAdd';
import { QuickFocus } from '@/components/QuickFocus';
import { QuestRow } from '@/components/QuestRow';
import { companionLine, moodFor } from '@/lib/companion';
import { formatDuration } from '@/lib/date';
import { radius, spacing, useTheme } from '@/theme';

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
  const equippedClothes = useGame((s) => s.equippedClothes);

  if (!ready || !profile) {
    return (
      <Screen scroll={false} background={<MeadowBackground />}>
        <Muted>Loading…</Muted>
      </Screen>
    );
  }

  const mood = pet ? moodFor(pet.health) : null;

  return (
    <Screen background={<MeadowBackground />}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Body style={{ color: colors.text, opacity: 0.7 }}>Welcome back</Body>
          <Heading style={{ fontSize: 26 }}>{profile.display_name}</Heading>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          {streak > 0 ? <Pill label={`🔥 ${streak}`} color={colors.accent} textColor={colors.onAccent} /> : null}
          <CoinPill amount={profile.coins} />
        </View>
      </View>

      {/* Companion standing in the meadow — no card, just the pet in the field */}
      {pet && mood ? (
        <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
          <CompanionView
            species={pet.species}
            clothesId={equippedClothes[0]?.id}
            health={pet.health}
            size={240}
          />
          <Heading style={{ fontSize: 24 }}>
            {pet.name} {mood.emoji}
          </Heading>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.85)',
              borderRadius: radius.pill,
              paddingVertical: 8,
              paddingHorizontal: spacing.lg,
              alignItems: 'center',
              gap: 6,
              alignSelf: 'stretch',
              marginHorizontal: spacing.sm,
            }}
          >
            <Body style={{ color: colors.text, fontWeight: '600', textAlign: 'center' }}>
              {companionLine(pet.health, openTasks.length)}
            </Body>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Muted>Health · {mood.label}</Muted>
              <Muted>{pet.health}/100</Muted>
            </View>
            <ProgressBar value={pet.health} max={100} color={colors.health} />
          </View>
        </View>
      ) : null}

      <QuickFocus />

      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Body style={{ fontWeight: '700' }}>Level {profile.level}</Body>
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
        <Body style={{ fontWeight: '700' }}>Brain dump ✨</Body>
        <QuickAdd />
      </Card>

      {openTasks.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Body style={{ fontWeight: '700', color: colors.text }}>Today’s quests</Body>
          {openTasks.slice(0, 4).map((t) => (
            <QuestRow key={t.id} task={t} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
