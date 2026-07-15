import React, { useEffect, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { useGame, useReminders } from '@/state/stores';
import { showAlert } from '@/lib/alert';
import { Body, Card, Heading, Muted, Screen } from '@/components/ui';
import { CheckIcon } from '@/components/icons';
import { font, radius, spacing, useTheme } from '@/theme';

function atTime(daysAhead: number, hour: number, minute = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

const PRESETS: { label: string; at: () => number }[] = [
  { label: 'In 1 hour', at: () => Date.now() + 3_600_000 },
  { label: 'Tonight 8pm', at: () => atTime(0, 20) },
  { label: 'Tomorrow 9am', at: () => atTime(1, 9) },
  { label: 'Tomorrow 6pm', at: () => atTime(1, 18) },
];

function relTime(ms: number): string {
  const min = Math.max(0, Math.round((ms - Date.now()) / 60000));
  if (min < 60) return `in ${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `in ${h}h`;
  return `in ${Math.round(h / 24)}d`;
}

export default function Reminders() {
  const { colors } = useTheme();
  const items = useReminders((s) => s.items);
  const load = useReminders((s) => s.load);
  const add = useReminders((s) => s.add);
  const complete = useReminders((s) => s.complete);
  const remove = useReminders((s) => s.remove);
  const [title, setTitle] = useState('');
  const ready = useGame((s) => s.ready);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  if (!ready) {
    return (
      <Screen scroll={false}>
        <Muted>Loading…</Muted>
      </Screen>
    );
  }

  async function onPreset(at: number) {
    const text = title.trim();
    if (!text) {
      showAlert('Add a reminder', 'Type what to remember first.');
      return;
    }
    // Clear synchronously BEFORE the async add(): a rapid second tap then hits the empty-title
    // guard instead of inserting a duplicate reminder + duplicate OS notification.
    setTitle('');
    const res = await add(text, at);
    // Only warn on native, where reminders actually deliver. On web ensureNotificationPermission()
    // is always false, so this would fire a blocking, non-actionable alert on every add.
    if (!res.permission && Platform.OS !== 'web') {
      showAlert(
        'Reminder saved',
        'Notifications are off, so this won’t alert you. Enable notifications for Pawductivity in your system settings to get reminders.',
      );
    }
  }

  return (
    <Screen>
      <Heading>Reminders</Heading>

      <Card style={{ gap: spacing.sm }}>
        <Body style={{ fontWeight: '600' }}>New reminder</Body>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Take medicine"
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.cardAlt,
            borderRadius: radius.md,
            padding: spacing.md,
            color: colors.text,
            fontSize: font.size.md,
          }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <Pressable
              key={p.label}
              onPress={() => onPreset(p.at())}
              style={{
                backgroundColor: colors.primary,
                borderRadius: radius.pill,
                paddingVertical: 8,
                paddingHorizontal: spacing.md,
              }}
            >
              <Body style={{ color: colors.onPrimary, fontWeight: '600', fontSize: font.size.sm }}>{p.label}</Body>
            </Pressable>
          ))}
        </View>
      </Card>

      {items.length === 0 ? (
        <Card>
          <Muted>No upcoming reminders. Alerts fire as local notifications on your device (Android/iOS).</Muted>
        </Card>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Muted>{items.length} upcoming</Muted>
          {items.map((r) => {
            const d = new Date(r.remind_at);
            return (
              <Card key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Body style={{ fontWeight: '600' }}>🔔 {r.title}</Body>
                  <Muted>
                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                    {d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · {relTime(r.remind_at)}
                  </Muted>
                </View>
                <Pressable
                  onPress={() => complete(r.id)}
                  style={{ backgroundColor: colors.success, width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }}
                >
                  <CheckIcon size={16} />
                </Pressable>
                <Pressable
                  onPress={() => remove(r.id)}
                  style={{ backgroundColor: colors.cardAlt, width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Body style={{ color: colors.danger, fontWeight: '700' }}>✕</Body>
                </Pressable>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
