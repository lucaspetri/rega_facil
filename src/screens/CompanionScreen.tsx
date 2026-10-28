import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { wasDoneToday } from '../care';
import { radii, spacing, type ThemeColors } from '../constants/theme';
import { useCopilot } from '../context/CopilotContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { COMPANION_NAME } from '../models';

export const CompanionScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { state, waterCompanion } = useCopilot();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const watered = wasDoneToday(state.companion.lastWateredAt);
  const [toast, setToast] = useState<string | null>(null);

  const water = () => {
    if (watered) {
      setToast(`${COMPANION_NAME} já foi regada hoje`);
      return;
    }
    waterCompanion();
    setToast(`${COMPANION_NAME} regada`);
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={22} color={colors.ink} />
        <Text style={styles.backText}>Voltar</Text>
      </Pressable>

      <View style={styles.body}>
        <View style={[styles.square, { backgroundColor: watered ? colors.leafDeep : colors.waterDeep }]} />
        <Text style={styles.name}>{COMPANION_NAME}</Text>
        <Text style={styles.hint}>A plantinha da casa</Text>
        <Text style={[styles.status, { color: watered ? colors.leafDeep : colors.waterDeep }]}>
          {watered ? 'Regada hoje' : 'Quer água'}
        </Text>

        <Pressable style={[styles.waterBtn, watered && styles.waterBtnDone]} onPress={water}>
          <MaterialCommunityIcons name="watering-can" size={18} color={colors.white} />
          <Text style={styles.waterBtnText}>{watered ? 'Reguei' : 'Regar'}</Text>
        </Pressable>
      </View>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 8,
    },
    backText: { color: colors.ink, fontWeight: '700', fontSize: 16 },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    square: {
      width: 140,
      height: 140,
      borderRadius: radii.lg,
      marginBottom: 8,
    },
    name: { fontSize: 28, fontWeight: '800', color: colors.ink },
    hint: { fontSize: 15, fontWeight: '600', color: colors.muted },
    status: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    waterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.waterDeep,
      borderRadius: 999,
      paddingHorizontal: 22,
      paddingVertical: 12,
    },
    waterBtnDone: { backgroundColor: colors.leafDeep },
    waterBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
    toast: {
      position: 'absolute',
      alignSelf: 'center',
      bottom: 28,
      backgroundColor: colors.ink,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    toastText: { color: colors.white, fontWeight: '700' },
  });
