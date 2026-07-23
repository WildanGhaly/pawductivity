// Design tokens ported 1:1 from prototype/pawductivity_v1.html :root
// Single source of truth for colors, spacing, radii, shadows, typography.

export const colors = {
  teal: '#0C4C60',
  teal2: '#12667F',
  tealInk: '#0B2530',
  orange: '#E28A4B',
  orange2: '#C9773A',
  yellow: '#FFDA7C',
  yellow2: '#F4B942',
  coinInk: '#1E4B5F',
  ink: '#2D2F41',
  muted: '#8B897E',
  cream: '#FBF6EC',
  card: '#FFFFFF',
  line: '#EFE6D6',
  line2: '#E4D8C2',
  grass: '#A7C34F',
  sky: '#BFE3F3',
  wall: '#A0B559',
  floor: '#DCC79A',
  good: '#1E7F91',
  danger: '#E5654B',
  pink: '#E68FB0',
  white: '#FFFFFF',
  // backdrop behind the phone frame
  backdrop: '#0b3543',
} as const;

// category dots (quest tags)
export const catColors: Record<string, string> = {
  Work: '#6E8BA0',
  School: '#C79350',
  Sport: '#6FA06B',
  Personal: '#B07E9A',
  Project: '#8580B0',
};

// mood dots
export const moodColors: Record<string, string> = {
  happy: '#1E7F91',
  content: '#E9B24C',
  tired: '#C79350',
  hungry: '#D98C6A',
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

export const NAV_H = 74;

// react-native shadow presets approximating the CSS box-shadows
export const shadow = {
  card: {
    shadowColor: '#0C4C60',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  sm: {
    shadowColor: '#0C4C60',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

// The prototype ships only Regular + Bold ttf (assets/Poppins-*.ttf). We expose those
// two families and map design weights onto them: 600+ -> Bold, else Regular. This keeps
// heading/button emphasis without shipping font files the repo does not contain.
export const font = {
  regular: 'Poppins-Regular',
  bold: 'Poppins-Bold',
} as const;

export const fontFor = (weight: 400 | 500 | 600 | 700 | 800): string =>
  weight >= 600 ? font.bold : font.regular;
