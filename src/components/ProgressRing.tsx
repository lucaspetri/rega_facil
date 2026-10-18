import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

type Props = {
  progress: number;
  size?: number;
  stroke?: number;
  color: string;
  trackColor?: string;
  label: string;
  caption?: string;
};

/** Anel de progresso estilo Material / Flutter (dois semicírculos). */
export const ProgressRing = ({
  progress,
  size = 118,
  stroke = 11,
  color,
  trackColor,
  label,
  caption,
}: Props) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const p = Math.max(0, Math.min(1, progress));
  const track = trackColor ?? colors.panelDeep;
  const half = size / 2;
  const rightDeg = Math.min(p * 2, 1) * 180;
  const leftDeg = Math.max(p * 2 - 1, 0) * 180;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: stroke,
          borderColor: track,
        }}
      />

      {/* Right semicircle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          overflow: 'hidden',
          left: half,
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: stroke,
            borderColor: color,
            marginLeft: -half,
            transform: [{ rotate: `${rightDeg}deg` }],
          }}
        />
      </View>

      {/* Left semicircle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          overflow: 'hidden',
          left: 0,
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: stroke,
            borderColor: color,
            transform: [{ rotate: `${leftDeg - 180}deg` }],
            opacity: p > 0.5 ? 1 : 0,
          }}
        />
      </View>

      <View
        style={[
          styles.center,
          {
            width: size - stroke * 2 - 4,
            height: size - stroke * 2 - 4,
            borderRadius: half,
            backgroundColor: colors.panel,
          },
        ]}
      >
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      zIndex: 2,
    },
    label: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    caption: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
  });
