import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { Txt } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { OverlayScreen } from '../components/OverlayScreen';
import { PetView } from '../components/PetView';
import { img } from '../assets/registry';
import { useStore } from '../store/store';
import { JOURNEY, Milestone } from '../domain/catalogs';
import { nextMilestone, homePct } from '../domain/mechanics';

export function JourneyScreen() {
  const s = useStore((st) => st.state)!;
  const buildMilestone = useStore((st) => st.buildMilestone);

  const pet = s.pet;
  const nm = nextMilestone(pet);
  const pct = homePct(pet);
  const done = !nm;

  return (
    <OverlayScreen title={`${pet.name}'s journey`}>
      {/* hero */}
      <View style={styles.jhero}>
        <View style={styles.jheropet}>
          <View style={styles.jheroGlow} />
          <View style={styles.jheropetInner}>
            <PetView species={pet.species} clothesId={pet.clothesId} size={88} />
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt weight={800} size={11} color="#BFE3F3" style={styles.jherolabel}>
            {done ? 'Journey complete' : 'The goal'}
          </Txt>
          <Txt weight={800} size={17} color="#fff" style={styles.jheroh}>
            {done ? `${pet.name} is thriving` : `Give ${pet.name} a real home`}
          </Txt>
          <Txt weight={500} size={12} color="#CDE7F1" style={{ lineHeight: 17 }}>
            Every coin you earn by focusing builds something permanent. This is what you are working toward.
          </Txt>
        </View>
      </View>

      {/* progress */}
      <View style={styles.jprog}>
        <View style={styles.jprogbar}>
          <View style={[styles.jprogfill, { width: `${pct}%` }]} />
        </View>
        <View style={styles.jprogmeta}>
          <Txt weight={700} size={11.5} color={colors.muted}>Home {pct}% built</Txt>
          <Txt weight={700} size={11.5} color={colors.muted}>{pet.home.length} / {JOURNEY.length}</Txt>
        </View>
      </View>

      {/* list */}
      <View style={styles.jlist}>
        {JOURNEY.map((m: Milestone) => {
          const owned = pet.home.includes(m.id);
          const isNext = !!nm && nm.id === m.id;
          const afford = s.profile.coins >= m.cost;
          return (
            <View
              key={m.id}
              style={[
                styles.jrow,
                !owned && !isNext && styles.jrowLocked,
                isNext && styles.jrowNext,
              ]}
            >
              <View style={[styles.jic, owned && styles.jicOwned]}>
                <Icon
                  name={owned ? 'check' : ((m.ic || 'sparkle') as IconName)}
                  size={20}
                  color={owned ? colors.good : '#8580B0'}
                />
              </View>
              <View style={styles.jmain}>
                <View style={styles.jnameRow}>
                  <Txt weight={800} size={14} color={colors.tealInk}>{m.name}</Txt>
                  {m.final && (
                    <View style={styles.jfinal}>
                      <Txt weight={800} size={9.5} color="#7A4B00" style={styles.jfinalTxt}>GOAL</Txt>
                    </View>
                  )}
                </View>
                <Txt weight={600} size={11.5} color={colors.muted} style={{ marginTop: 1 }}>{m.desc}</Txt>
                <View style={styles.jperk}>
                  <Icon name="bolt" size={12} color={colors.orange} />
                  <Txt weight={700} size={11} color={colors.orange2}>{m.perk}</Txt>
                </View>
              </View>

              {owned ? (
                <View style={styles.jdone}>
                  <Icon name="check" size={16} color="#fff" strokeWidth={3} />
                </View>
              ) : isNext ? (
                <Pressable
                  style={[styles.jbuild, !afford && styles.jbuildOff]}
                  onPress={() => buildMilestone(m.id)}
                >
                  <Image source={img.coin} style={styles.coinmini} />
                  <Txt weight={800} size={13} color="#fff">{m.cost}</Txt>
                </Pressable>
              ) : (
                <View style={styles.jlock}>
                  <Image source={img.coin} style={styles.coinmini} />
                  <Txt weight={800} size={13} color={colors.muted}>{m.cost}</Txt>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* note */}
      <View style={styles.growthnote}>
        <Icon name="sparkle" size={13} color={colors.orange} />
        <Txt weight={600} size={11.5} color={colors.muted} style={{ flex: 1, lineHeight: 17 }}>
          Milestones are permanent. They never reset, so {pet.name}'s home is a record of every session you showed up for.
        </Txt>
      </View>
    </OverlayScreen>
  );
}

const styles = StyleSheet.create({
  jhero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.teal,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow.card,
  },
  jheropet: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  jheroGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,251,242,.9)',
  },
  jheropetInner: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center' },
  jherolabel: { letterSpacing: 0.5, textTransform: 'uppercase' },
  jheroh: { marginTop: 2, marginBottom: 5 },
  jprog: { marginTop: 16, marginBottom: 6 },
  jprogbar: { height: 9, borderRadius: 999, backgroundColor: '#EFE7D6', overflow: 'hidden' },
  jprogfill: { height: '100%', borderRadius: 999, backgroundColor: '#B0A9D8' },
  jprogmeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  jlist: { marginTop: 10, gap: 10 },
  jrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    padding: 13,
    ...shadow.sm,
  },
  jrowLocked: { opacity: 0.6 },
  jrowNext: { borderColor: '#8580B0' },
  jic: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#F1EAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jicOwned: { backgroundColor: '#E4EFF3' },
  jmain: { flex: 1, minWidth: 0 },
  jnameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  jfinal: { backgroundColor: colors.yellow, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
  jfinalTxt: { letterSpacing: 0.3 },
  jperk: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, alignSelf: 'flex-start' },
  jdone: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.good,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jbuild: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.teal,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 12,
  },
  jbuildOff: { backgroundColor: '#C7C2B5' },
  jlock: { flexDirection: 'row', alignItems: 'center' },
  coinmini: { width: 16, height: 16, marginRight: 5 },
  growthnote: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
    padding: 11,
    borderRadius: 12,
    backgroundColor: colors.cream,
  },
});
