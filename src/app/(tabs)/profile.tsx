import React, { useState } from 'react';
import { Pressable, Switch, TextInput, View } from 'react-native';
import * as repo from '@/db/repo';
import { selectActivePet, useEntitlement, useGame, useSettings } from '@/state/stores';
import { Body, Button, Card, CoinPill, Heading, Muted, ProgressBar, Screen } from '@/components/ui';
import { font, radius, spacing, useTheme } from '@/theme';

const SCHEMES = ['light', 'dark', 'system'] as const;

export default function Profile() {
  const { colors } = useTheme();
  const profile = useGame((s) => s.profile);
  const pet = useGame(selectActivePet);
  const refresh = useGame((s) => s.refresh);
  const renameCompanion = useGame((s) => s.renameCompanion);
  const colorScheme = useSettings((s) => s.colorScheme);
  const setColorScheme = useSettings((s) => s.setColorScheme);
  const isPremium = useEntitlement((s) => s.isPremium);
  const setPremium = useEntitlement((s) => s.setPremium);

  const [name, setName] = useState(profile?.display_name ?? 'Me');
  const [petName, setPetName] = useState(pet?.name ?? 'My Pet');

  if (!profile) return null;

  const inputStyle = {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: font.size.md,
    flex: 1,
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading>Profile</Heading>
        <CoinPill amount={profile.coins} />
      </View>

      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Body style={{ fontWeight: '600' }}>Level {profile.level}</Body>
          <Muted>
            {profile.current_xp}/{profile.needed_xp} XP
          </Muted>
        </View>
        <ProgressBar value={profile.current_xp} max={profile.needed_xp} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Body style={{ fontWeight: '600' }}>Your name</Body>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TextInput value={name} onChangeText={setName} style={inputStyle} placeholderTextColor={colors.textMuted} />
          <Button
            label="Save"
            onPress={() => {
              repo.setDisplayName(name);
              refresh();
            }}
            style={{ paddingHorizontal: spacing.lg }}
          />
        </View>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Body style={{ fontWeight: '600' }}>Companion name</Body>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TextInput value={petName} onChangeText={setPetName} style={inputStyle} placeholderTextColor={colors.textMuted} />
          <Button label="Save" variant="accent" onPress={() => renameCompanion(petName)} style={{ paddingHorizontal: spacing.lg }} />
        </View>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Body style={{ fontWeight: '600' }}>Appearance</Body>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {SCHEMES.map((s) => {
            const active = colorScheme === s;
            return (
              <Pressable
                key={s}
                onPress={() => setColorScheme(s)}
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  backgroundColor: active ? colors.primary : colors.cardAlt,
                }}
              >
                <Body style={{ color: active ? colors.onPrimary : colors.textMuted, fontWeight: '600', textTransform: 'capitalize' }}>
                  {s}
                </Body>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600' }}>Premium (dev toggle)</Body>
          <Muted>Real IAP entitlement wires in later (Phase-2). Toggle to preview premium gating.</Muted>
        </View>
        <Switch value={isPremium} onValueChange={setPremium} />
      </Card>

      <Muted style={{ textAlign: 'center' }}>
        100% local-first · no account · your data stays on this device
      </Muted>
    </Screen>
  );
}
