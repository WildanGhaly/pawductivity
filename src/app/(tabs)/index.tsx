import React from 'react';
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { selectActivePet, useGame } from '@/state/stores';
import { CompanionView } from '@/components/CompanionView';
import { PlayIcon } from '@/components/icons';
import { Heading, Muted } from '@/components/ui';
import { PET_HOME_BG, uiIcon } from '@/lib/assets';
import { formatDuration } from '@/lib/date';
import type { Task } from '@/db/types';
import { font, radius, spacing, useTheme } from '@/theme';

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.18,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;

const nameShadow = { textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 } as const;

/** assets/pet/pet_home.png is 430×932: the wall/floor line sits ~61% down, and a dark
 *  picture frame fills the left ~14% (pushed off-screen so it can't clash with the coins). */
const ROOM_ASPECT = 932 / 430;
const ROOM_FLOOR_LINE = 0.61;

/** White rounded pill with the coin art overlapping on the left (legacy PetNavbar). */
function CoinBadge({ amount }: { amount: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image source={uiIcon('coin')} style={{ width: 34, height: 34, marginRight: -14, zIndex: 2 }} resizeMode="contain" />
      <View style={{ backgroundColor: '#fff', borderRadius: radius.pill, paddingVertical: 5, paddingLeft: 20, paddingRight: 14, ...shadow }}>
        <Text style={{ color: '#1E4B5F', fontSize: font.size.lg, fontFamily: font.family.bold }}>{amount}</Text>
      </View>
    </View>
  );
}

/** The legacy health bar: white pill with a yellow fill and an orange lightning badge. */
function HealthBar({ health }: { health: number }) {
  const width = 170;
  const fill = Math.max(0, Math.min(1, health / 100)) * width;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: -12, zIndex: 2, ...shadow }}>
        <Svg width={17} height={17} viewBox="0 0 24 24">
          <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#E28A4B" />
        </Svg>
      </View>
      <View style={{ width, height: 22, borderRadius: 11, backgroundColor: '#fff', overflow: 'hidden', justifyContent: 'center', ...shadow }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fill, backgroundColor: '#FFDA7C', borderRadius: 11 }} />
      </View>
    </View>
  );
}

/** The pet's room, cropped so the wall/floor line lands under the pet's feet and the
 *  picture-frame corner sits off the left edge. */
function Room({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  const imgW = w * 1.28;
  const imgH = imgW * ROOM_ASPECT;
  return (
    <View style={{ height: h, overflow: 'hidden' }}>
      <Image
        source={PET_HOME_BG}
        resizeMode="stretch"
        style={{ position: 'absolute', left: -w * 0.19, top: h * 0.66 - ROOM_FLOOR_LINE * imgH, width: imgW, height: imgH }}
      />
      {children}
    </View>
  );
}

function StatCell({ value, label, tint }: { value: string; label: string; tint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text numberOfLines={1} style={{ color: tint ?? colors.text, fontSize: font.size.xl, fontFamily: font.family.bold }}>
        {value}
      </Text>
      <Muted style={{ fontSize: font.size.xs }}>{label}</Muted>
    </View>
  );
}

/** A quest you can start focusing on in one tap — the whole point of opening the app. */
function QuestCard({ task }: { task: Task }) {
  const { colors } = useTheme();
  const router = useRouter();
  const left = Math.max(0, task.estimated_time - task.time_completed);
  return (
    <Pressable onPress={() => router.push(`/focus/${task.id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.cardAlt,
          borderRadius: radius.lg,
          padding: spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={1} style={{ color: colors.text, fontSize: font.size.md, fontFamily: font.family.bold }}>
            {task.name}
          </Text>
          <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: font.size.sm, fontFamily: font.family.regular }}>
            {task.tag}
            {left > 0 ? ` · ${formatDuration(left)} left` : ''}
          </Text>
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <PlayIcon size={18} />
        </View>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const ready = useGame((s) => s.ready);
  const profile = useGame((s) => s.profile);
  const pet = useGame(selectActivePet);
  const equippedClothes = useGame((s) => s.equippedClothes);
  const openTasks = useGame((s) => s.openTasks);
  const focusToday = useGame((s) => s.focusToday);
  const doneToday = useGame((s) => s.doneToday);
  const streak = useGame((s) => s.streak);

  // The room is a header, not the whole screen — the rest of the app's real estate belongs
  // to the work. The pet Lottie is mostly transparent padding: measured, the visible pet is
  // ~62% of its box, sitting ~20.6% down from the box top. The box is bottom-anchored, so
  // solve that padding for the largest pet whose head still clears the name/health strip.
  const roomH = Math.round(height * 0.52);
  const topBlock = insets.top + 120; // coin row + name + health bar
  const petSize = Math.max(160, (roomH - topBlock) / 0.79);

  if (!ready || !profile) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const health = pet?.health ?? 0;
  const next = openTasks.slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Room w={width} h={roomH}>
        {/* Legacy PetNavbar: coins left, shop right */}
        <View
          style={{
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <CoinBadge amount={profile.coins} />
          <Pressable onPress={() => router.navigate('/shop')} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Image source={uiIcon('shop')} style={{ width: 44, height: 44 }} resizeMode="contain" />
          </Pressable>
        </View>

        {pet ? (
          <>
            <View style={{ alignItems: 'center', marginTop: spacing.sm, gap: 6 }}>
              <Text style={{ color: '#fff', fontSize: font.size.lg, fontFamily: font.family.bold, ...nameShadow }}>{pet.name}</Text>
              <HealthBar health={health} />
            </View>
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }} pointerEvents="none">
              <CompanionView species={pet.species} clothesId={equippedClothes[0]?.id} health={health} size={petSize} />
            </View>
          </>
        ) : null}
      </Room>

      {/* The work: what you actually opened a time-management app for. */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.card,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          marginTop: -28,
          shadowColor: '#0B2530',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        }}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl * 2, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.md }}>
            <Heading style={{ fontSize: font.size.lg }}>Today</Heading>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardAlt, borderRadius: radius.lg, paddingVertical: spacing.md }}>
              <StatCell value={focusToday > 0 ? formatDuration(focusToday) : '0m'} label="focused" tint={colors.primary} />
              <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
              <StatCell value={String(doneToday)} label="done" />
              <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
              <StatCell value={String(streak)} label={streak === 1 ? 'day streak' : 'day streak'} tint={colors.accent} />
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Heading style={{ fontSize: font.size.lg }}>Next up</Heading>
              {openTasks.length > next.length ? (
                <Pressable onPress={() => router.navigate('/quests')} hitSlop={8}>
                  <Text style={{ color: colors.primary, fontFamily: font.family.bold, fontSize: font.size.sm }}>See all {openTasks.length}</Text>
                </Pressable>
              ) : null}
            </View>

            {next.length === 0 ? (
              <Pressable onPress={() => router.navigate('/quests')}>
                <View
                  style={{
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: colors.border,
                    padding: spacing.xl,
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: font.size.md, fontFamily: font.family.bold }}>Nothing queued</Text>
                  <Muted>Brain dump your first quest →</Muted>
                </View>
              </Pressable>
            ) : (
              next.map((t) => <QuestCard key={t.id} task={t} />)
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
