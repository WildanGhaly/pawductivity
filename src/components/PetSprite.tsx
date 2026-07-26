import React, { useCallback, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useFrameCallback,
  useAnimatedProps,
  useAnimatedStyle,
  type SharedValue,
  type FrameInfo,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Ellipse, G, Rect } from 'react-native-svg';
import type { GProps } from 'react-native-svg';

// react-native-svg's public GProps omits the low-level `matrix` escape-hatch, but the JS
// <G> forwards a provided `matrix` straight to the native codegen `matrix` prop (see
// elements/G.js). We animate that native prop from reanimated worklets (it updates on the
// UI thread; the discrete rotation/transform props are JS-resolved and would be bypassed),
// so declare it here to type our animatedProps without casts.
declare module 'react-native-svg' {
  interface GProps {
    matrix?: number[];
  }
}

// The three new companions (Fox, Penguin, Axolotl) are hand-drawn SVG characters with a
// buttery, alive idle. Every moving part is animated on the UI THREAD via
// react-native-reanimated worklets (never the JS thread), so the motion stays perfectly
// smooth even while the Focus timer re-renders the screen. All motion is a bank of pure
// sine oscillators at mutually-detuned (non-harmonic) frequencies read from ONE monotonic
// frame clock: nothing loops or resets, nothing moves in lockstep, the composite pose is
// quasi-periodic (never visibly repeats), and each pet has its own character (a lazy fox
// tail-wag with head-lag, a bumbling penguin waddle + flipper flap, a weightless axolotl
// with drifting gills). Old species keep their Lottie in PetView.
export type SpriteSpecies = 'fox' | 'penguin' | 'axolotl';
export const SPRITE_SPECIES: SpriteSpecies[] = ['fox', 'penguin', 'axolotl'];
export function isSpriteSpecies(s: string): s is SpriteSpecies {
  return s === 'fox' || s === 'penguin' || s === 'axolotl';
}

const AnimatedG = Animated.createAnimatedComponent(G);
const TAU = Math.PI * 2;

// A pure sine of the monotonic clock. The `t % period` reduction happens BEFORE dividing
// so the argument stays in [0, TAU) and double-precision phase stays bit-clean across an
// all-day idle session (timeSinceFirstFrame grows unbounded). Continuous in position and
// velocity (derivative is cos), so there is no turnaround seam and the loop is seamless.
function osc(t: number, period: number, phase: number): number {
  'worklet';
  return Math.sin(TAU * ((t % period) / period + phase));
}

// react-native-svg's ONLY animatable native transform on <G> is the `matrix` prop
// [a, b, c, d, tx, ty], laid out as [ a c tx / b d ty / 0 0 1 ] (point -> a*x+c*y+tx,
// b*x+d*y+ty). The discrete rotation/originX/transform props are resolved to a matrix at
// the JS layer, which useAnimatedProps bypasses, so we build the matrix in-worklet.
// Rotates `deg` around the pivot (px, py) — every part stays hinged to the body and can
// never visually detach.
function rotMatrix(deg: number, px: number, py: number): number[] {
  'worklet';
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return [cos, sin, -sin, cos, px - cos * px + sin * py, py - sin * px - cos * py];
}

// Non-uniform scale + rotation about a pivot: M = T(p)·R(deg)·S(sx,sy)·T(-p). Used for the
// whole-body breathe (volume-preserving squash) and the penguin waddle-rock, pivoted at the
// feet so the contact shadow never lifts.
function bodyMatrix(sx: number, sy: number, deg: number, px: number, py: number): number[] {
  'worklet';
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const a = c * sx;
  const b = s * sx;
  const cc = -s * sy;
  const d = c * sy;
  return [a, b, cc, d, px - (a * px + cc * py), py - (b * px + d * py)];
}

// Smooth, slightly-irregular blink: two detuned gates so blinks never feel metronomic.
// Returns eye "openness" 0..1 (1 = open) as a continuous dip (1 -> 0 -> 1).
function blinkOpenness(t: number): number {
  'worklet';
  const gate = (period: number, offset: number) => {
    const p = (((t + offset) % period) + period) % period / period; // 0..1
    const dur = 150 / period; // ~150ms closed sweep
    if (p < dur) return Math.abs(Math.cos(Math.PI * (p / dur)));
    return 1;
  };
  return Math.min(gate(3300, 0), gate(5100, 1700));
}

// A part's oscillation: primary sine (a1 over p1 ms, phase ph1 in turns) plus an optional
// faster second-harmonic (a2/p2/ph2) for follow-through / tip-whip.
type Osc = { px: number; py: number; a1: number; p1: number; ph1: number; a2?: number; p2?: number; ph2?: number };

// UI-thread animatedProps that rotate a <G> around its pivot from the shared phase clock
// (which already carries the mood-speed scaling). When not animated it holds the neutral rest
// pose for static thumbnails.
function usePartProps(clock: SharedValue<number>, animated: boolean, o: Osc) {
  return useAnimatedProps<GProps>(() => {
    if (!animated) return { matrix: rotMatrix(0, o.px, o.py) };
    const t = clock.value;
    let deg = o.a1 * osc(t, o.p1, o.ph1);
    if (o.a2 && o.p2) deg += o.a2 * osc(t, o.p2, o.ph2 ?? 0);
    return { matrix: rotMatrix(deg, o.px, o.py) };
  });
}

// A worn outfit reads as a small tinted vest across the torso (+ a bow-tie accent for the
// fancy ones), so "wearing" is visible on the new pets too. Colors mirror the shop.
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

// Open eyes cross-fade to a closed line during a blink, driven on the UI thread.
type EyeProps = { clock: SharedValue<number>; animated: boolean; positions: [number, number][]; r?: number };
function Eyes({ clock, animated, positions, r = 3.4 }: EyeProps) {
  const openProps = useAnimatedProps<GProps>(() => ({ opacity: animated ? blinkOpenness(clock.value) : 1 }));
  const closedProps = useAnimatedProps<GProps>(() => ({ opacity: animated ? 1 - blinkOpenness(clock.value) : 0 }));
  return (
    <G>
      <AnimatedG animatedProps={openProps}>
        {positions.map(([x, y], i) => (
          <G key={i}>
            <Ellipse cx={x} cy={y} rx={r} ry={r + 0.6} fill="#2B2B33" />
            <Circle cx={x + 1} cy={y - 1.2} r={1} fill="#fff" />
          </G>
        ))}
      </AnimatedG>
      <AnimatedG animatedProps={closedProps}>
        {positions.map(([x, y], i) => (
          <Path key={i} d={`M${x - r} ${y} Q${x} ${y + 2.4} ${x + r} ${y}`} stroke="#2B2B33" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        ))}
      </AnimatedG>
    </G>
  );
}

type PetProps = {
  clock: SharedValue<number>;
  animated: boolean;
  clothesId: number;
};

function Fox({ clock, animated, clothesId }: PetProps) {
  // tail: lazy wag with a faster tip-whip (2nd harmonic); head lags the tail (follow-through)
  const tail = usePartProps(clock, animated, { px: 34, py: 70, a1: 9, p1: 1500, ph1: 0, a2: 2, p2: 750, ph2: 0.2 });
  const head = usePartProps(clock, animated, { px: 50, py: 60, a1: 2.4, p1: 2250, ph1: 0.38 });
  return (
    <G>
      {/* bushy tail — wags; base tucked deep under the body so it never separates */}
      <AnimatedG animatedProps={tail}>
        <Path d="M40 78 Q6 72 10 50 Q18 58 40 60 Z" fill="#D9743A" />
        <Path d="M12 52 Q7 60 14 66 Q19 62 22 60 Z" fill="#F7EDE3" />
      </AnimatedG>
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
      {/* head — tilts gently, lagging the tail */}
      <AnimatedG animatedProps={head}>
        {/* ears */}
        <Path d="M32 44 L28 20 L48 36 Z" fill="#E8894A" />
        <Path d="M68 44 L72 20 L52 36 Z" fill="#E8894A" />
        <Path d="M33 40 L31 26 L43 35 Z" fill="#2B2B33" />
        <Path d="M67 40 L69 26 L57 35 Z" fill="#2B2B33" />
        <Circle cx="50" cy="48" r="24" fill="#E8894A" />
        {/* white cheeks / muzzle */}
        <Path d="M50 40 Q66 44 60 62 Q50 68 40 62 Q34 44 50 40 Z" fill="#F7EDE3" />
        <Eyes clock={clock} animated={animated} positions={[[41, 46], [59, 46]]} />
        {/* nose */}
        <Path d="M46 58 Q50 62 54 58 Q50 63 46 58 Z" fill="#2B2B33" />
        <Ellipse cx="50" cy="56.5" rx="2.4" ry="2" fill="#2B2B33" />
        {/* cheek blush */}
        <Circle cx="34" cy="53" r="3" fill="rgba(233,120,90,0.4)" />
        <Circle cx="66" cy="53" r="3" fill="rgba(233,120,90,0.4)" />
      </AnimatedG>
    </G>
  );
}

function Penguin({ clock, animated, clothesId }: PetProps) {
  // flippers flap at DIFFERENT periods (1400 vs 1550) so they beat/alternate instead of
  // mirror-locking, each with a fast flutter overlay; face tilts subtly.
  const lFlip = usePartProps(clock, animated, { px: 34, py: 50, a1: 8, p1: 1400, ph1: 0, a2: 2.5, p2: 700, ph2: 0.1 });
  const rFlip = usePartProps(clock, animated, { px: 66, py: 50, a1: -7.5, p1: 1550, ph1: 0.08, a2: -2.5, p2: 775, ph2: 0.15 });
  const face = usePartProps(clock, animated, { px: 50, py: 54, a1: 1.4, p1: 2000, ph1: 0.3 });
  return (
    <G>
      <Ellipse cx="50" cy="106" rx="22" ry="5" fill="rgba(0,0,0,0.12)" />
      {/* feet */}
      <Path d="M38 98 Q34 108 44 106 Q46 100 44 98 Z" fill="#F2A03D" />
      <Path d="M62 98 Q66 108 56 106 Q54 100 56 98 Z" fill="#F2A03D" />
      {/* flippers — drawn BEHIND the body with the base tucked under it, so they flap
          from behind the penguin and never separate. */}
      <AnimatedG animatedProps={lFlip}>
        <Path d="M36 42 Q11 50 15 74 Q26 72 39 54 Z" fill="#262B36" />
      </AnimatedG>
      <AnimatedG animatedProps={rFlip}>
        <Path d="M64 42 Q89 50 85 74 Q74 72 61 54 Z" fill="#262B36" />
      </AnimatedG>
      {/* body (covers the flipper bases) */}
      <Path d="M50 22 Q78 24 76 70 Q74 100 50 100 Q26 100 24 70 Q22 24 50 22 Z" fill="#2E3440" />
      {/* belly */}
      <Path d="M50 40 Q66 42 65 72 Q62 92 50 92 Q38 92 35 72 Q34 42 50 40 Z" fill="#F7F5EE" />
      <Vest clothesId={clothesId} cx={50} cy={70} w={22} />
      {/* face — tilts a touch */}
      <AnimatedG animatedProps={face}>
        {/* white face patch */}
        <Path d="M50 28 Q68 30 66 48 Q58 60 50 60 Q42 60 34 48 Q32 30 50 28 Z" fill="#F7F5EE" />
        <Eyes clock={clock} animated={animated} positions={[[42, 42], [58, 42]]} r={3.6} />
        {/* beak */}
        <Path d="M44 50 Q50 46 56 50 Q50 58 44 50 Z" fill="#F2A03D" />
        <Path d="M45 51 Q50 53 55 51 Q50 55 45 51 Z" fill="#D98327" />
        {/* cheek blush */}
        <Circle cx="35" cy="50" r="2.6" fill="rgba(242,160,61,0.35)" />
        <Circle cx="65" cy="50" r="2.6" fill="rgba(242,160,61,0.35)" />
      </AnimatedG>
    </G>
  );
}

function Axolotl({ clock, animated, clothesId }: PetProps) {
  const frill = (x: number, dir: number) => (
    <>
      <Path d={`M${x} 46 q${8 * dir} -10 ${14 * dir} -6 q${-4 * dir} 6 ${-9 * dir} 8 Z`} fill="#EE6F97" />
      <Path d={`M${x} 52 q${9 * dir} -3 ${15 * dir} 2 q${-5 * dir} 5 ${-10 * dir} 5 Z`} fill="#F07FA3" />
      <Path d={`M${x} 58 q${8 * dir} 4 ${13 * dir} 10 q${-6 * dir} 2 ${-10 * dir} -2 Z`} fill="#EE6F97" />
    </>
  );
  // floaty underwater drift: slow primary + shimmery secondary; gills waft in opposition at
  // different periods (1700 vs 1900) so they never mirror-lock; a lazy S-curve tail drags.
  const lGill = usePartProps(clock, animated, { px: 32, py: 50, a1: 5, p1: 1700, ph1: 0, a2: 3, p2: 850, ph2: 0.2 });
  const rGill = usePartProps(clock, animated, { px: 68, py: 50, a1: -5, p1: 1900, ph1: 0.5, a2: -3, p2: 950, ph2: 0.35 });
  const tail = usePartProps(clock, animated, { px: 50, py: 84, a1: 6, p1: 1600, ph1: 0.25, a2: 1.6, p2: 800, ph2: 0.1 });
  const head = usePartProps(clock, animated, { px: 50, py: 60, a1: 1.6, p1: 2400, ph1: 0.4 });
  return (
    <G>
      <Ellipse cx="50" cy="104" rx="24" ry="5" fill="rgba(0,0,0,0.12)" />
      {/* tail — sways (base under the body) */}
      <AnimatedG animatedProps={tail}>
        <Path d="M50 78 Q70 78 80 96 Q64 100 50 94 Z" fill="#F4A9C7" />
        <Path d="M50 80 Q66 82 74 94 Q62 96 52 92 Z" fill="#FBD3E1" />
      </AnimatedG>
      {/* legs */}
      <Ellipse cx="34" cy="92" rx="7" ry="5" fill="#F4A9C7" />
      <Ellipse cx="66" cy="92" rx="7" ry="5" fill="#F4A9C7" />
      {/* body */}
      <Path d="M50 60 Q70 62 68 84 Q64 96 50 96 Q36 96 32 84 Q30 62 50 60 Z" fill="#F4A9C7" />
      <Path d="M50 72 Q60 72 59 86 Q55 92 50 92 Q45 92 41 86 Q40 72 50 72 Z" fill="#FBD3E1" />
      <Vest clothesId={clothesId} cx={50} cy={80} w={20} />
      {/* frilly gills (signature) — waft in opposition; bases tucked under the head */}
      <AnimatedG animatedProps={lGill}>{frill(32, -1)}</AnimatedG>
      <AnimatedG animatedProps={rGill}>{frill(68, 1)}</AnimatedG>
      {/* head — tilts gently */}
      <AnimatedG animatedProps={head}>
        <Ellipse cx="50" cy="46" rx="26" ry="22" fill="#F4A9C7" />
        <Eyes clock={clock} animated={animated} positions={[[40, 44], [60, 44]]} r={2.8} />
        {/* smile */}
        <Path d="M40 54 Q50 64 60 54" stroke="#C86A8C" strokeWidth={2} strokeLinecap="round" fill="none" />
        {/* cheek blush */}
        <Circle cx="33" cy="52" r="4" fill="rgba(245,139,176,0.6)" />
        <Circle cx="67" cy="52" r="4" fill="rgba(245,139,176,0.6)" />
      </AnimatedG>
    </G>
  );
}

// Per-species whole-body idle. Translation (bob + sway) rides the outer Animated.View
// (origin-independent, native-safe); the pivoted transforms (volume-preserving breathe and
// the penguin's waddle-rock) ride a matrix on an AnimatedG about the FEET so the contact
// shadow never lifts. Each channel has its own detuned period so the body never pulses
// mechanically. The penguin waddles hard (big rock, waddle tempo); the axolotl lists slowly
// (floaty); the fox is calm.
type Body = { bobA: number; bobP: number; swayA: number; swayP: number; rockA: number; rockP: number; breA: number; breP: number };
const BODY: Record<SpriteSpecies, Body> = {
  fox: { bobA: 2.2, bobP: 1900, swayA: 1.1, swayP: 3400, rockA: 0.8, rockP: 4100, breA: 0.020, breP: 2600 },
  penguin: { bobA: 1.8, bobP: 1150, swayA: 1.8, swayP: 1150, rockA: 2.5, rockP: 1150, breA: 0.016, breP: 2400 },
  axolotl: { bobA: 3.2, bobP: 2500, swayA: 1.5, swayP: 3000, rockA: 1.4, rockP: 3200, breA: 0.022, breP: 2900 },
};

const FEET_X = 50;
const FEET_Y = 106;

function PetSpriteBase({
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
  // ONE monotonic, speed-scaled phase clock drives every oscillator on the UI thread. We
  // ACCUMULATE elapsed frame time (scaled by the mood speed) rather than reading the absolute
  // timeSinceFirstFrame, which makes the motion robust in two ways the reviewers flagged:
  //  (a) a mood/outfit re-render that re-registers the frame callback cannot zero the clock
  //      (timeSincePreviousFrame is null on the first frame after re-register -> we add 0), and
  //  (b) a speed change only alters the RATE going forward, never rescaling the current phase,
  //      so there is no teleport when the pet's mood tier changes.
  // dt is clamped so a background pause / GC hitch can never jump the pose.
  const clock = useSharedValue(0);
  const spd = useSharedValue(Math.min(1.8, Math.max(0.5, speed)));
  useEffect(() => {
    spd.value = Math.min(1.8, Math.max(0.5, speed));
  }, [speed, spd]);

  // useCallback keeps the (already-workletized) tick a stable reference so reanimated's own
  // [callback] effect does not unregister+re-register it on every re-render.
  const tick = useCallback(
    (f: FrameInfo) => {
      'worklet';
      const dt = f.timeSincePreviousFrame;
      clock.value += (dt == null ? 0 : Math.min(dt, 64)) * spd.value;
    },
    [clock, spd],
  );
  const frame = useFrameCallback(tick, false);
  useEffect(() => {
    frame.setActive(!!animated);
  }, [animated, frame]);

  const b = BODY[species];

  // whole-body translation (bob + weight-shift sway) on the native-safe outer view
  const floatStyle = useAnimatedStyle(() => {
    if (!animated) return { transform: [{ translateY: 0 }] };
    const t = clock.value;
    return {
      transform: [
        { translateX: b.swayA * osc(t, b.swayP, 0.25) },
        { translateY: -b.bobA * osc(t, b.bobP, 0) },
      ],
    };
  });

  // whole-body breathe (volume-preserving squash) + waddle-rock, pivoted at the feet
  const bodyProps = useAnimatedProps<GProps>(() => {
    if (!animated) return { matrix: [1, 0, 0, 1, 0, 0] };
    const t = clock.value;
    const br = osc(t, b.breP, 0);
    const sy = 1 + b.breA * br;
    const sx = 1 - b.breA * 0.6 * br;
    const rock = b.rockA * osc(t, b.rockP, 0.5);
    return { matrix: bodyMatrix(sx, sy, rock, FEET_X, FEET_Y) };
  });

  return (
    <Animated.View style={[{ width: size, height: size * 1.15, alignSelf: 'center' }, floatStyle]}>
      <Svg viewBox="0 0 100 118" width="100%" height="100%">
        <AnimatedG animatedProps={bodyProps}>
          {species === 'fox' && <Fox clock={clock} animated={animated} clothesId={clothesId} />}
          {species === 'penguin' && <Penguin clock={clock} animated={animated} clothesId={clothesId} />}
          {species === 'axolotl' && <Axolotl clock={clock} animated={animated} clothesId={clothesId} />}
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}

// Memoized so a parent that re-renders often (e.g. the Focus timer ticking ~4x/sec) never
// re-renders the sprite. (The motion runs on the UI thread regardless, but this also keeps
// the React tree quiet.)
export const PetSprite = React.memo(PetSpriteBase);
