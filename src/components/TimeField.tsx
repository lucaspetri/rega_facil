import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { parseWaterTime } from '../care';
import { radii, type ThemeColors } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

const toDate = (value: string): Date => {
  const { hour, minute } = parseWaterTime(value);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};

const toHHmm = (date: Date): string => {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

/** Seletor nativo de horário (HH:mm). */
export const TimeField = ({ value, onChange, label = 'Horário do lembrete' }: Props) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const dateValue = useMemo(() => toDate(value), [value]);

  const onPick = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type !== 'set' || !selected) return;
      onChange(toHHmm(selected));
      return;
    }
    if (selected) onChange(toHHmm(selected));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.button} onPress={() => setOpen(true)}>
        <Text style={styles.value}>{value || '09:00'}</Text>
      </Pressable>

      {open ? (
        <DateTimePicker
          value={dateValue}
          mode="time"
          is24Hour={true}
          locale="pt-BR"
          // Evita picker material no formato AM/PM de locale US
          {...(Platform.OS === 'android' ? { design: 'default' as const } : {})}
          display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
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
      fontSize: 18,
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
