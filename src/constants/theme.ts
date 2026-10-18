export type ThemeColors = {
  background: string;
  backgroundTop: string;
  backgroundMid: string;
  panel: string;
  panelDeep: string;
  ink: string;
  muted: string;
  leaf: string;
  leafDeep: string;
  accent: string;
  sky: string;
  skyDeep: string;
  water: string;
  waterDeep: string;
  nutrient: string;
  wilted: string;
  warning: string;
  white: string;
  border: string;
  shadow: string;
  headerText: string;
  headerMuted: string;
  dangerBg: string;
  dangerBorder: string;
  speciesActiveBg: string;
  overdueBg: string;
  overdueBorder: string;
  dueBg: string;
  dueBorder: string;
  soonBg: string;
  soonBorder: string;
  okBg: string;
  okBorder: string;
};

export const lightColors: ThemeColors = {
  background: '#f3f1ec',
  backgroundTop: '#f3f1ec',
  backgroundMid: '#f3f1ec',
  panel: '#ffffff',
  panelDeep: '#ebe7df',
  ink: '#1a1814',
  muted: '#5c574e',
  leaf: '#5f7d4e',
  leafDeep: '#3f5a32',
  accent: '#3f5a32',
  sky: '#d9e4f0',
  skyDeep: '#4a6d8c',
  water: '#4a6d8c',
  waterDeep: '#355572',
  nutrient: '#3f5a32',
  wilted: '#b54535',
  warning: '#9a6b24',
  white: '#ffffff',
  border: '#ddd6ca',
  shadow: '#1a181418',
  headerText: '#1a1814',
  headerMuted: '#5c574e',
  dangerBg: '#f8ddd6',
  dangerBorder: '#efb3a6',
  speciesActiveBg: '#e4ecdf',
  overdueBg: '#f6e2de',
  overdueBorder: '#e2b4ab',
  dueBg: '#e4eef6',
  dueBorder: '#b7c9da',
  soonBg: '#efece6',
  soonBorder: '#ddd6ca',
  okBg: '#e8efe4',
  okBorder: '#c5d4bc',
};

export const darkColors: ThemeColors = {
  background: '#141612',
  backgroundTop: '#141612',
  backgroundMid: '#141612',
  panel: '#1e211c',
  panelDeep: '#2a2e28',
  ink: '#eceae4',
  muted: '#9a968c',
  leaf: '#8aab76',
  leafDeep: '#a3c48c',
  accent: '#a3c48c',
  sky: '#243040',
  skyDeep: '#7aa3c4',
  water: '#7aa3c4',
  waterDeep: '#5f8fb3',
  nutrient: '#a3c48c',
  wilted: '#e07060',
  warning: '#d4a45a',
  white: '#ffffff',
  border: '#3a3f38',
  shadow: '#00000055',
  headerText: '#eceae4',
  headerMuted: '#9a968c',
  dangerBg: '#3a221e',
  dangerBorder: '#7a4038',
  speciesActiveBg: '#2a3526',
  overdueBg: '#3a221e',
  overdueBorder: '#7a4038',
  dueBg: '#1e2a35',
  dueBorder: '#3a5570',
  soonBg: '#2a2e28',
  soonBorder: '#3a3f38',
  okBg: '#243028',
  okBorder: '#3f5540',
};

/** @deprecated Use useThemeColors() — kept for bootstrap loading only */
export const colors = lightColors;

export const getColors = (darkMode: boolean): ThemeColors =>
  darkMode ? darkColors : lightColors;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export const radii = {
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const fontFamilies = {
  pixel: 'PressStart2P',
} as const;
