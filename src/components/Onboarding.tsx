import React, { useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as repo from '@/db/repo';
import { useGame, useSettings } from '@/state/stores';
import { ensureNotificationPermission } from '@/lib/notifications';
import { petImage } from '@/lib/assets';
import { Body, Button, Heading, Muted } from '@/components/ui';
import type { Animal } from '@/db/types';
import { font, radius, spacing, useTheme } from '@/theme';

const LOGO = require('../../assets/images/logo-paw.png');

/** First-run flow: welcome → pick a free starter companion → name it + you. */
export function Onboarding() {
  const { colors } = useTheme();
  const completeSetup = useGame((s) => s.completeSetup);
  const completeOnboarding = useSettings((s) => s.completeOnboarding);

  const [animals] = useState<Animal[]>(() => repo.listAnimals());
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number>(() => {
    const list = repo.listAnimals();
    return list.find((a) => a.species === 'cat')?.id ?? list[0]?.id ?? 1;
  });
  const [petName, setPetName] = useState('');
  const [userName, setUserName] = useState('');
  const chosen = animals.find((a) => a.id === selected);

  const inputStyle = {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: font.size.md,
  };

  function finish() {
    completeSetup(selected, petName.trim() || (chosen?.name ?? 'My Pet'), userName.trim() || 'Me');
    void ensureNotificationPermission();
    completeOnboarding();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
        {/* progress dots */}
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 999, backgroundColor: i === step ? colors.primary : colors.cardAlt }}
            />
          ))}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          {step === 0 ? (
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <Image source={LOGO} style={{ width: 120, height: 120 }} resizeMode="contain" />
              <Heading style={{ fontSize: font.size.display, textAlign: 'center' }}>Pawductivity</Heading>
              <Muted style={{ textAlign: 'center', fontSize: font.size.md }}>
                Turn your tasks into quests and raise a companion that grows as you get things done.
              </Muted>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={{ gap: spacing.lg }}>
              <Heading style={{ textAlign: 'center' }}>Choose your companion</Heading>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {animals.map((a) => {
                  const active = selected === a.id;
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => setSelected(a.id)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: spacing.lg,
                        borderRadius: radius.lg,
                        borderWidth: 2,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.cardAlt : colors.card,
                      }}
                    >
                      <Image source={petImage(a.species)} style={{ width: 64, height: 64 }} resizeMode="contain" />
                      <Body style={{ fontWeight: '600' }}>{a.name}</Body>
                      <Muted>Free</Muted>
                    </Pressable>
                  );
                })}
              </View>
              <Muted style={{ textAlign: 'center' }}>You can adopt more companions later in the Shop.</Muted>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={{ gap: spacing.lg }}>
              <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <Image source={petImage(chosen?.species ?? 'cat')} style={{ width: 96, height: 96 }} resizeMode="contain" />
                <Heading style={{ textAlign: 'center' }}>Almost there!</Heading>
              </View>
              <View style={{ gap: spacing.sm }}>
                <Muted>Name your companion</Muted>
                <TextInput
                  value={petName}
                  onChangeText={setPetName}
                  placeholder={chosen?.name ?? 'My Pet'}
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle}
                />
                <Muted style={{ marginTop: spacing.sm }}>Your name</Muted>
                <TextInput
                  value={userName}
                  onChangeText={setUserName}
                  placeholder="Me"
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle}
                />
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ gap: spacing.sm }}>
          {step === 0 ? <Button label="Get started" onPress={() => setStep(1)} /> : null}
          {step === 1 ? <Button label={`Choose ${chosen?.name ?? 'companion'}`} onPress={() => setStep(2)} /> : null}
          {step === 2 ? <Button label="Start focusing 🐾" onPress={finish} /> : null}
          {step > 0 ? <Button label="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
