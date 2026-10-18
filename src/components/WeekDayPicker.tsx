import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, type ThemeColors } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { WEEKDAY_LABELS, type Weekday } from '../models';

type Props = {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
};

export const WeekDayPicker = ({ value, onChange }: Props) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toggle = (day: Weekday) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  return (
    <View style={styles.row}>
      {WEEKDAY_LABELS.map((day) => {
        const active = value.includes(day.value);
        return (
          <Pressable
            key={day.value}
            onPress={() => toggle(day.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{day.short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      minWidth: 42,
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
    },
    chipActive: {
      backgroundColor: colors.leafDeep,
      borderColor: colors.leafDeep,
    },
    text: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
    },
    textActive: {
      color: colors.white,
    },
  });
