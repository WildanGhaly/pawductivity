import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/**
 * The legacy app's hand-drawn icon set, inlined as recolorable react-native-svg
 * components (paths lifted from old/Pawductivity_App/assets/icons/*.svg). Using these
 * instead of emoji is what makes the UI read as one consistent product.
 */

export function PlayIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={(size * 28) / 26} viewBox="0 0 26 28" fill="none">
      <Path
        d="M23.6995 11.0312C25.728 12.1802 25.728 15.1027 23.6995 16.2518L5.3247 26.6603C3.3248 27.7932 0.846079 26.3485 0.84608 24.05L0.84608 3.23293C0.846081 0.934461 3.3248 -0.510224 5.3247 0.622633L23.6995 11.0312Z"
        fill={color}
      />
    </Svg>
  );
}

export function PauseIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={3} width={4.5} height={18} rx={2} fill={color} />
      <Rect x={14.5} y={3} width={4.5} height={18} rx={2} fill={color} />
    </Svg>
  );
}

export function CheckIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={(size * 15) / 17} viewBox="0 0 17 15" fill="none">
      <Path d="M2 8L7 13.5L15 2" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BackIcon({ size = 22, color = '#0C4C60' }: { size?: number; color?: string }) {
  return (
    <Svg width={(size * 16) / 23} height={size} viewBox="0 0 16 23" fill="none">
      <Path
        d="M14 2.5L3.33479 10.2938C2.20606 11.1186 2.25025 12.8175 3.42033 13.5825L14 20.5"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PawIcon({ size = 18, color = '#E28A4B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={(size * 13) / 17} viewBox="0 0 17 13" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.46429 0C4.86321 0 4.39207 0.355727 4.10064 0.782364C3.80557 1.21255 3.64286 1.77391 3.64286 2.36364C3.64286 2.95336 3.80557 3.51473 4.10064 3.94491C4.39207 4.37036 4.86321 4.72727 5.46429 4.72727C6.06536 4.72727 6.5365 4.37154 6.82793 3.94491C7.123 3.51473 7.28571 2.95336 7.28571 2.36364C7.28571 1.77391 7.123 1.21255 6.82793 0.782364C6.5365 0.356909 6.06536 0 5.46429 0ZM11.5357 0C10.9346 0 10.4635 0.355727 10.1721 0.782364C9.877 1.21255 9.71429 1.77391 9.71429 2.36364C9.71429 2.95336 9.877 3.51473 10.1721 3.94491C10.4635 4.37036 10.9346 4.72727 11.5357 4.72727C12.1368 4.72727 12.6079 4.37154 12.8994 3.94491C13.1944 3.51473 13.3571 2.95336 13.3571 2.36364C13.3571 1.77391 13.1944 1.21255 12.8994 0.782364C12.6079 0.356909 12.1368 0 11.5357 0ZM1.82143 5.31818C1.22036 5.31818 0.749214 5.67391 0.457786 6.10055C0.162714 6.53073 0 7.09209 0 7.68182C0 8.27155 0.162714 8.83291 0.457786 9.26309C0.749214 9.68855 1.22036 10.0455 1.82143 10.0455C2.4225 10.0455 2.89364 9.68973 3.18507 9.26309C3.48014 8.83291 3.64286 8.27155 3.64286 7.68182C3.64286 7.09209 3.48014 6.53073 3.18507 6.10055C2.89364 5.67509 2.4225 5.31818 1.82143 5.31818ZM8.5 5.31818C7.04286 5.31818 5.96336 6.07927 5.27364 7.02354C4.59243 7.95364 4.25 9.10827 4.25 10.0455C4.25 11.1375 4.92393 11.8962 5.75086 12.3524C6.56443 12.8015 7.58443 13 8.5 13C9.41557 13 10.4356 12.8026 11.2491 12.3524C12.0749 11.8962 12.75 11.1375 12.75 10.0455C12.75 9.10827 12.4076 7.95364 11.7264 7.02354C11.0379 6.07809 9.95836 5.31818 8.5 5.31818ZM15.1786 5.31818C14.5775 5.31818 14.1064 5.67391 13.8149 6.10055C13.5199 6.53073 13.3571 7.09209 13.3571 7.68182C13.3571 8.27155 13.5199 8.83291 13.8149 9.26309C14.1064 9.68855 14.5775 10.0455 15.1786 10.0455C15.7796 10.0455 16.2508 9.68973 16.5422 9.26309C16.8373 8.83291 17 8.27155 17 7.68182C17 7.09209 16.8373 6.53073 16.5422 6.10055C16.2508 5.67509 15.7796 5.31818 15.1786 5.31818Z"
        fill={color}
      />
    </Svg>
  );
}
