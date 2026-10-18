import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { radii, type ThemeColors } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  label?: string;
  minimumDate?: Date;
};

const startOfLocalDay = (ts: number): Date => {
  const d = new Date(ts);
  d.setHours(9, 0, 0, 0);
  return d;
};

export const formatPlantDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/** Seletor nativo de data. */
export const DateField = ({
  value,
  onChange,
  label = 'Data',
  minimumDate,
}: Props) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const dateValue = useMemo(
    () => (value != null ? startOfLocalDay(value) : startOfLocalDay(Date.now())),
    [value],
  );

  const onPick = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type !== 'set' || !selected) return;
      const next = new Date(selected);
      next.setHours(9, 0, 0, 0);
      onChange(next.getTime());
      return;
    }
    if (selected) {
      const next = new Date(selected);
      next.setHours(9, 0, 0, 0);
      onChange(next.getTime());
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.button} onPress={() => setOpen(true)}>
        <Text style={styles.value}>
          {value != null ? formatPlantDate(value) : 'Escolher data'}
        </Text>
      </Pressable>

      {open ? (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate ?? new Date()}
          onChange={onPick}
        />
      ) : null}

      {Platform.OS === 'ios' && open ? (
        <Pressable style={styles.done} onPress={() => setOpen(false)}>
          <Text style={styles.doneText}>OK</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    label: { fontWeight: '700', color: colors.ink, fontSize: 14 },
    button: {
      backgroundColor: colors.panel,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    value: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: '700',
    },
    hintInline: { fontSize: 12, color: colors.muted },
    done: {
      alignSelf: 'flex-end',
      backgroundColor: colors.leafDeep,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    doneText: { color: colors.white, fontWeight: '700' },
  });
