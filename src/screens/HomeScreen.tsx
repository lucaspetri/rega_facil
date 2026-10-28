import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlantAvatar } from '../components/PlantAvatar';
import {
  buildAlert,
  formatWaterDueLabel,
  formatWaterSchedule,
  wasDoneToday,
  waterActionLabel,
} from '../care';
import { radii, spacing, type ThemeColors } from '../constants/theme';
import { useCopilot } from '../context/CopilotContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { COMPANION_NAME, type CareUrgency, type Plant } from '../models';
import type { RootStackParamList } from '../navigation/types';

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, logCare, setHomeLayout } = useCopilot();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [toast, setToast] = useState<string | null>(null);
  const isGrid = state.homeLayout !== 'list';

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const waterOne = (plantId: string, name: string) => {
    logCare(plantId, 'water');
    flash(`${name} regada`);
  };

  const waterAll = () => {
    if (state.plants.length === 0) return;
    const pending = state.plants.filter((p) => !wasDoneToday(p.lastWateredAt));
    if (pending.length === 0) {
      flash('Todas já regadas hoje');
      return;
    }
    pending.forEach((p) => logCare(p.id, 'water'));
    flash(`Regadas (${pending.length})`);
  };

  const allWateredToday =
    state.plants.length > 0 && state.plants.every((p) => wasDoneToday(p.lastWateredAt));

  const urgencyTone = (urgency: CareUrgency) => {
    switch (urgency) {
      case 'overdue':
        return { bg: colors.overdueBg, border: colors.overdueBorder, fg: colors.wilted };
      case 'due':
        return { bg: colors.dueBg, border: colors.dueBorder, fg: colors.waterDeep };
      case 'soon':
        return { bg: colors.soonBg, border: colors.soonBorder, fg: colors.muted };
      default:
        return { bg: colors.okBg, border: colors.okBorder, fg: colors.leafDeep };
    }
  };

  const renderGridPlant = (plant: Plant) => {
    const water = buildAlert(plant, 'water');
    const tone = urgencyTone(water.urgency);
    return (
      <View key={plant.id} style={[styles.tile, { borderColor: tone.border }]}>
        <Pressable
          style={styles.tileMain}
          onPress={() => navigation.navigate('PlantDetail', { plantId: plant.id })}
        >
          <View style={[styles.ring, { backgroundColor: tone.bg }]}>
            <PlantAvatar
              speciesId={plant.speciesId}
              imageUri={plant.imageUri}
              size={88}
              round
            />
          </View>
          <Text style={styles.tileName} numberOfLines={1}>
            {plant.name}
          </Text>
          <Text style={styles.tileMeta} numberOfLines={1}>
            {formatWaterSchedule(plant)}
          </Text>
          <Text style={[styles.tileDue, { color: tone.fg }]}>
            {formatWaterDueLabel(water)}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.waterBtn,
            wasDoneToday(plant.lastWateredAt) && styles.waterBtnDone,
          ]}
          onPress={() => waterOne(plant.id, plant.name)}
        >
          <MaterialCommunityIcons name="watering-can" size={17} color={colors.white} />
          <Text style={styles.waterBtnText}>{waterActionLabel(plant)}</Text>
        </Pressable>
      </View>
    );
  };

  const renderListPlant = (plant: Plant) => {
    const water = buildAlert(plant, 'water');
    const tone = urgencyTone(water.urgency);
    return (
      <View key={plant.id} style={[styles.listRow, { borderColor: tone.border }]}>
        <Pressable
          style={styles.listMain}
          onPress={() => navigation.navigate('PlantDetail', { plantId: plant.id })}
        >
          <View style={[styles.listRing, { backgroundColor: tone.bg }]}>
            <PlantAvatar
              speciesId={plant.speciesId}
              imageUri={plant.imageUri}
              size={56}
              round
            />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listName} numberOfLines={1}>
              {plant.name}
            </Text>
            <Text style={styles.listMeta} numberOfLines={1}>
              {formatWaterSchedule(plant)}
            </Text>
            <Text style={[styles.listDue, { color: tone.fg }]}>
              {formatWaterDueLabel(water)}
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={[
            styles.listWaterBtn,
            wasDoneToday(plant.lastWateredAt) && styles.waterBtnDone,
          ]}
          onPress={() => waterOne(plant.id, plant.name)}
        >
          <MaterialCommunityIcons name="watering-can" size={18} color={colors.white} />
          <Text style={styles.waterBtnText}>{waterActionLabel(plant)}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top + 10 }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
        <View style={styles.toolbar}>
          <Pressable
            style={[styles.waterAllBtn, state.plants.length === 0 && styles.btnDisabled]}
            onPress={waterAll}
            disabled={state.plants.length === 0}
          >
            <MaterialCommunityIcons name="water" size={16} color={colors.waterDeep} />
            <Text style={styles.waterAllText}>
              {allWateredToday ? 'Todas regadas' : 'Regar todas'}
            </Text>
          </Pressable>

          <View style={styles.toolbarRight}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => setHomeLayout(isGrid ? 'list' : 'grid')}
              accessibilityLabel={isGrid ? 'Ver em lista' : 'Ver em grade'}
            >
              <MaterialCommunityIcons
                name={isGrid ? 'view-list-outline' : 'view-grid-outline'}
                size={22}
                color={colors.ink}
              />
            </Pressable>
            <Pressable style={styles.addBtn} onPress={() => navigation.navigate('AddPlant')}>
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
            </Pressable>
          </View>
        </View>

        {state.plants.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhuma planta</Text>
            <Text style={styles.meta}>Toque em + para começar</Text>
          </View>
        ) : isGrid ? (
          <View style={styles.grid}>{state.plants.map(renderGridPlant)}</View>
        ) : (
          <View style={styles.list}>{state.plants.map(renderListPlant)}</View>
        )}
      </ScrollView>

      <Pressable
        style={styles.buddy}
        onPress={() => navigation.navigate('Companion')}
        accessibilityLabel={COMPANION_NAME}
      >
        <View
          style={[
            styles.buddySquare,
            {
              backgroundColor: wasDoneToday(state.companion.lastWateredAt)
                ? colors.leafDeep
                : colors.waterDeep,
            },
          ]}
        />
      </Pressable>

      {toast ? (
        <View style={[styles.toast, { bottom: 96 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: spacing.md,
      gap: 14,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    waterAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.panel,
      borderWidth: 0,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    waterAllText: {
      color: colors.ink,
      fontWeight: '700',
      fontSize: 13,
    },
    btnDisabled: { opacity: 0.4 },
    buddy: {
      position: 'absolute',
      left: 18,
      bottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
    },
    buddySquare: {
      width: 64,
      height: 64,
      borderRadius: 8,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.panel,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.leafDeep,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.leafDeep,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    list: { gap: 10 },
    tile: {
      width: '47.5%',
      backgroundColor: colors.panel,
      borderRadius: 22,
      borderWidth: 0,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    tileMain: {
      alignItems: 'center',
      paddingTop: 16,
      paddingHorizontal: 10,
      paddingBottom: 10,
      gap: 6,
    },
    ring: {
      padding: 6,
      borderRadius: 999,
    },
    tileName: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.ink,
      textAlign: 'center',
      width: '100%',
    },
    tileMeta: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
      textAlign: 'center',
    },
    tileDue: {
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },
    waterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.waterDeep,
      paddingVertical: 10,
    },
    waterBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
    waterBtnDone: { backgroundColor: colors.leafDeep },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.panel,
      borderRadius: 18,
      borderWidth: 0,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    listMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    listRing: { padding: 4, borderRadius: 999 },
    listText: { flex: 1, gap: 2 },
    listName: { fontSize: 16, fontWeight: '800', color: colors.ink },
    listMeta: { fontSize: 12, fontWeight: '600', color: colors.muted },
    listDue: { fontSize: 12, fontWeight: '700' },
    listWaterBtn: {
      alignSelf: 'stretch',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.waterDeep,
      paddingHorizontal: 14,
    },
    empty: {
      backgroundColor: colors.panel,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 22,
      gap: 6,
    },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
    meta: { fontSize: 14, color: colors.muted, lineHeight: 20 },
    toast: {
      position: 'absolute',
      alignSelf: 'center',
      backgroundColor: colors.ink,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    toastText: { color: colors.white, fontWeight: '700' },
  });
