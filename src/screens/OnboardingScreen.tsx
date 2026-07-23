import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, TextInput, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, font } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { PetView } from '../components/PetView';
import { img } from '../assets/registry';
import { useStore } from '../store/store';
import { Species } from '../domain/types';

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const finishOnboarding = useStore((s) => s.finishOnboarding);
  const start = () => {
    finishOnboarding(speciesKey, petName);
    onComplete();
  };
  const [step, setStep] = useState(0);
  const [speciesId, setSpeciesId] = useState<1 | 2>(2);
  const [petName, setPetName] = useState('');

  const speciesKey: Species = speciesId === 1 ? 'dog' : 'cat';
  const speciesName = speciesId === 1 ? 'Dog' : 'Cat';

  return (
    <View style={[styles.ob, { paddingTop: insets.top + 26, paddingBottom: insets.bottom + 22 }]}>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
        ))}
      </View>

      {step === 0 && (
        <>
          <View style={styles.hero}>
            <View style={{ alignItems: 'center' }}>
              <Image source={img.logo} style={{ width: 110, height: 110, marginBottom: 16 }} resizeMode="contain" />
              <Txt weight={800} size={24} color={colors.tealInk} style={{ textAlign: 'center', lineHeight: 30 }}>
                Focus a little,{'\n'}raise a lot
              </Txt>
              <Txt size={14.5} color={colors.muted} style={{ textAlign: 'center', lineHeight: 22, marginTop: 10 }}>
                Short focus sessions earn coins. Coins build a home for a companion that grows as you do.
              </Txt>
            </View>
          </View>
          <Btn title="Get started" block onPress={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <View style={styles.mid}>
            <Txt weight={800} size={24} color={colors.tealInk} style={{ marginBottom: 8 }}>
              Pick your starter
            </Txt>
            <Txt size={14.5} color={colors.muted} style={{ marginBottom: 18, lineHeight: 22 }}>
              Choose a free companion. You can adopt more later in the shop.
            </Txt>
            <View style={styles.picklist}>
              <PetPick label="Dog" meta="Loyal & easygoing" thumb={img.dogThumb} sel={speciesId === 1} onPress={() => setSpeciesId(1)} />
              <PetPick label="Cat" meta="Curious & cozy" thumb={img.catThumb} sel={speciesId === 2} onPress={() => setSpeciesId(2)} />
            </View>
          </View>
          <Btn title="Continue" block onPress={() => setStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <View style={styles.mid}>
            <Txt weight={800} size={24} color={colors.tealInk} style={{ marginBottom: 8 }}>
              Name your {speciesName}
            </Txt>
            <Txt size={14.5} color={colors.muted} style={{ marginBottom: 18, lineHeight: 22 }}>
              This is who you will be looking after.
            </Txt>
            <ImageBackground source={img.room1} style={styles.obroom} imageStyle={{ borderRadius: radius.lg }}>
              <View style={styles.petShadow} />
              <View style={styles.petStage}>
                <PetView species={speciesKey} clothesId={0} size={180} />
              </View>
            </ImageBackground>
            <TextInput
              style={styles.field}
              placeholder="e.g. Pixel"
              placeholderTextColor="#BDB8AB"
              value={petName}
              onChangeText={setPetName}
              maxLength={16}
            />
          </View>
          <Btn title="Start" block onPress={start} />
        </>
      )}
    </View>
  );
}

function PetPick({
  label, meta, thumb, sel, onPress,
}: { label: string; meta: string; thumb: any; sel: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.petpick, sel && styles.petpickSel]}>
      <Image source={thumb} style={styles.petpickImg} resizeMode="contain" />
      <View>
        <Txt weight={800} size={16} color={colors.tealInk}>{label}</Txt>
        <Txt weight={600} size={12.5} color={colors.muted}>{meta}</Txt>
      </View>
      <View style={styles.freeChip}>
        <Txt weight={600} size={12} color={colors.good}>Free</Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ob: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: 22 },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 9, backgroundColor: colors.line2 },
  dotOn: { width: 22, backgroundColor: colors.orange },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, justifyContent: 'center' },
  picklist: { gap: 12 },
  petpick: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg,
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line,
  },
  petpickSel: { borderColor: colors.orange, backgroundColor: '#FFF7EF' },
  petpickImg: { width: 66, height: 66 },
  freeChip: {
    marginLeft: 'auto', paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill,
    backgroundColor: '#E4EFF3', borderWidth: 1, borderColor: '#CFE2E8',
  },
  field: {
    width: '100%', backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 15, paddingHorizontal: 16, fontFamily: font.bold, fontSize: 16, color: colors.ink, marginTop: 4,
  },
  obroom: { height: 250, borderRadius: radius.lg, marginVertical: 4, marginBottom: 20, overflow: 'hidden', justifyContent: 'flex-end' },
  petStage: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, alignItems: 'center', justifyContent: 'flex-end', zIndex: 2 },
  petShadow: { position: 'absolute', bottom: 20, alignSelf: 'center', width: 120, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,.14)', zIndex: 1 },
});
