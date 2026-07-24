import React, { ReactNode, useState } from 'react';
import { View, StyleSheet, Pressable, Image, TextInput, Linking } from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, fontFor } from '../theme/tokens';
import { Txt, Card } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { BottomSheet } from '../components/BottomSheet';
import { img, avatars } from '../assets/registry';
import { useStore } from '../store/store';
import { ACHIEVEMENTS, DISCORD_URL } from '../domain/catalogs';
import { money } from '../domain/mechanics';

// App identity for the footer. Read from the live app config so it always matches
// what actually shipped, rather than the prototype's placeholder package name
// (com.production.pawductivity, which Play Console permanently rejected).
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const APP_ID =
  (Constants.expoConfig?.android?.package as string | undefined) ?? 'com.pawductivity.app';

type SyncKind = 'off' | 'busy' | 'wait' | 'err' | 'ok';

// Human friendly "time ago" for the last sync timestamp. Ported from the prototype relTime().
function relTime(ts: number | null): string {
  if (!ts) return 'never';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 45) return 'just now';
  if (s < 90) return 'a minute ago';
  if (s < 3600) return Math.floor(s / 60) + ' minutes ago';
  if (s < 7200) return 'an hour ago';
  if (s < 86400) return Math.floor(s / 3600) + ' hours ago';
  return Math.floor(s / 86400) + ' days ago';
}

const DOT: Record<SyncKind, string> = {
  off: colors.line2,
  busy: colors.teal,
  wait: colors.orange,
  err: colors.orange,
  ok: colors.good,
};

export function ProfileScreen() {
  const s = useStore((st) => st.state)!;
  const openOverlay = useStore((st) => st.openOverlay);
  const setName = useStore((st) => st.setName);
  const setAvatar = useStore((st) => st.setAvatar);
  const toggleSetting = useStore((st) => st.toggleSetting);
  const resetData = useStore((st) => st.resetData);
  const showToast = useStore((st) => st.showToast);

  const p = s.profile;
  const c = s.cloud;
  const pct = Math.round((p.xp / p.needed) * 100);

  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(p.name);
  const [resetOpen, setResetOpen] = useState(false);

  // Sync status label + dot color, ported from the prototype syncState().
  const sync: { k: SyncKind; t: string } = (() => {
    if (!c.signedIn) return { k: 'off', t: 'Not backed up' };
    if (c.status === 'syncing') return { k: 'busy', t: 'Syncing' };
    if (c.status === 'offline') return { k: 'wait', t: 'Waiting for connection' };
    if (c.status === 'error') return { k: 'err', t: 'Sync failed' };
    if (c.pending > 0) return { k: 'wait', t: 'Changes not backed up yet' };
    return { k: 'ok', t: 'Last synced ' + relTime(c.lastSync) };
  })();

  const openEditName = () => {
    setNameDraft(p.name);
    setNameOpen(true);
  };
  const saveName = () => {
    const v = nameDraft.trim();
    if (v) setName(v);
    setNameOpen(false);
  };

  const doReset = async () => {
    setResetOpen(false);
    await resetData();
  };

  const joinDiscord = () => {
    Linking.openURL(DISCORD_URL).catch(() => showToast('Could not open the link'));
  };

  return (
    <OverlayScreen title="Profile">
      {/* hero */}
      <LinearGradient colors={['#0C4C60', '#12667F']} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.hero}>
        <Image source={avatars[p.avatar] || img.catThumb} style={styles.heroAv} />
        <Txt weight={800} size={20} color="#fff" style={{ marginTop: 14 }}>{p.name}</Txt>
        <View style={[styles.badge, p.premium ? styles.badgePrem : styles.badgeBasic]}>
          {p.premium && <Icon name="crown" size={12} color="#7A4B00" />}
          <Txt weight={800} size={11} color={p.premium ? '#7A4B00' : '#D6EEF7'} style={{ letterSpacing: 0.4 }}>
            {p.premium ? 'PREMIUM' : 'BASIC'}
          </Txt>
        </View>
      </LinearGradient>

      {/* xp card */}
      <View style={styles.xpcard}>
        <View style={styles.xprow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LinearGradient colors={['#E28A4B', '#F4B942']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.lvlbadge}>
              <Txt weight={800} size={16} color="#fff" style={{ lineHeight: 18 }}>{p.level}</Txt>
              <Txt weight={700} size={8} color="#fff" style={{ opacity: 0.9 }}>LVL</Txt>
            </LinearGradient>
            <View>
              <Txt weight={800} color={colors.tealInk}>Level {p.level}</Txt>
              <Txt weight={600} size={12} color={colors.muted}>{p.xp} / {p.needed} XP</Txt>
            </View>
          </View>
          <View style={styles.coinpill}>
            <Image source={img.coin} style={{ width: 20, height: 20 }} />
            <Txt weight={700} color={colors.coinInk}>{money(p.coins)}</Txt>
          </View>
        </View>
        <View style={styles.xpbar}>
          <LinearGradient colors={['#0C4C60', '#12667F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.xpfill, { width: `${pct}%` }]} />
        </View>
      </View>

      {/* go premium */}
      {!p.premium && (
        <Pressable onPress={() => openOverlay('premium')} style={{ marginTop: 18 }}>
          <LinearGradient colors={['#0C4C60', '#12667F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premcard}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Icon name="crown" size={16} color="#fff" />
                <Txt weight={800} size={16} color="#fff">Go Premium</Txt>
              </View>
              <Txt size={12.5} color="#BFE3F3" style={{ marginTop: 3 }}>Rabbit, exclusive outfits and deep stats</Txt>
            </View>
            <View style={styles.unlock}><Txt weight={700} size={13} color="#7A4B00">Unlock</Txt></View>
          </LinearGradient>
        </Pressable>
      )}

      {/* profile picture */}
      <View style={styles.shead}><Txt weight={700} size={16} color={colors.tealInk}>Profile picture</Txt></View>
      <View style={styles.avpicker}>
        {avatars.map((a, i) => (
          <Pressable key={i} style={styles.avwrap} onPress={() => setAvatar(i)}>
            <Image source={a} style={[styles.av, p.avatar === i && styles.avSel]} />
          </Pressable>
        ))}
      </View>

      {/* progress */}
      <View style={styles.shead}><Txt weight={700} size={16} color={colors.tealInk}>Progress</Txt></View>
      <Group>
        <SetRow icon="trophy" title="Achievements" desc={`${s.achievements.length} of ${ACHIEVEMENTS.length} earned`} onPress={() => openOverlay('achievements')} />
        <SetRow icon="sparkle" title="Weekly recap" desc="A card you can share" onPress={() => openOverlay('recap')} last />
      </Group>

      {/* personalize */}
      <View style={styles.shead}><Txt weight={700} size={16} color={colors.tealInk}>Personalize</Txt></View>
      <Group>
        <SetRow icon="shirt" title="Appearance" desc="Accent color and pet room" onPress={() => openOverlay('appearance')} />
        <SetRow
          icon="target"
          title="Focus dashboard"
          desc="Charts, category mix, best hours"
          onPress={() => openOverlay('insights')}
          right={p.premium ? undefined : <LockChip />}
          last
        />
      </Group>

      {/* settings */}
      <View style={styles.shead}><Txt weight={700} size={16} color={colors.tealInk}>Settings</Txt></View>
      <Group>
        <SetRow icon="edit" title="Edit name" desc={p.name} onPress={openEditName} />
        <SetRow icon="bell" title="Notifications" desc="Quest and reminder alerts" right={<Toggle on={s.settings.notif} onPress={() => toggleSetting('notif')} />} />
        <SetRow icon="sound" title="Sound and haptics" right={<Toggle on={s.settings.sound} onPress={() => toggleSetting('sound')} />} />
        <SetRow icon="gift" title="Invite friends" desc="Give 100, get 100 coins" onPress={() => openOverlay('referral')} last />
      </Group>

      {/* your data */}
      <View style={styles.shead}><Txt weight={700} size={16} color={colors.tealInk}>Your data</Txt></View>
      <Group>
        <SetRow
          icon="shield"
          title="Backup and sync"
          desc={sync.t + (c.signedIn && c.email ? ' · ' + c.email : '')}
          onPress={() => openOverlay('sync')}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.syncdot, { backgroundColor: DOT[sync.k] }]} />
              <Icon name="chevR" size={16} color={colors.line2} />
            </View>
          }
        />
        <SetRow icon="offline" title="Works offline" desc="Full app with no connection needed" onPress={() => showToast('Everything works without an account')} noChev />
        <SetRow icon="trash" title="Reset all data" titleColor={colors.danger} desc="Start fresh from onboarding" danger onPress={() => setResetOpen(true)} last />
      </Group>

      {/* community */}
      <View style={styles.shead}><Txt weight={700} size={16} color={colors.tealInk}>Community</Txt></View>
      <View style={styles.commcard}>
        <View style={styles.commic}><Icon name="chat" size={22} color={colors.teal} /></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt weight={800} size={14.5} color={colors.tealInk}>Tell us what to fix</Txt>
          <Txt weight={600} size={11.5} color={colors.muted} style={{ marginTop: 2, lineHeight: 17 }}>
            Bugs, feature ideas, or just show off {s.pet.name}. We read everything.
          </Txt>
        </View>
        <Pressable style={styles.joinbtn} onPress={joinDiscord}>
          <Txt weight={700} size={13} color="#fff">Join</Txt>
        </Pressable>
      </View>

      <Txt weight={500} size={11.5} color={colors.muted} style={styles.note}>
        Pawductivity v{APP_VERSION} · {APP_ID}{'\n'}Made for people who like getting things done.
      </Txt>

      {/* edit name sheet */}
      <BottomSheet visible={nameOpen} onClose={() => setNameOpen(false)} title="Edit name" subtitle="What should we call you?">
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          maxLength={16}
          autoFocus
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          style={styles.field}
          onSubmitEditing={saveName}
          returnKeyType="done"
        />
        <View style={styles.dactions}>
          <Pressable style={[styles.dbtn, styles.dghost]} onPress={() => setNameOpen(false)}>
            <Txt weight={700} size={15} color={colors.teal}>Cancel</Txt>
          </Pressable>
          <Pressable style={[styles.dbtn, styles.dsolid]} onPress={saveName}>
            <Txt weight={700} size={15} color="#fff">Save</Txt>
          </Pressable>
        </View>
      </BottomSheet>

      {/* reset confirm sheet */}
      <BottomSheet visible={resetOpen} onClose={() => setResetOpen(false)} title="Reset all data" subtitle="This erases your pet, coins, quests and progress, then starts fresh from onboarding. This cannot be undone.">
        <View style={styles.dactions}>
          <Pressable style={[styles.dbtn, styles.dghost]} onPress={() => setResetOpen(false)}>
            <Txt weight={700} size={15} color={colors.teal}>Cancel</Txt>
          </Pressable>
          <Pressable style={[styles.dbtn, styles.ddanger]} onPress={doReset}>
            <Txt weight={700} size={15} color="#fff">Reset</Txt>
          </Pressable>
        </View>
      </BottomSheet>
    </OverlayScreen>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

function SetRow({
  icon, title, desc, onPress, right, last, danger, titleColor, noChev,
}: {
  icon: IconName;
  title: string;
  desc?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
  danger?: boolean;
  titleColor?: string;
  noChev?: boolean;
}) {
  const showChev = right === undefined && !noChev;
  return (
    <Pressable style={[styles.setrow, last && { borderBottomWidth: 0 }]} onPress={onPress} disabled={!onPress}>
      <View style={styles.sic}>
        <Icon name={icon} size={21} color={danger ? colors.danger : colors.teal} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight={600} size={14.5} color={titleColor || colors.tealInk}>{title}</Txt>
        {desc ? <Txt weight={500} size={11.5} color={colors.muted} style={{ marginTop: 1 }} numberOfLines={1}>{desc}</Txt> : null}
      </View>
      {right}
      {showChev && <Icon name="chevR" size={16} color={colors.line2} />}
    </Pressable>
  );
}

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.toggle, on && { backgroundColor: colors.good }]} onPress={onPress}>
      <View style={[styles.knob, on && { left: 22 }]} />
    </Pressable>
  );
}

function LockChip() {
  return (
    <View style={styles.lockchip}>
      <Icon name="crown" size={11} color="#7A4B00" />
      <Txt weight={800} size={10.5} color="#7A4B00" style={{ letterSpacing: 0.3 }}>Premium</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: -16, marginHorizontal: -16, paddingTop: 24, paddingBottom: 38, paddingHorizontal: 20, alignItems: 'center',
  },
  heroAv: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', backgroundColor: '#DDEDE9' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, paddingVertical: 4, paddingHorizontal: 12, borderRadius: radius.pill },
  badgeBasic: { backgroundColor: 'rgba(255,255,255,.16)' },
  badgePrem: { backgroundColor: colors.yellow },

  xpcard: {
    marginTop: -30, backgroundColor: '#fff', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: colors.line, ...shadow.card,
  },
  xprow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  lvlbadge: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  coinpill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white, borderWidth: 1.5,
    borderColor: colors.line2, paddingVertical: 6, paddingLeft: 7, paddingRight: 12, borderRadius: radius.pill, ...shadow.sm,
  },
  xpbar: { height: 12, borderRadius: 9, backgroundColor: '#EFE7D6', overflow: 'hidden' },
  xpfill: { height: '100%', borderRadius: 9 },

  premcard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.lg },
  unlock: { backgroundColor: colors.yellow, paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.sm, ...shadow.sm },

  shead: { marginTop: 18, marginBottom: 10, marginHorizontal: 2 },

  avpicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avwrap: { width: '22%', flexGrow: 1, aspectRatio: 1 },
  av: { width: '100%', height: '100%', borderRadius: 999, borderWidth: 3, borderColor: 'transparent', backgroundColor: '#DDEDE9' },
  avSel: { borderColor: colors.orange },

  group: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, ...shadow.sm },
  setrow: {
    flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 15, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  sic: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },

  toggle: { width: 46, height: 27, borderRadius: 999, backgroundColor: colors.line2, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, left: 3, width: 21, height: 21, borderRadius: 999, backgroundColor: '#fff', ...shadow.sm },

  lockchip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.yellow, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999 },
  syncdot: { width: 10, height: 10, borderRadius: 5 },

  commcard: {
    flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 15, ...shadow.sm,
  },
  commic: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  joinbtn: { backgroundColor: colors.orange, paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.sm, ...shadow.sm },

  note: { textAlign: 'center', marginTop: 20, lineHeight: 17 },

  field: {
    fontFamily: fontFor(600), borderWidth: 1.5, borderColor: colors.line2, borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, color: colors.tealInk, backgroundColor: colors.cream, marginBottom: 4,
  },
  dactions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  dbtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: radius.md },
  dghost: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line2 },
  dsolid: { backgroundColor: colors.orange },
  ddanger: { backgroundColor: colors.danger },
});
