import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { urgencyLabel } from '../care';
import type { ThemeColors } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import type { CareUrgency } from '../models';

export const UrgencyChip = ({ urgency }: { urgency: CareUrgency }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tone = {
    overdue: { bg: colors.overdueBg, fg: colors.wilted, border: colors.overdueBorder },
    due: { bg: colors.dueBg, fg: colors.waterDeep, border: colors.dueBorder },
    soon: { bg: colors.soonBg, fg: colors.muted, border: colors.soonBorder },
    ok: { bg: colors.okBg, fg: colors.leafDeep, border: colors.okBorder },
  }[urgency];

  return (
    <View style={[styles.chip, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{urgencyLabel(urgency)}</Text>
    </View>
  );
};

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    chip: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    text: {
      fontSize: 11,
      fontWeight: '700',
    },
  });
