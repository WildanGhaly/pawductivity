import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { Txt, Card, Btn } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { useStore } from '../store/store';

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

type SyncKind = 'off' | 'busy' | 'wait' | 'err' | 'ok';
interface SyncStatus { k: SyncKind; t: string; s: string; ico: IconName; }

// Status card colors keyed by kind, mirroring the prototype .synccard variants.
const KIND: Record<SyncKind, { icoBg: string; icoColor: string; dot: string }> = {
  ok: { icoBg: '#E4EFF3', icoColor: colors.good, dot: colors.good },
  wait: { icoBg: '#FDF0E3', icoColor: colors.orange, dot: colors.orange },
  err: { icoBg: '#FDF0E3', icoColor: colors.orange, dot: colors.orange },
  busy: { icoBg: '#E4EFF3', icoColor: colors.teal, dot: colors.teal },
  off: { icoBg: colors.cream, icoColor: colors.teal, dot: colors.line2 },
};

export function SyncScreen() {
  const s = useStore((st) => st.state)!;
  const runSync = useStore((st) => st.runSync);
  const showToast = useStore((st) => st.showToast);

  const c = s.cloud;
  // Sign-in and the two sync preferences are optimistic local state: there is no
  // network and no dedicated store action for them, so the UI stays instant here.
  const [signedIn, setSignedIn] = useState<boolean>(c.signedIn);
  const [auto, setAuto] = useState<boolean>(c.auto);
  const [wifiOnly, setWifiOnly] = useState<boolean>(c.wifiOnly);

  const syncing = c.status === 'syncing';

  const status: SyncStatus = (() => {
    if (!signedIn) return { k: 'off', t: 'Not backed up', s: 'Sign in to keep your progress safe', ico: 'offline' };
    if (syncing) return { k: 'busy', t: 'Syncing', s: 'Uploading your latest progress', ico: 'repeat' };
    if (c.status === 'offline') return { k: 'wait', t: 'Waiting for connection', s: `${c.pending} change${c.pending === 1 ? '' : 's'} saved on this device`, ico: 'offline' };
    if (c.status === 'error') return { k: 'err', t: 'Sync failed', s: c.lastError || 'We will retry automatically', ico: 'shield' };
    if (c.pending > 0) return { k: 'wait', t: 'Changes not backed up yet', s: `${c.pending} change${c.pending === 1 ? '' : 's'} waiting`, ico: 'clock' };
    return { k: 'ok', t: 'Backed up', s: 'Last synced ' + relTime(c.lastSync), ico: 'checkCircle' };
  })();

  const kind = KIND[status.k];

  const signIn = () => {
    setSignedIn(true);
    showToast('Signed in. Backing up.');
    runSync();
  };
  const signOut = () => {
    setSignedIn(false);
    showToast('Signed out. Your data stays on this device.');
  };

  const toggleAuto = () => {
    const next = !auto;
    setAuto(next);
    if (next && c.pending > 0) runSync();
  };
  const toggleWifi = () => setWifiOnly((v) => !v);

  return (
    <OverlayScreen title="Backup and sync">
      {/* Status card */}
      <View style={styles.synccard}>
        <View style={[styles.syncico, { backgroundColor: kind.icoBg }]}>
          <Icon name={status.ico} size={22} color={kind.icoColor} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt weight={800} size={15} color={colors.tealInk}>{status.t}</Txt>
          <Txt weight={600} size={12} color={colors.muted} style={{ marginTop: 2, lineHeight: 17 }}>{status.s}</Txt>
        </View>
        <View style={[styles.syncdot, { backgroundColor: kind.dot }]} />
      </View>

      {/* Account */}
      {signedIn ? (
        <Card style={styles.acctCard}>
          <View style={styles.acctIco}>
            <Icon name="shield" size={20} color={colors.teal} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt weight={800} size={14} color={colors.tealInk}>{c.email || 'you@gmail.com'}</Txt>
            <Txt weight={600} size={11.5} color={colors.muted} style={{ marginTop: 2 }}>This device: {c.device}</Txt>
          </View>
          <Btn title="Sign out" variant="ghost" sm onPress={signOut} />
        </Card>
      ) : (
        <Card style={{ padding: 18 }}>
          <Txt weight={800} size={15} color={colors.tealInk}>Keep your progress safe</Txt>
          <Txt weight={600} size={12.5} color={colors.muted} style={{ marginTop: 4, lineHeight: 19 }}>
            Pawductivity works fully offline without an account. Sign in only if you want a backup or a second device.
          </Txt>
          <Btn
            title="Sign in with Google"
            block
            onPress={signIn}
            style={{ marginTop: 14 }}
            left={<Icon name="shield" size={16} color={colors.white} strokeWidth={2} />}
          />
        </Card>
      )}

      {/* How it syncs (only once signed in) */}
      {signedIn && (
        <>
          <View style={styles.shead}>
            <Txt weight={700} size={16} color={colors.tealInk}>How it syncs</Txt>
          </View>
          <View style={styles.group}>
            <ToggleRow
              icon="repeat"
              title="Auto sync"
              sub="In the background, never while you wait"
              on={auto}
              onToggle={toggleAuto}
              first
            />
            <ToggleRow
              icon="offline"
              title="Only on Wi-Fi"
              sub="Manual sync still works anywhere"
              on={wifiOnly}
              onToggle={toggleWifi}
              last
            />
          </View>

          <Btn
            title={syncing ? 'Syncing...' : 'Back up now'}
            block
            disabled={syncing}
            onPress={runSync}
            style={{ marginTop: 14 }}
            left={<Icon name={syncing ? 'repeat' : 'bolt'} size={16} color={colors.white} strokeWidth={2} />}
          />

          <Txt weight={500} size={11.5} color={colors.muted} style={styles.note}>
            Your quests, reminders, pet and stats are backed up. Premium is tied to your Google Play purchase, not to this backup.
          </Txt>
        </>
      )}

      <Txt weight={500} size={11.5} color={colors.muted} style={styles.note}>
        Sync is offline-first: everything works without a connection, and the backend here is a local placeholder, so nothing leaves your device.
      </Txt>
    </OverlayScreen>
  );
}

function ToggleRow({
  icon, title, sub, on, onToggle, first, last,
}: {
  icon: IconName;
  title: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.setrow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.sic}>
        <Icon name={icon} size={18} color={colors.teal} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt weight={600} size={14.5} color={colors.tealInk}>{title}</Txt>
        <Txt weight={500} size={11.5} color={colors.muted} style={{ marginTop: 1 }}>{sub}</Txt>
      </View>
      <Pressable onPress={onToggle} style={[styles.toggle, on && { backgroundColor: colors.good }]}>
        <View style={[styles.knob, on && { left: 22 }]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  synccard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    ...shadow.sm,
  },
  syncico: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncdot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  acctCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  acctIco: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
    marginHorizontal: 2,
  },
  group: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.sm,
  },
  setrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sic: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  toggle: {
    width: 46,
    height: 27,
    borderRadius: 999,
    backgroundColor: colors.line2,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 21,
    height: 21,
    borderRadius: 999,
    backgroundColor: '#fff',
    ...shadow.sm,
  },
  note: {
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    lineHeight: 17,
  },
});
