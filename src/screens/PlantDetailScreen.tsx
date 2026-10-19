import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BannerAdSlot } from '../components/BannerAdSlot';
import { DateField } from '../components/DateField';
import { PlantAvatar } from '../components/PlantAvatar';
import { TimeField } from '../components/TimeField';
import { WeekDayPicker } from '../components/WeekDayPicker';
import {
  addDays,
  buildAlert,
  formatDateTime,
  formatFertilizeSchedule,
  formatRelativeDue,
  formatWaterDueLabel,
  formatWaterSchedule,
  urgencyLabel,
  wasDoneToday,
  waterActionLabel,
} from '../care';
import { radii, spacing, type ThemeColors } from '../constants/theme';
import { useCopilot } from '../context/CopilotContext';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  CARE_ACTION_LABELS,
  DEFAULT_WATER_TIME,
  type CareActionType,
  type Weekday,
} from '../models';
import type { RootStackParamList } from '../navigation/types';
import { getSpecies } from '../species';
import { formatShortDate } from '../utils/careStats';
import { promptPlantImage } from '../utils/pickPlantImage';

const CARE_OPTIONS: CareActionType[] = ['water', 'fertilize', 'repot', 'pest', 'prune', 'other'];

export const PlantDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'PlantDetail'>>();
  const { getPlant, getLogsForPlant, logCare, updatePlant, removePlant, state } = useCopilot();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const plant = getPlant(route.params.plantId);
  const allLogs = getLogsForPlant(route.params.plantId);
  const logs = allLogs.slice(0, 20);

  const [note, setNote] = useState('');
  const [action, setAction] = useState<CareActionType>('water');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingWater, setEditingWater] = useState(false);
  const [editDays, setEditDays] = useState<Weekday[]>([]);
  const [editTime, setEditTime] = useState(DEFAULT_WATER_TIME);
  const [editingFert, setEditingFert] = useState(false);
  const [editFertEnabled, setEditFertEnabled] = useState(false);
  const [editFertDueAt, setEditFertDueAt] = useState<number>(addDays(Date.now(), 30));
  const [editFertNote, setEditFertNote] = useState('');
  const [draftPlantNote, setDraftPlantNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const actionLabel = useMemo(() => CARE_ACTION_LABELS[action], [action]);

  if (!plant) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Text style={styles.ink}>Planta não encontrada</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const species = getSpecies(plant.speciesId);
  const water = buildAlert(plant, 'water');
  const fert = buildAlert(plant, 'fertilize');
  const hasFertSchedule = plant.fertilizeDueAt != null;
  const wateredToday = wasDoneToday(plant.lastWateredAt);
  const needsWater = water.urgency === 'overdue' || water.urgency === 'due';
  const alertColor = needsWater
    ? water.urgency === 'overdue'
      ? colors.wilted
      : colors.waterDeep
    : wateredToday
      ? colors.leafDeep
      : colors.muted;

  const heroGradient = state.darkMode
    ? (['#1a2420', '#141612', colors.background] as const)
    : (['#d8ebd0', '#e8f2e4', colors.background] as const);

  const waterHeadline = wateredToday
    ? 'Regada hoje'
    : water.urgency === 'overdue'
      ? 'Rega atrasada'
      : water.urgency === 'due'
        ? 'Regar hoje'
        : `Próxima rega ${formatRelativeDue(water.dueAt)}`;

  const fertHeadline = !hasFertSchedule
    ? null
    : fert.urgency === 'overdue'
      ? 'Adubação atrasada'
      : fert.urgency === 'due'
        ? 'Adubar hoje'
        : `Próximo adubo ${formatRelativeDue(fert.dueAt)}`;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const openFertEditor = () => {
    setEditFertEnabled(plant.fertilizeDueAt != null);
    setEditFertDueAt(plant.fertilizeDueAt ?? addDays(Date.now(), 30));
    setEditFertNote(plant.fertilizeNote || '');
    setEditingFert(true);
  };

  const saveFertSchedule = () => {
    updatePlant(plant.id, {
      fertilizeDueAt: editFertEnabled ? editFertDueAt : null,
      fertilizeNote: editFertEnabled ? editFertNote : '',
    });
    setEditingFert(false);
    flash(editFertEnabled ? 'Adubação agendada' : 'Agenda de adubação removida');
  };

  const addPlantNote = () => {
    const trimmed = draftPlantNote.trim();
    if (!trimmed) return;
    updatePlant(plant.id, { notes: [...plant.notes, trimmed] });
    setDraftPlantNote('');
    flash('Nota adicionada');
  };

  const removePlantNote = (index: number) => {
    updatePlant(plant.id, { notes: plant.notes.filter((_, i) => i !== index) });
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <LinearGradient colors={[...heroGradient]} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topBar}>
            <Pressable style={styles.iconChip} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.ink} />
            </Pressable>
            <Pressable
              style={styles.iconChip}
              onPress={() =>
                Alert.alert('Remover planta', `Remover ${plant.name}?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => {
                      removePlant(plant.id);
                      navigation.goBack();
                    },
                  },
                ])
              }
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.wilted} />
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <Pressable
              onPress={() =>
                promptPlantImage((uri) => {
                  updatePlant(plant.id, { imageUri: uri });
                  flash(uri ? 'Foto atualizada' : 'Visual padrão restaurado');
                }, true)
              }
              style={styles.avatarWrap}
            >
              <View style={styles.avatarGlow}>
                <PlantAvatar
                  speciesId={plant.speciesId}
                  imageUri={plant.imageUri}
                  size={108}
                  round
                />
              </View>
              <View style={styles.cameraBadge}>
                <MaterialCommunityIcons name="camera-outline" size={14} color={colors.white} />
              </View>
            </Pressable>

            <Text style={styles.title}>{plant.name}</Text>
            <Text style={styles.subtitle}>
              {species.label}
              {plant.location ? ` · ${plant.location}` : ''}
            </Text>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: needsWater
                      ? colors.overdueBg
                      : wateredToday
                        ? colors.okBg
                        : colors.dueBg,
                  },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: alertColor }]} />
                <Text style={[styles.statusText, { color: alertColor }]}>
                  {wateredToday ? 'Em dia' : urgencyLabel(water.urgency)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Alertas — foco: próxima e se já regou */}
          <View style={styles.dashCard}>
            <View style={[styles.alertRow, needsWater && styles.alertRowHot]}>
              <View
                style={[
                  styles.alertIcon,
                  {
                    backgroundColor: needsWater
                      ? colors.overdueBg
                      : wateredToday
                        ? colors.okBg
                        : colors.dueBg,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={wateredToday ? 'check-circle' : 'water'}
                  size={22}
                  color={alertColor}
                />
              </View>
              <View style={styles.alertText}>
                <Text style={[styles.alertTitle, { color: alertColor }]}>{waterHeadline}</Text>
                <Text style={styles.alertSub}>
                  {wateredToday
                    ? `Última rega: ${formatShortDate(plant.lastWateredAt)} · ${formatWaterSchedule(plant)}`
                    : needsWater
                      ? `Agenda: ${formatWaterSchedule(plant)}`
                      : `Falta ${formatRelativeDue(water.dueAt).replace(/^em /, '')} · ${formatWaterSchedule(plant)}`}
                </Text>
              </View>
            </View>

            {fertHeadline ? (
              <View
                style={[
                  styles.alertRow,
                  (fert.urgency === 'overdue' || fert.urgency === 'due') && styles.alertRowHot,
                ]}
              >
                <View
                  style={[
                    styles.alertIcon,
                    {
                      backgroundColor:
                        fert.urgency === 'overdue' || fert.urgency === 'due'
                          ? colors.overdueBg
                          : colors.okBg,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="leaf"
                    size={22}
                    color={
                      fert.urgency === 'overdue' || fert.urgency === 'due'
                        ? colors.wilted
                        : colors.leafDeep
                    }
                  />
                </View>
                <View style={styles.alertText}>
                  <Text
                    style={[
                      styles.alertTitle,
                      {
                        color:
                          fert.urgency === 'overdue' || fert.urgency === 'due'
                            ? colors.wilted
                            : colors.leafDeep,
                      },
                    ]}
                  >
                    {fertHeadline}
                  </Text>
                  <Text style={styles.alertSub}>
                    {formatFertilizeSchedule(plant)}
                    {plant.fertilizeNote ? ` · ${plant.fertilizeNote}` : ''}
                  </Text>
                </View>
              </View>
            ) : null}

            <Pressable
              style={styles.waterCta}
              onPress={() => {
                logCare(plant.id, 'water');
                flash('Rega registrada');
              }}
            >
              <LinearGradient
                colors={
                  wateredToday
                    ? [colors.leaf, colors.leafDeep]
                    : [colors.water, colors.waterDeep]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.waterCtaGrad}
              >
                <MaterialCommunityIcons name="watering-can" size={22} color={colors.white} />
                <Text style={styles.waterCtaText}>{waterActionLabel(plant)}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Water schedule */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.iconBubble, { backgroundColor: colors.dueBg }]}>
                  <MaterialCommunityIcons name="water" size={18} color={colors.waterDeep} />
                </View>
                <Text style={styles.sectionTitle}>Rega</Text>
              </View>
              <Pressable
                onPress={() => {
                  if (editingWater) {
                    setEditingWater(false);
                    return;
                  }
                  setEditDays([...plant.waterDays]);
                  setEditTime(plant.waterTime || DEFAULT_WATER_TIME);
                  setEditingWater(true);
                }}
              >
                <Text style={styles.link}>{editingWater ? 'Cancelar' : 'Editar'}</Text>
              </Pressable>
            </View>

            {!editingWater ? (
              <View style={styles.infoBlock}>
                <Text style={styles.infoMain}>{formatWaterSchedule(plant)}</Text>
                <Text style={styles.infoSub}>{formatWaterDueLabel(water)}</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={styles.infoSub}>
                  Dias da semana e horário do lembrete no celular.
                </Text>
                <Text style={styles.fieldLabel}>Dias da semana</Text>
                <WeekDayPicker value={editDays} onChange={setEditDays} />
                {editDays.length === 0 ? (
                  <Text style={styles.warn}>Selecione pelo menos um dia.</Text>
                ) : null}
                <TimeField
                  value={editTime}
                  onChange={setEditTime}
                  label="Horário do lembrete"
                />
                <Pressable
                  style={[styles.cta, editDays.length === 0 && styles.ctaDisabled]}
                  onPress={() => {
                    if (editDays.length === 0) return;
                    updatePlant(plant.id, {
                      waterDays: editDays,
                      waterTime: editTime || DEFAULT_WATER_TIME,
                    });
                    setEditingWater(false);
                    flash('Rega atualizada');
                  }}
                >
                  <Text style={styles.ctaText}>Salvar lembrete de rega</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Fertilize */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.iconBubble, { backgroundColor: colors.okBg }]}>
                  <MaterialCommunityIcons name="flask-outline" size={18} color={colors.leafDeep} />
                </View>
                <Text style={styles.sectionTitle}>Adubação</Text>
              </View>
              {!editingFert ? (
                <Pressable onPress={openFertEditor}>
                  <Text style={styles.link}>{hasFertSchedule ? 'Editar' : 'Agendar'}</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => setEditingFert(false)}>
                  <Text style={styles.link}>Cancelar</Text>
                </Pressable>
              )}
            </View>

            {!editingFert ? (
              <View style={styles.infoBlock}>
                {hasFertSchedule ? (
                  <>
                    <Text style={styles.infoMain}>
                      Agendada para {formatFertilizeSchedule(plant)}
                    </Text>
                    {plant.fertilizeNote ? (
                      <Text style={styles.infoSub}>{plant.fertilizeNote}</Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.infoSub}>Nenhuma adubação agendada</Text>
                )}
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={styles.infoSub}>
                  Lembrete único na data escolhida. Desligue para remover a agenda.
                </Text>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Lembrar de adubar</Text>
                  </View>
                  <Switch
                    value={editFertEnabled}
                    onValueChange={(v) => {
                      setEditFertEnabled(v);
                      if (v && !editFertDueAt) {
                        setEditFertDueAt(addDays(Date.now(), 30));
                      }
                    }}
                    trackColor={{ false: colors.border, true: colors.leaf }}
                    thumbColor={colors.white}
                  />
                </View>

                {editFertEnabled ? (
                  <>
                    <DateField
                      value={editFertDueAt}
                      onChange={setEditFertDueAt}
                      label="Data do lembrete"
                    />
                    <Text style={styles.fieldLabel}>Qual adubo? (opcional)</Text>
                    <TextInput
                      value={editFertNote}
                      onChangeText={setEditFertNote}
                      placeholder="Ex.: NPK 10-10-10"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                    />
                  </>
                ) : null}

                <Pressable style={styles.cta} onPress={saveFertSchedule}>
                  <Text style={styles.ctaText}>
                    {editFertEnabled ? 'Salvar adubação' : 'Remover agenda'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBubble, { backgroundColor: colors.soonBg }]}>
                <MaterialCommunityIcons name="note-text-outline" size={18} color={colors.warning} />
              </View>
              <Text style={styles.sectionTitle}>Notas</Text>
            </View>
            {plant.notes.map((n, index) => (
              <View key={`${index}-${n.slice(0, 12)}`} style={styles.noteRow}>
                <Text style={styles.noteText}>{n}</Text>
                <Pressable onPress={() => removePlantNote(index)}>
                  <MaterialCommunityIcons name="close" size={18} color={colors.muted} />
                </Pressable>
              </View>
            ))}
            <TextInput
              value={draftPlantNote}
              onChangeText={setDraftPlantNote}
              placeholder="Escreva uma nota"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textarea]}
              multiline
            />
            <Pressable
              style={[styles.secondaryCta, !draftPlantNote.trim() && styles.ctaDisabled]}
              onPress={addPlantNote}
              disabled={!draftPlantNote.trim()}
            >
              <Text style={styles.secondaryCtaText}>Adicionar</Text>
            </Pressable>
          </View>

          {/* Other care */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBubble, { backgroundColor: colors.panelDeep }]}>
                <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.ink} />
              </View>
              <Text style={styles.sectionTitle}>Outros cuidados</Text>
            </View>
            <Text style={styles.fieldLabel}>Tipo</Text>
            <Pressable style={styles.dropdown} onPress={() => setPickerOpen(true)}>
              <Text style={styles.dropdownText}>{actionLabel}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.muted} />
            </Pressable>
            <Text style={styles.fieldLabel}>Nota</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Nota"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textarea]}
              multiline
            />
            <Pressable
              style={styles.cta}
              onPress={() => {
                logCare(plant.id, action, note);
                setNote('');
                flash(`${CARE_ACTION_LABELS[action]} registrada`);
              }}
            >
              <Text style={styles.ctaText}>Salvar</Text>
            </Pressable>
          </View>

          {/* History */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBubble, { backgroundColor: colors.panelDeep }]}>
                <MaterialCommunityIcons name="history" size={18} color={colors.ink} />
              </View>
              <Text style={styles.sectionTitle}>Histórico</Text>
            </View>
            {logs.length === 0 ? (
              <Text style={styles.infoSub}>Nenhum registro</Text>
            ) : (
              logs.map((log, idx) => (
                <View
                  key={log.id}
                  style={[styles.log, idx === 0 && styles.logFirst]}
                >
                  <View style={styles.logIcon}>
                    <MaterialCommunityIcons
                      name={
                        log.type === 'water'
                          ? 'water'
                          : log.type === 'fertilize'
                            ? 'leaf'
                            : 'checkbox-marked-circle-outline'
                      }
                      size={16}
                      color={log.type === 'water' ? colors.waterDeep : colors.leafDeep}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.topRow}>
                      <Text style={styles.bold}>{CARE_ACTION_LABELS[log.type]}</Text>
                      <Text style={styles.metaSmall}>{formatDateTime(log.at)}</Text>
                    </View>
                    {log.note ? <Text style={styles.infoSub}>{log.note}</Text> : null}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Escolher cuidado</Text>
            {CARE_OPTIONS.map((type) => (
              <Pressable
                key={type}
                style={[styles.optionRow, action === type && styles.optionActive]}
                onPress={() => {
                  setAction(type);
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.optionText}>{CARE_ACTION_LABELS[type]}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {toast ? (
        <View style={[styles.toast, { bottom: 70 + insets.bottom }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <BannerAdSlot />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
    hero: {
      paddingBottom: 28,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      marginBottom: 8,
    },
    iconChip: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.panel,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    heroBody: { alignItems: 'center', paddingHorizontal: spacing.md, gap: 8 },
    avatarWrap: { marginBottom: 4 },
    avatarGlow: {
      padding: 5,
      borderRadius: 999,
      backgroundColor: colors.panel,
      shadowColor: colors.leafDeep,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    cameraBadge: {
      position: 'absolute',
      right: 4,
      bottom: 4,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.leafDeep,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.panel,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.ink,
      letterSpacing: -0.6,
      marginTop: 4,
    },
    subtitle: { color: colors.muted, fontSize: 15, fontWeight: '600' },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
      marginTop: 6,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    body: {
      paddingHorizontal: spacing.md,
      gap: 14,
      marginTop: -10,
    },
    dashCard: {
      backgroundColor: colors.panel,
      borderRadius: 24,
      padding: 16,
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: 0.07,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    alertRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    alertRowHot: {
      backgroundColor: colors.overdueBg,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
    },
    alertIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    alertText: { flex: 1, gap: 3 },
    alertTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    alertSub: { fontSize: 13, color: colors.muted, lineHeight: 18, fontWeight: '600' },
    waterCta: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
    waterCtaGrad: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 14,
    },
    waterCtaText: { color: colors.white, fontWeight: '800', fontSize: 16 },
    card: {
      backgroundColor: colors.panel,
      borderRadius: 22,
      padding: 16,
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBubble: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
    sectionHint: { fontSize: 13, color: colors.muted, marginTop: 2 },
    chartBadge: {
      backgroundColor: colors.panelDeep,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    chartBadgeText: { fontSize: 12, fontWeight: '800', color: colors.muted },
    infoBlock: { gap: 4 },
    infoMain: { fontSize: 15, fontWeight: '700', color: colors.ink },
    infoSub: { fontSize: 13, color: colors.muted, lineHeight: 19 },
    warn: { color: colors.wilted, fontSize: 13, fontWeight: '700' },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    link: { color: colors.leafDeep, fontWeight: '700', fontSize: 14 },
    ink: { color: colors.ink, fontWeight: '600' },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.ink },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.panelDeep,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    dropdownText: { fontSize: 15, fontWeight: '600', color: colors.ink },
    bold: { fontWeight: '700', color: colors.ink, fontSize: 14 },
    metaSmall: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    input: {
      backgroundColor: colors.panelDeep,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.ink,
      fontSize: 15,
    },
    textarea: { minHeight: 70, textAlignVertical: 'top' },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.panelDeep,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    noteText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 },
    secondaryCta: {
      borderRadius: radii.md,
      backgroundColor: colors.panelDeep,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryCtaText: { color: colors.leafDeep, fontWeight: '700', fontSize: 14 },
    cta: {
      backgroundColor: colors.leafDeep,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
    },
    ctaDisabled: { opacity: 0.45 },
    ctaText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    log: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    logFirst: { borderTopWidth: 0, paddingTop: 0 },
    logIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.panelDeep,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(18,24,18,0.55)',
      justifyContent: 'flex-end',
      padding: 16,
    },
    modalCard: {
      backgroundColor: colors.panel,
      borderRadius: 22,
      padding: 16,
      gap: 4,
    },
    optionRow: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: radii.md,
    },
    optionActive: { backgroundColor: colors.panelDeep },
    optionText: { fontSize: 15, fontWeight: '600', color: colors.ink },
    toast: {
      position: 'absolute',
      alignSelf: 'center',
      backgroundColor: colors.ink,
      borderRadius: radii.md,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    toastText: { fontWeight: '700', color: colors.white },
  });
