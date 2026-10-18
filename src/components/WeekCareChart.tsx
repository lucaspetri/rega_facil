import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import type { DayBar } from '../utils/careStats';

type Props = {
  bars: DayBar[];
  accent?: string;
};

const MAX_H = 72;

export const WeekCareChart = ({ bars, accent }: Props) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const barColor = accent ?? colors.waterDeep;
  const max = Math.max(1, ...bars.map((b) => b.count));

  return (
    <View style={styles.wrap}>
      <View style={styles.chart}>
        {bars.map((bar) => {
          const h = bar.count === 0 ? 6 : Math.max(10, (bar.count / max) * MAX_H);
          return (
            <View key={bar.key} style={styles.col}>
              <Text style={styles.count}>{bar.count > 0 ? bar.count : ''}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: h,
                      backgroundColor: bar.isToday ? barColor : colors.panelDeep,
                      opacity: bar.count === 0 ? 0.55 : 1,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.day, bar.isToday && { color: barColor, fontWeight: '800' }]}>
                {bar.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { width: '100%' },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 6,
      paddingTop: 4,
    },
    col: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    count: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.muted,
      height: 14,
    },
    barTrack: {
      height: MAX_H,
      width: '100%',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    bar: {
      width: '72%',
      maxWidth: 28,
      borderRadius: 10,
      minHeight: 6,
    },
    day: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
    },
  });
