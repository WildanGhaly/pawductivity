import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { parseBrainDump, summarizeParse } from '@/lib/braindump';
import { useGame } from '@/state/stores';
import { font, radius, spacing, useTheme } from '@/theme';
import { Button, Muted } from './ui';

/** The Brain Dump capture box — free text in, one structured quest out (rules-based, on-device). */
export function QuickAdd({ onAdded }: { onAdded?: () => void }) {
  const { colors } = useTheme();
  const addQuest = useGame((s) => s.addQuest);
  const [text, setText] = useState('');
  const parsed = text.trim().length > 1 ? parseBrainDump(text) : null;

  function submit() {
    if (!parsed) return;
    addQuest(parsed);
    setText('');
    onAdded?.();
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Brain dump… e.g. “study biology 45 min tomorrow 9am”"
        placeholderTextColor={colors.textMuted}
        multiline
        style={{
          backgroundColor: colors.cardAlt,
          borderRadius: radius.md,
          padding: spacing.md,
          color: colors.text,
          fontSize: font.size.md,
          minHeight: 48,
        }}
        onSubmitEditing={submit}
        returnKeyType="done"
        blurOnSubmit
      />
      {parsed ? <Muted>{`“${parsed.name}”  ·  ${summarizeParse(parsed)}`}</Muted> : null}
      <Button label="Add quest" onPress={submit} disabled={!parsed} />
    </View>
  );
}
