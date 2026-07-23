import React from 'react';
import { SvgXml } from 'react-native-svg';
import { colors } from '../theme/tokens';

// Ported 1:1 from the prototype ICONS map. Each entry is [kind, innerSvg].
// kind 'stroke' -> outline (fill none, stroke currentColor); 'fill' -> solid.
type Kind = 'stroke' | 'fill';
const ICONS: Record<string, [Kind, string]> = {
  clock: ['stroke', '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>'],
  calendar: ['stroke', '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3.2v3.6M15.5 3.2v3.6"/>'],
  repeat: ['stroke', '<path d="M4.5 9.2 7 6.6l2.6 2.6"/><path d="M7 6.6h7.5a4.2 4.2 0 0 1 4.2 4.2"/><path d="M19.5 14.8 17 17.4l-2.6-2.6"/><path d="M17 17.4H9.5a4.2 4.2 0 0 1-4.2-4.2"/>'],
  flame: ['fill', '<path d="M12.8 2.4c.4 2.7 2.7 3.7 3.4 6.1.9 3.1-1.2 6.6-4.6 6.6-2.9 0-5-2.2-4.6-5.1.2-1.4 1-2.2 1.7-3 .2 1.3.9 2 1.7 2.2-.5-2.3.9-4.6 2-6.8z"/><path d="M11 15.5c1.6 0 2.9 1 2.9 2.6 0 1.7-1.3 2.9-2.9 2.9s-2.7-1.2-2.7-2.7c0-1 .5-1.7 1.1-2.2.1.9.6 1.3 1.1 1.4-.3-1.1.1-1.6 .4-2z"/>'],
  check: ['stroke', '<path d="M8 12.5 11 15.5 16.5 6.5"/>'],
  checkCircle: ['stroke', '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.2 11 15l5-5.6"/>'],
  bolt: ['fill', '<path d="M13.5 2 5 13h5.2l-1 9L19 10.5h-5.4z"/>'],
  heart: ['fill', '<path d="M12 20.7C6.5 17 3 13.8 3 9.9 3 7.2 5 5.4 7.4 5.4c1.7 0 3 .9 3.9 2.2.9-1.3 2.2-2.2 3.9-2.2 2.4 0 4.4 1.8 4.4 4.5 0 3.9-3.5 7.1-9 10.8z"/>'],
  note: ['stroke', '<rect x="4.5" y="4" width="15" height="16" rx="3"/><path d="M8 9h8M8 12.5h8M8 16h5"/>'],
  play: ['fill', '<path d="M8 5.5v13l11-6.5z"/>'],
  pause: ['fill', '<rect x="7" y="5.5" width="3.6" height="13" rx="1.2"/><rect x="13.4" y="5.5" width="3.6" height="13" rx="1.2"/>'],
  reset: ['stroke', '<path d="M4.5 11a7.5 7.5 0 1 1 .9 4.2"/><path d="M4 5v4.2h4.2"/>'],
  plus: ['stroke', '<path d="M12 5.5v13M5.5 12h13"/>'],
  chevL: ['stroke', '<path d="M14.5 5.5 8 12l6.5 6.5"/>'],
  chevR: ['stroke', '<path d="M9.5 5.5 16 12l-6.5 6.5"/>'],
  bell: ['stroke', '<path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 5.5 1.8 5.5H4.2S6 14 6 9.5z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>'],
  sound: ['stroke', '<path d="M4 9.5v5h3l4 3.5v-12L7 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>'],
  edit: ['stroke', '<path d="M4 20h4L18.5 9.5l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'],
  gift: ['stroke', '<rect x="4" y="9.5" width="16" height="10.5" rx="1.6"/><path d="M4 13h16M12 9.5V20"/><path d="M12 9.5C11 7 9 5.5 7.6 6.6 6.4 7.6 8.6 9.5 12 9.5z"/><path d="M12 9.5c1-2.5 3-4 4.4-2.9 1.2 1-.9 2.9-4.4 2.9z"/>'],
  shield: ['stroke', '<path d="M12 3.2 19 6v5.2c0 4.8-3 7.7-7 9.6-4-1.9-7-4.8-7-9.6V6z"/><path d="M9 12l2.2 2.2L15.4 10"/>'],
  offline: ['stroke', '<rect x="6.5" y="3" width="11" height="18" rx="2.5"/><path d="M10.5 18h3"/>'],
  download: ['stroke', '<path d="M12 4v10M8 10.5l4 4 4-4"/><path d="M5 19.5h14"/>'],
  trash: ['stroke', '<path d="M5 7h14M9.5 7V4.8h5V7M6.5 7l1 12.5h9L17.5 7"/>'],
  chat: ['stroke', '<path d="M21 6.5v8a2 2 0 0 1-2 2h-7l-4.5 3.5V16.5H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'],
  crown: ['fill', '<path d="M4 8.5 7.5 12 12 5.5 16.5 12 20 8.5 18.5 18h-13z"/>'],
  sparkle: ['fill', '<path d="M12 3.5c1 5.8 2.7 7.5 8.5 8.5-5.8 1-7.5 2.7-8.5 8.5-1-5.8-2.7-7.5-8.5-8.5 5.8-1 7.5-2.7 8.5-8.5z"/>'],
  sprout: ['stroke', '<path d="M12 20v-7M12 13c0-3 2.5-5 6-5 0 3-2.5 5-6 5zM12 13c0-2.6-2.2-4.5-5.5-4.5C6.5 11 8.7 13 12 13z"/>'],
  trophy: ['stroke', '<path d="M7 4.5h10v3.5a5 5 0 0 1-10 0z"/><path d="M9.5 14.5h5M10.5 18.5h3M12 14.5v4M7 6H4.5v1a3 3 0 0 0 3 3M17 6h2.5v1a3 3 0 0 1-3 3"/>'],
  target: ['stroke', '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>'],
  bag: ['stroke', '<path d="M6 8h12l-.9 12H6.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'],
  shirt: ['stroke', '<path d="M8 4 5 7l2 2 1-1v11h8V8l1 1 2-2-3-3-2 1.5a3 3 0 0 1-4 0z"/>'],
  lock: ['stroke', '<rect x="6" y="10" width="12" height="9" rx="2"/><path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2"/>'],
};

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 16,
  color = colors.ink,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const entry = ICONS[name];
  if (!entry) return null;
  const [kind, inner] = entry;
  const attrs =
    kind === 'stroke'
      ? `fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
      : `fill="currentColor" stroke="none"`;
  const xml = `<svg viewBox="0 0 24 24" ${attrs}>${inner}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} color={color} />;
}
