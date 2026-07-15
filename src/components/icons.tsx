import React from 'react';
import PlaySvg from '@/assets/icons/play.svg';
import PauseSvg from '@/assets/icons/pause.svg';
import CheckSvg from '@/assets/icons/check.svg';
import BackSvg from '@/assets/icons/back.svg';
import PawSvg from '@/assets/icons/paw.svg';

/**
 * The legacy app's own icon files (old/Pawductivity_App/assets/icons/*.svg), imported
 * directly via react-native-svg-transformer and sized to their native aspect ratios.
 * `color` is accepted for call-site compatibility; the legacy art carries its own fills
 * (white play/check, teal back, orange paw), which already match where they're used.
 */
type IconProps = { size?: number; color?: string };

export function PlayIcon({ size = 20 }: IconProps) {
  return <PlaySvg width={size} height={(size * 28) / 26} />;
}
export function PauseIcon({ size = 20 }: IconProps) {
  return <PauseSvg width={size} height={size} />;
}
export function CheckIcon({ size = 20 }: IconProps) {
  return <CheckSvg width={size} height={(size * 15) / 17} />;
}
export function BackIcon({ size = 22 }: IconProps) {
  return <BackSvg width={(size * 16) / 23} height={size} />;
}
export function PawIcon({ size = 18 }: IconProps) {
  return <PawSvg width={size} height={(size * 13) / 17} />;
}
