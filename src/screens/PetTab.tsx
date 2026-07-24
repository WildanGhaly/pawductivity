import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Image, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, NAV_H, moodColors } from '../theme/tokens';
import { Txt, Card, CoinPill, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { PetView } from '../components/PetView';
import { BottomSheet } from '../components/BottomSheet';
import { img, avatars, foodImg, clothesImg } from '../assets/registry';
import { useStore } from '../store/store';
import { FOODS, CLOTHES } from '../domain/catalogs';
import {
  moodOf, bonusPct, shieldActive, petStage, stageName, homePct, nextMilestone,
  idleRate, idleCap, idlePending, idleFull, money,
} from '../domain/mechanics';

export function PetTab() {
  const insets = useSafeAreaInsets();
  const s = useStore((st) => st.state)!;
  const collectIdle = useStore((st) => st.collectIdle);
  const buildMilestone = useStore((st) => st.buildMilestone);
  const equip = useStore((st) => st.equip);
  const feed = useStore((st) => st.feed);
  const showToast = useStore((st) => st.showToast);
  const openOverlay = useStore((st) => st.openOverlay);
  const [feedOpen, setFeedOpen] = useState(false);

  const pet = s.pet;
  const mood = moodOf(pet.health);
  const bp = bonusPct(pet.health);
  const shield = shieldActive(pet.health);
  const stg = petStage(pet);
  const nm = nextMilestone(pet);
  const pending = idlePending(pet);
  const canAfford = nm ? s.profile.coins >= nm.cost : false;
  const nextInfo = bp < 25
    ? `Get ${pet.name} to Happy (health 80+) for a +25% reward boost.`
    : `${pet.name} is happy, so you earn +25% on every focus session.`;

  const openFeed = () => {
    if (pet.health >= 100) { showToast(`${pet.name} is already full`); return; }
    setFeedOpen(true);
  };
  const doFeed = (id: number) => { feed(id); setFeedOpen(false); };
  const anyFood = FOODS.some((f) => (pet.food[f.id] || 0) > 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {/* top bar */}
        <View style={[styles.topbar, { paddingTop: Math.max(20, insets.top + 12) }]}>
          <Pressable onPress={() => openOverlay('profile')}>
            <Image source={avatars[s.profile.avatar] || img.catThumb} style={styles.avatarImg} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Txt weight={600} size={12} color={colors.muted}>Your companion</Txt>
            <Txt weight={800} size={20} color={colors.tealInk}>{pet.name}</Txt>
          </View>
          <CoinPill amount={s.profile.coins} />
        </View>

        {/* room */}
        <View style={{ paddingHorizontal: 16 }}>
          <Pressable onPress={pending > 0 ? collectIdle : undefined}>
            <ImageBackground source={img.room1} style={styles.room} imageStyle={{ borderRadius: 22 }}>
              <View style={styles.moodtag}>
                <View style={[styles.mooddot, { backgroundColor: moodColors[mood.k] }]} />
                <Txt weight={700} size={12} color={colors.tealInk}>{mood.t}</Txt>
              </View>
              <View style={styles.petShadow} />
              <View style={styles.petStageBox}>
                <PetView species={pet.species} clothesId={pet.clothesId} size={220} speed={mood.spd} />
              </View>
              {pending > 0 && (
                <View style={styles.pileBadge}>
                  <Image source={img.coin} style={{ width: 15, height: 15 }} />
                  <Txt weight={800} size={11.5} color="#fff">{pending} · tap to collect</Txt>
                </View>
              )}
            </ImageBackground>
          </Pressable>
        </View>

        <View style={styles.pad}>
          {/* home / journey card */}
          <View style={styles.shead}>
            <Txt weight={700} size={16} color={colors.tealInk}>{pet.name}'s home</Txt>
            <Txt weight={700} size={12.5} color={colors.orange} onPress={() => openOverlay('journey')}>Journey</Txt>
          </View>
          <Card style={{ padding: 16 }}>
            <View style={styles.spread}>
              <View style={{ minWidth: 0, flex: 1 }}>
                <Txt weight={800} size={15.5} color={colors.tealInk} numberOfLines={1}>{stageName(stg)} · Stage {stg} of 5</Txt>
                <Txt weight={600} size={12} color={colors.muted} style={{ marginTop: 2 }}>
                  {nm ? `Next: ${nm.name} · ${homePct(pet)}% of the home built` : `Dream home complete · ${pet.name} is thriving`}
                </Txt>
              </View>
              <Icon name="chevR" size={16} color={colors.muted} />
            </View>
            <View style={styles.jprogbar}><View style={[styles.jprogfill, { width: `${homePct(pet)}%` }]} /></View>
            {nm && (
              <Btn
                title={canAfford ? `Build ${nm.name} for ${nm.cost}` : `${nm.name} needs ${nm.cost} coins`}
                variant={canAfford ? 'orange' : 'ghost'}
                block
                style={{ marginTop: 12 }}
                left={<Image source={img.coin} style={{ width: 16, height: 16 }} />}
                onPress={() => buildMilestone(nm.id)}
              />
            )}
            <View style={styles.growthnote}>
              <Icon name="sparkle" size={12} color={colors.teal} />
              <Txt weight={600} size={11.5} color={colors.muted} style={{ flex: 1, lineHeight: 16 }}>
                Building the home is how {pet.name} grows up. Every milestone is permanent.
              </Txt>
            </View>
          </Card>

          {/* health card */}
          <Card style={{ padding: 16, marginTop: 12 }}>
            <View style={styles.spread}>
              <Txt weight={800} color={colors.tealInk}>Health</Txt>
              <Txt weight={600} size={12} color={colors.muted}>Drops slowly, feed to restore</Txt>
            </View>
            <View style={styles.health}>
              <Icon name="heart" size={16} color="#E5654B" />
              <View style={styles.healthBar}><View style={[styles.healthFill, { width: `${pet.health}%`, backgroundColor: pet.health < 40 ? '#E5654B' : colors.yellow2 }]} /></View>
              <Txt weight={800} size={13} color={colors.tealInk} style={{ minWidth: 52, textAlign: 'right' }}>{pet.health}/100</Txt>
            </View>
            <View style={styles.carerow}>
              <CareBtn icon={img.apple} label="Feed" onPress={openFeed} />
              <CareBtn icon={img.wardrobe} label="Wardrobe" onPress={() => openOverlay('shop', { tab: 'clothes' })} />
              <CareBtn icon={img.petIcon} label="Adopt" onPress={() => openOverlay('shop', { tab: 'pets' })} />
            </View>
          </Card>

          {/* earnings */}
          <View style={styles.shead}><Txt weight={700} size={16} color={colors.tealInk}>Earnings</Txt></View>
          <Card style={{ padding: 16 }}>
            <View style={styles.earnlvl}>
              <View style={styles.earnbadge}><Image source={img.coin} style={{ width: 22, height: 22 }} /></View>
              <View style={{ flex: 1 }}>
                <Txt weight={800} size={15} color={colors.tealInk}>{idleRate(pet)} coins / hour</Txt>
                <Txt weight={600} size={11.5} color={colors.muted}>{pet.name} earns while you are away, up to a {idleCap(pet)}h jar</Txt>
              </View>
            </View>
            {pending > 0 ? (
              <Btn title={`Collect ${pending} coins${idleFull(pet) ? ' (jar full)' : ''}`} block style={{ marginTop: 13 }}
                left={<Image source={img.coin} style={{ width: 16, height: 16 }} />} onPress={collectIdle} />
            ) : (
              <View style={styles.bondempty}><Txt weight={600} size={12} color={colors.muted}>Come back later to collect what {pet.name} saves up.</Txt></View>
            )}
          </Card>

          {/* benefits */}
          <View style={styles.shead}><Txt weight={700} size={16} color={colors.tealInk}>What {pet.name} does for you</Txt></View>
          <Card style={{ paddingHorizontal: 16 }}>
            <BenRow icon={<Image source={img.coin} style={{ width: 22, height: 22 }} />} title="Earns while you are away"
              desc={`A happy pet and a bigger home mean more coins per hour, up to a ${idleCap(pet)}h jar.`}
              val={`${idleRate(pet)}/hr`} valType="bonus" />
            <BenRow icon={<Icon name="bolt" size={20} color={colors.orange} />} title="Focus reward boost" desc={nextInfo}
              val={bp > 0 ? `+${bp}%` : '0%'} valType={bp > 0 ? 'bonus' : 'off'} />
            <BenRow icon={<Icon name="shield" size={20} color={shield ? colors.good : colors.muted} />} title="Streak shield"
              desc={shield ? `Health is 60+, so ${pet.name} saves your streak if you miss a day.` : `Keep health at 60+ and ${pet.name} guards your streak.`}
              val={shield ? 'On' : 'Off'} valType={shield ? 'on' : 'off'} last />
          </Card>

          {/* wardrobe */}
          <View style={styles.shead}>
            <Txt weight={700} size={16} color={colors.tealInk}>Wardrobe</Txt>
            <Txt weight={700} size={12.5} color={colors.orange} onPress={() => openOverlay('shop', { tab: 'clothes' })}>Get more</Txt>
          </View>
          <View style={styles.grid}>
            <Pressable style={styles.shopcard} onPress={() => equip(0)}>
              <Image source={img.petIcon} style={[styles.art, { opacity: 0.7 }]} resizeMode="contain" />
              <Txt weight={700} size={13.5} color={colors.tealInk}>No outfit</Txt>
              <Txt weight={600} size={11} color={colors.muted}>Natural look</Txt>
              <WearTag on={pet.clothesId === 0} />
            </Pressable>
            {pet.ownedClothes.length ? pet.ownedClothes.map((id) => {
              const c = CLOTHES.find((x) => x.id === id)!;
              const on = pet.clothesId === id;
              return (
                <Pressable key={id} style={styles.shopcard} onPress={() => equip(id)}>
                  <Image source={clothesImg[id]} style={styles.art} resizeMode="contain" />
                  <Txt weight={700} size={13.5} color={colors.tealInk}>{c.name}</Txt>
                  <Txt weight={600} size={11} color={colors.muted}>Cosmetic</Txt>
                  <WearTag on={on} />
                </Pressable>
              );
            }) : (
              <Pressable style={[styles.shopcard, { justifyContent: 'center', minHeight: 150 }]} onPress={() => openOverlay('shop', { tab: 'clothes' })}>
                <Icon name="shirt" size={30} color={colors.line2} />
                <Txt weight={700} size={13.5} color={colors.tealInk} style={{ marginTop: 6 }}>No outfits yet</Txt>
                <Txt weight={600} size={11} color={colors.muted}>Buy some in the shop</Txt>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* feed sheet */}
      <BottomSheet visible={feedOpen} onClose={() => setFeedOpen(false)} title={`Feed ${pet.name}`}
        subtitle={`Health ${pet.health}/100 · a happier pet means a bigger focus reward (now +${bp}%)`}>
        {anyFood ? (
          <View style={styles.feedgrid}>
            {FOODS.map((f) => {
              const qty = pet.food[f.id] || 0;
              return (
                <Pressable key={f.id} style={[styles.fooditem, qty <= 0 && { opacity: 0.4 }]} disabled={qty <= 0} onPress={() => doFeed(f.id)}>
                  {qty > 0 && <View style={styles.fq}><Txt weight={800} size={10} color={colors.teal}>×{qty}</Txt></View>}
                  <Image source={foodImg[f.id]} style={{ width: 46, height: 46 }} resizeMode="contain" />
                  <Txt weight={700} size={11} color={colors.tealInk}>{f.name}</Txt>
                  <Txt weight={700} size={10.5} color={colors.good}>+{f.heal}</Txt>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ alignItems: 'center', padding: 14 }}>
            <Icon name="bag" size={34} color={colors.line2} />
            <Txt weight={700} color={colors.tealInk} style={{ marginTop: 8 }}>No food yet</Txt>
            <Txt size={12} color={colors.muted}>Grab some snacks from the shop.</Txt>
          </View>
        )}
        <View style={styles.dactions}>
          <Btn title="Close" variant="ghost" block style={{ flex: 1 }} onPress={() => setFeedOpen(false)} />
          <Btn title="Buy food" block style={{ flex: 1 }} onPress={() => { setFeedOpen(false); openOverlay('shop', { tab: 'food' }); }} />
        </View>
      </BottomSheet>
    </View>
  );
}

function CareBtn({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.carebtn} onPress={onPress}>
      <Image source={icon} style={{ width: 34, height: 34 }} resizeMode="contain" />
      <Txt weight={700} size={11.5} color={colors.tealInk}>{label}</Txt>
    </Pressable>
  );
}
function WearTag({ on }: { on: boolean }) {
  return (
    <View style={[styles.wear, on ? { backgroundColor: colors.teal } : { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.line2 }]}>
      <Txt weight={800} size={13.5} color={on ? '#fff' : colors.teal}>{on ? 'Wearing' : 'Wear'}</Txt>
    </View>
  );
}
function BenRow({ icon, title, desc, val, valType, last }: { icon: React.ReactNode; title: string; desc: string; val: string; valType: 'bonus' | 'on' | 'off'; last?: boolean }) {
  const valBg = valType === 'bonus' ? '#FFF4E7' : valType === 'on' ? '#E4EFF3' : colors.cream;
  const valColor = valType === 'bonus' ? colors.orange2 : valType === 'on' ? colors.good : colors.muted;
  return (
    <View style={[styles.benrow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.benic}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight={700} size={14} color={colors.tealInk}>{title}</Txt>
        <Txt size={11.5} color={colors.muted} style={{ marginTop: 2, lineHeight: 16 }}>{desc}</Txt>
      </View>
      <View style={[styles.benval, { backgroundColor: valBg }]}><Txt weight={800} size={12.5} color={valColor}>{val}</Txt></View>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  avatarImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#DDEDE9' },
  pad: { paddingHorizontal: 16, paddingTop: 16 },
  room: { height: 290, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  moodtag: { position: 'absolute', top: 12, left: 12, zIndex: 3, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,.92)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill },
  mooddot: { width: 8, height: 8, borderRadius: 4 },
  petShadow: { position: 'absolute', bottom: 20, alignSelf: 'center', width: 120, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,.14)', zIndex: 1 },
  petStageBox: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 230, alignItems: 'center', justifyContent: 'flex-end', zIndex: 2 },
  pileBadge: { position: 'absolute', top: 12, alignSelf: 'center', zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(12,76,96,.92)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12, marginHorizontal: 2 },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  jprogbar: { height: 9, borderRadius: 999, backgroundColor: '#EFE7D6', overflow: 'hidden', marginTop: 11 },
  jprogfill: { height: '100%', borderRadius: 999, backgroundColor: '#8580B0' },
  growthnote: { flexDirection: 'row', gap: 5, marginTop: 12 },
  health: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  healthBar: { flex: 1, height: 13, borderRadius: 9, backgroundColor: '#EFE7D6', overflow: 'hidden' },
  healthFill: { height: '100%', borderRadius: 9 },
  carerow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  carebtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8, borderRadius: radius.md, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, ...shadow.sm },
  earnlvl: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  earnbadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  bondempty: { marginTop: 12, alignItems: 'center', backgroundColor: colors.cream, borderRadius: 12, padding: 11 },
  benrow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  benic: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  benval: { minWidth: 56, alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shopcard: { width: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', ...shadow.sm },
  art: { width: 78, height: 78, marginVertical: 6 },
  wear: { marginTop: 10, width: '100%', alignItems: 'center', paddingVertical: 9, borderRadius: 12 },
  feedgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  fooditem: { width: '31%', flexGrow: 1, backgroundColor: colors.cream, borderRadius: 16, paddingVertical: 10, alignItems: 'center', borderWidth: 2, borderColor: colors.line },
  fq: { position: 'absolute', top: 4, right: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line2, paddingVertical: 1, paddingHorizontal: 6, borderRadius: 999, zIndex: 1 },
  dactions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
