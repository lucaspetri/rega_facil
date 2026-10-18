import { useMemo } from 'react';

import { getColors, type ThemeColors } from '../constants/theme';
import { useCopilot } from '../context/CopilotContext';

export const useThemeColors = (): ThemeColors => {
  const { state } = useCopilot();
  return useMemo(() => getColors(state.darkMode), [state.darkMode]);
};
