import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path, Circle, Ellipse, G, Rect } from 'react-native-svg';

// The three new companions (Fox, Penguin, Axolotl) are hand-drawn SVG characters
// with a lively multi-part idle: a native-driven breathe/bounce, per-part secondary
// motion (the fox's tail wags, the penguin's flippers flap, the axolotl's gills wave,
// each with a gentle head tilt), and a periodic blink. They feel as alive as the Lottie
// starters without bespoke Lottie files. Old species keep their Lottie in PetView.
export type SpriteSpecies = 'fox' | 'penguin' | 'axolotl';
export const SPRITE_SPECIES: SpriteSpecies[] = ['fox', 'penguin', 'axolotl'];
export function isSpriteSpecies(s: string): s is SpriteSpecies {
  return s === 'fox' || s === 'penguin' || s === 'axolotl';
}

const AG = Animated.createAnimatedComponent(G);

// A worn outfit reads as a small tinted vest across the torso (+ a bow-tie accent for
// the fancy ones), so "wearing" is visible on the new pets too. Colors mirror the shop.
const OUTFIT: Record<number, { fill: string; accent?: string }> = {
  1: { fill: '#37B6C4' }, // Cyan T-shirt
  2: { fill: '#5FA855' }, // Green Shirt
  3: { fill: '#2B2B33', accent: '#fff' }, // Tuxedo
  4: { fill: '#F0A03D', accent: '#FFE08A' }, // Star Shirt
  5: { fill: '#EE7FA8', accent: '#FBD3E1' }, // Pink Dress
};

function Vest({ clothesId, cx = 50, cy = 78, w = 26 }: { clothesId: number; cx?: number; cy?: number; w?: number }) {
  const o = OUTFIT[clothesId];
  if (!o) return null;
  const dress = clothesId === 5;
  return (
    <G>
      {dress ? (
        <Path d={`M${cx - w / 2} ${cy - 4} Q${cx} ${cy - 9} ${cx + w / 2} ${cy - 4} L${cx + w / 2 + 4} ${cy + 16} Q${cx} ${cy + 22} ${cx - w / 2 - 4} ${cy + 16} Z`} fill={o.fill} />
      ) : (
        <Path d={`M${cx - w / 2} ${cy - 5} Q${cx} ${cy - 10} ${cx + w / 2} ${cy - 5} L${cx + w / 2 - 2} ${cy + 11} Q${cx} ${cy + 15} ${cx - w / 2 + 2} ${cy + 11} Z`} fill={o.fill} />
      )}
      {clothesId === 3 && <Path d={`M${cx - 4} ${cy - 3} L${cx + 4} ${cy - 3} L${cx} ${cy + 6} Z`} fill={o.accent} />}
      {clothesId === 4 && <Path d={`M${cx} ${cy - 1} l1.6 3.4 3.7.4 -2.8 2.5 .8 3.7 -3.3 -2 -3.3 2 .8 -3.7 -2.8 -2.5 3.7 -.4 Z`} fill={o.accent} />}
      {clothesId === 3 && <Path d={`M${cx - 5} ${cy - 6} L${cx} ${cy - 3} L${cx + 5} ${cy - 6} L${cx + 4} ${cy - 3} L${cx - 4} ${cy - 3} Z`} fill={o.accent} />}
    </G>
  );
}

// Open eyes cross-fade to a closed line during a blink (blink: 1 open, 0 closed).
function Eyes({ blink, positions, r = 3.4 }: { blink: Animated.Value; positions: [number, number][]; r?: number }) {
  const closed = blink.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  return (
    <G>
      <AG opacity={blink}>
        {positions.map(([x, y], i) => (
          <G key={i}>
            <Ellipse cx={x} cy={y} rx={r} ry={r + 0.6} fill="#2B2B33" />
            <Circle cx={x + 1} cy={y - 1.2} r={1} fill="#fff" />
          </G>
        ))}
      </AG>
      <AG opacity={closed}>
        {positions.map(([x, y], i) => (
          <Path key={i} d={`M${x - r} ${y} Q${x} ${y + 2.4} ${x + r} ${y}`} stroke="#2B2B33" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        ))}
      </AG>
    </G>
  );
}

// `move` (0..1) drives the secondary motions (tails, flippers, gills, head tilt).
type PetProps = { blink: Animated.Value; move: Animated.Value; clothesId: number };
const rot = (move: Animated.Value, a: number, b: number) => move.interpolate({ inputRange: [0, 1], outputRange: [a, b] });

function Fox({ blink, move, clothesId }: PetProps) {
  return (
    <G>
      {/* bushy tail — wags */}
      <AG rotation={rot(move, -15, 15)} originX={30} originY={66}>
        <Path d="M28 74 Q6 70 10 50 Q18 58 30 62 Z" fill="#D9743A" />
        <Path d="M12 52 Q7 60 14 66 Q19 62 22 60 Z" fill="#F7EDE3" />
      </AG>
      {/* shadow */}
      <Ellipse cx="52" cy="106" rx="24" ry="5" fill="rgba(0,0,0,0.12)" />
      {/* legs */}
      <Rect x="40" y="92" width="9" height="14" rx="4.5" fill="#D9743A" />
      <Rect x="55" y="92" width="9" height="14" rx="4.5" fill="#D9743A" />
      <Ellipse cx="44.5" cy="105" rx="5.5" ry="3.5" fill="#2B2B33" />
      <Ellipse cx="59.5" cy="105" rx="5.5" ry="3.5" fill="#2B2B33" />
      {/* body */}
      <Path d="M50 58 Q74 60 72 84 Q70 98 50 98 Q30 98 28 84 Q26 60 50 58 Z" fill="#E8894A" />
      <Path d="M50 74 Q62 74 62 88 Q58 96 50 96 Q42 96 38 88 Q38 74 50 74 Z" fill="#F7EDE3" />
      <Vest clothesId={clothesId} cx={50} cy={80} w={22} />
      {/* head — tilts gently opposite the tail */}
      <AG rotation={rot(move, 3, -3)} originX={50} originY={58}>
        {/* ears */}
        <Path d="M32 44 L28 20 L48 36 Z" fill="#E8894A" />
        <Path d="M68 44 L72 20 L52 36 Z" fill="#E8894A" />
        <Path d="M33 40 L31 26 L43 35 Z" fill="#2B2B33" />
        <Path d="M67 40 L69 26 L57 35 Z" fill="#2B2B33" />
        <Circle cx="50" cy="48" r="24" fill="#E8894A" />
        {/* white cheeks / muzzle */}
        <Path d="M50 40 Q66 44 60 62 Q50 68 40 62 Q34 44 50 40 Z" fill="#F7EDE3" />
        <Eyes blink={blink} positions={[[41, 46], [59, 46]]} />
        {/* nose */}
        <Path d="M46 58 Q50 62 54 58 Q50 63 46 58 Z" fill="#2B2B33" />
        <Ellipse cx="50" cy="56.5" rx="2.4" ry="2" fill="#2B2B33" />
        {/* cheek blush */}
        <Circle cx="34" cy="53" r="3" fill="rgba(233,120,90,0.4)" />
        <Circle cx="66" cy="53" r="3" fill="rgba(233,120,90,0.4)" />
      </AG>
    </G>
  );
}

function Penguin({ blink, move, clothesId }: PetProps) {
  return (
    <G>
      <Ellipse cx="50" cy="106" rx="22" ry="5" fill="rgba(0,0,0,0.12)" />
      {/* feet */}
      <Path d="M38 98 Q34 108 44 106 Q46 100 44 98 Z" fill="#F2A03D" />
      <Path d="M62 98 Q66 108 56 106 Q54 100 56 98 Z" fill="#F2A03D" />
      {/* body */}
      <Path d="M50 22 Q78 24 76 70 Q74 100 50 100 Q26 100 24 70 Q22 24 50 22 Z" fill="#2E3440" />
      {/* belly */}
      <Path d="M50 40 Q66 42 65 72 Q62 92 50 92 Q38 92 35 72 Q34 42 50 40 Z" fill="#F7F5EE" />
      <Vest clothesId={clothesId} cx={50} cy={70} w={22} />
      {/* flippers — flap in opposition */}
      <AG rotation={rot(move, -13, 13)} originX={28} originY={54}>
        <Path d="M26 52 Q16 62 24 78 Q30 70 30 58 Z" fill="#262B36" />
      </AG>
      <AG rotation={rot(move, 13, -13)} originX={72} originY={54}>
        <Path d="M74 52 Q84 62 76 78 Q70 70 70 58 Z" fill="#262B36" />
      </AG>
      {/* face — tilts a touch */}
      <AG rotation={rot(move, 1.6, -1.6)} originX={50} originY={54}>
        {/* white face patch */}
        <Path d="M50 28 Q68 30 66 48 Q58 60 50 60 Q42 60 34 48 Q32 30 50 28 Z" fill="#F7F5EE" />
        <Eyes blink={blink} positions={[[42, 42], [58, 42]]} r={3.6} />
        {/* beak */}
        <Path d="M44 50 Q50 46 56 50 Q50 58 44 50 Z" fill="#F2A03D" />
        <Path d="M45 51 Q50 53 55 51 Q50 55 45 51 Z" fill="#D98327" />
        {/* cheek blush */}
        <Circle cx="35" cy="50" r="2.6" fill="rgba(242,160,61,0.35)" />
        <Circle cx="65" cy="50" r="2.6" fill="rgba(242,160,61,0.35)" />
      </AG>
    </G>
  );
}

function Axolotl({ blink, move, clothesId }: PetProps) {
  const frill = (x: number, dir: number) => (
    <>
      <Path d={`M${x} 46 q${8 * dir} -10 ${14 * dir} -6 q${-4 * dir} 6 ${-9 * dir} 8 Z`} fill="#EE6F97" />
      <Path d={`M${x} 52 q${9 * dir} -3 ${15 * dir} 2 q${-5 * dir} 5 ${-10 * dir} 5 Z`} fill="#F07FA3" />
      <Path d={`M${x} 58 q${8 * dir} 4 ${13 * dir} 10 q${-6 * dir} 2 ${-10 * dir} -2 Z`} fill="#EE6F97" />
    </>
  );
  return (
    <G>
      <Ellipse cx="50" cy="104" rx="24" ry="5" fill="rgba(0,0,0,0.12)" />
      {/* tail — sways */}
      <AG rotation={rot(move, -8, 8)} originX={50} originY={82}>
        <Path d="M50 78 Q70 78 80 96 Q64 100 50 94 Z" fill="#F4A9C7" />
        <Path d="M50 80 Q66 82 74 94 Q62 96 52 92 Z" fill="#FBD3E1" />
      </AG>
      {/* legs */}
      <Ellipse cx="34" cy="92" rx="7" ry="5" fill="#F4A9C7" />
      <Ellipse cx="66" cy="92" rx="7" ry="5" fill="#F4A9C7" />
      {/* body */}
      <Path d="M50 60 Q70 62 68 84 Q64 96 50 96 Q36 96 32 84 Q30 62 50 60 Z" fill="#F4A9C7" />
      <Path d="M50 72 Q60 72 59 86 Q55 92 50 92 Q45 92 41 86 Q40 72 50 72 Z" fill="#FBD3E1" />
      <Vest clothesId={clothesId} cx={50} cy={80} w={20} />
      {/* frilly gills (signature) — wave in opposition */}
      <AG rotation={rot(move, -9, 9)} originX={30} originY={50}>{frill(30, -1)}</AG>
      <AG rotation={rot(move, 9, -9)} originX={70} originY={50}>{frill(70, 1)}</AG>
      {/* head — tilts gently */}
      <AG rotation={rot(move, -2.4, 2.4)} originX={50} originY={60}>
        <Ellipse cx="50" cy="46" rx="26" ry="22" fill="#F4A9C7" />
        <Eyes blink={blink} positions={[[40, 44], [60, 44]]} r={2.8} />
        {/* smile */}
        <Path d="M40 54 Q50 64 60 54" stroke="#C86A8C" strokeWidth={2} strokeLinecap="round" fill="none" />
        {/* cheek blush */}
        <Circle cx="33" cy="52" r="4" fill="rgba(245,139,176,0.6)" />
        <Circle cx="67" cy="52" r="4" fill="rgba(245,139,176,0.6)" />
      </AG>
    </G>
  );
}

export function PetSprite({
  species,
  clothesId = 0,
  size = 200,
  animated = true,
  speed = 1,
}: {
  species: SpriteSpecies;
  clothesId?: number;
  size?: number;
  animated?: boolean;
  speed?: number;
}) {
  const bob = useRef(new Animated.Value(0)).current; // native: whole-body breathe/bounce
  const move = useRef(new Animated.Value(0.5)).current; // secondary motion; 0.5 = neutral pose (for static thumbnails)
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;
    // Mood-reactive idle: a happier pet (higher speed) moves a little faster. The
    // breathe runs on the native driver; the SVG part motions and blink use Animated
    // on the JS thread (small + infrequent, so still smooth on an idle screen).
    const s = Math.max(0.4, speed);
    const pingpong = (val: Animated.Value, dur: number, native: boolean) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
          Animated.timing(val, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        ]),
      );
    const bobLoop = pingpong(bob, Math.round(1500 / s), true);
    const moveLoop = pingpong(move, Math.round(1050 / s), false);
    bobLoop.start();
    moveLoop.start();

    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const doBlink = () => {
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 80, useNativeDriver: false }),
        Animated.timing(blink, { toValue: 1, duration: 110, useNativeDriver: false }),
      ]).start(() => {
        if (alive) timer = setTimeout(doBlink, 2200 + Math.random() * 2400);
      });
    };
    timer = setTimeout(doBlink, 1400);

    return () => {
      alive = false;
      bobLoop.stop();
      moveLoop.stop();
      clearTimeout(timer);
    };
  }, [animated, bob, move, blink, speed]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [4, -4] });
  const scaleY = bob.interpolate({ inputRange: [0, 1], outputRange: [0.975, 1.02] });

  return (
    <Animated.View
      style={{ width: size, height: size * 1.15, alignSelf: 'center', transform: [{ translateY }, { scaleY }] }}
    >
      <Svg viewBox="0 0 100 118" width="100%" height="100%">
        {species === 'fox' && <Fox blink={blink} move={move} clothesId={clothesId} />}
        {species === 'penguin' && <Penguin blink={blink} move={move} clothesId={clothesId} />}
        {species === 'axolotl' && <Axolotl blink={blink} move={move} clothesId={clothesId} />}
      </Svg>
    </Animated.View>
  );
}
