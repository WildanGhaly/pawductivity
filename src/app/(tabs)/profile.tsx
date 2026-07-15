import React, { useEffect, useState } from 'react';
import { Image, Pressable, Switch, TextInput, View } from 'react-native';
import * as repo from '@/db/repo';
import { selectActivePet, useEntitlement, useGame } from '@/state/stores';
import { Body, Button, Card, CoinPill, Heading, Muted, ProgressBar, Screen } from '@/components/ui';
import { profileAvatar, PROFILE_AVATAR_COUNT } from '@/lib/assets';
import { font, radius, spacing, useTheme } from '@/theme';

export default function Profile() {
  const { colors } = useTheme();
  const profile = useGame((s) => s.profile);
  const pet = useGame(selectActivePet);
  const refresh = useGame((s) => s.refresh);
  const renameCompanion = useGame((s) => s.renameCompanion);
  const isPremium = useEntitlement((s) => s.isPremium);
  const setPremium = useEntitlement((s) => s.setPremium);

  const [name, setName] = useState(profile?.display_name ?? 'Me');
  const [petName, setPetName] = useState(pet?.name ?? 'My Pet');

  useEffect(() => {
    setPetName(pet?.name ?? 'My Pet');
  }, [pet?.id, pet?.name]);
  useEffect(() => {
    setName(profile?.display_name ?? 'Me');
  }, [profile?.display_name]);

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

      {/* Header: avatar + name + user type + level/XP (legacy ProfileHeader) */}
      <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Image
          source={profileAvatar(profile.profile_index)}
          style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.cardAlt }}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Heading style={{ fontSize: 20 }}>{profile.display_name}</Heading>
          <Muted style={{ letterSpacing: 0.5, color: colors.accent, fontFamily: font.family.bold }}>
            {(isPremium ? 'Premium' : 'Basic').toUpperCase()} USER
          </Muted>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Muted>Level {profile.level}</Muted>
            <Muted>
              {profile.current_xp}/{profile.needed_xp} XP
            </Muted>
          </View>
          <ProgressBar value={profile.current_xp} max={profile.needed_xp} />
        </View>
      </Card>

      {/* Avatar picker */}
      <Card style={{ gap: spacing.sm }}>
        <Body style={{ fontWeight: '700' }}>Choose your avatar</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {Array.from({ length: PROFILE_AVATAR_COUNT }).map((_, i) => {
            const active = i === profile.profile_index;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  repo.setProfileIndex(i);
                  refresh();
                }}
              >
                <Image
                  source={profileAvatar(i)}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: colors.cardAlt,
                    borderWidth: active ? 3 : 0,
                    borderColor: colors.primary,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Body style={{ fontWeight: '700' }}>Your name</Body>
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
        <Body style={{ fontWeight: '700' }}>Companion name</Body>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TextInput value={petName} onChangeText={setPetName} style={inputStyle} placeholderTextColor={colors.textMuted} />
          <Button label="Save" variant="accent" onPress={() => renameCompanion(petName)} style={{ paddingHorizontal: spacing.lg }} />
        </View>
      </Card>

      <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '700' }}>Premium (dev toggle)</Body>
          <Muted>Real IAP entitlement wires in later (Phase-2). Toggle to preview premium gating.</Muted>
        </View>
        <Switch value={isPremium} onValueChange={setPremium} />
      </Card>

      <Muted style={{ textAlign: 'center' }}>100% local-first · no account · your data stays on this device</Muted>
    </Screen>
  );
}
