import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BannerAdSlot } from '../components/BannerAdSlot';
import { DateField } from '../components/DateField';
import { PlantAvatar } from '../components/PlantAvatar';
import { TimeField } from '../components/TimeField';
import { WeekDayPicker } from '../components/WeekDayPicker';
import { addDays, formatWaterDays } from '../care';
import { radii, spacing, type ThemeColors } from '../constants/theme';
import { useCopilot } from '../context/CopilotContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { DEFAULT_WATER_DAYS, DEFAULT_WATER_TIME, type Weekday } from '../models';
import type { RootStackParamList } from '../navigation/types';
import { SPECIES_CATALOG } from '../species';
import { promptPlantImage } from '../utils/pickPlantImage';

export const AddPlantScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  /** Tab já tem banner acima da barra; stack (sem tabs) precisa do slot aqui. */
  const showBanner = route.name === 'AddPlant';
  const { addPlant } = useCopilot();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [speciesId, setSpeciesId] = useState(SPECIES_CATALOG[0]!.id);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [notesText, setNotesText] = useState('');
  const [waterDays, setWaterDays] = useState<Weekday[]>([...DEFAULT_WATER_DAYS]);
  const [waterTime, setWaterTime] = useState(DEFAULT_WATER_TIME);
  const [scheduleFertilize, setScheduleFertilize] = useState(false);
  const [fertilizeDueAt, setFertilizeDueAt] = useState<number>(addDays(Date.now(), 30));
  const [fertilizeNote, setFertilizeNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const waterSummary =
    waterDays.length === 0
      ? 'Escolha pelo menos um dia'
      : `Lembrete: ${formatWaterDays(waterDays)} às ${waterTime || DEFAULT_WATER_TIME}`;

  const canSave = Boolean(name.trim()) && waterDays.length > 0;

  const onSave = () => {
    if (!canSave) return;
    const trimmedNotes = notesText.trim();
    const plant = addPlant({
      name,
      speciesId,
      location,
      notes: trimmedNotes ? [trimmedNotes] : [],
      waterDays,
      waterTime: waterTime || DEFAULT_WATER_TIME,
      fertilizeDueAt: scheduleFertilize ? fertilizeDueAt : null,
      fertilizeNote: scheduleFertilize ? fertilizeNote : '',
      imageUri,
    });
    setSpeciesId(SPECIES_CATALOG[0]!.id);
    setName('');
    setLocation('');
    setNotesText('');
    setWaterDays([...DEFAULT_WATER_DAYS]);
    setWaterTime(DEFAULT_WATER_TIME);
    setScheduleFertilize(false);
    setFertilizeDueAt(addDays(Date.now(), 30));
    setFertilizeNote('');
    setImageUri(null);
    const openPlant = CommonActions.reset({
      index: 1,
      routes: [
        {
          name: 'Tabs',
          state: {
            index: 0,
            routes: [{ name: 'Home' }, { name: 'AddPlantTab' }, { name: 'Settings' }],
          },
        },
        { name: 'PlantDetail', params: { plantId: plant.id } },
      ],
    });
    if (route.name === 'AddPlantTab') {
      navigation.getParent()?.dispatch(openPlant);
      return;
    }
    navigation.dispatch(openPlant);
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: showBanner ? 24 : insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {showBanner || navigation.canGoBack() ? (
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Voltar</Text>
          </Pressable>
        ) : null}

        <Text style={styles.title}>Nova planta</Text>
        <Text style={styles.subtitle}>
          Cadastre a planta e diga quando quer ser lembrado de regar.
        </Text>

        {/* 1. Identidade */}
        <View style={styles.card}>
          <Text style={styles.step}>1 · Sua planta</Text>

          <Pressable
            style={styles.preview}
            onPress={() => promptPlantImage(setImageUri, Boolean(imageUri))}
          >
            <PlantAvatar speciesId={speciesId} imageUri={imageUri} size={112} round />
            <Text style={styles.photoCta}>
              {imageUri ? 'Trocar foto' : 'Adicionar foto (opcional)'}
            </Text>
          </Pressable>

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.grid}>
            {SPECIES_CATALOG.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSpeciesId(s.id)}
                style={[styles.species, speciesId === s.id && styles.speciesActive]}
              >
                <PlantAvatar speciesId={s.id} size={44} />
                <Text style={styles.speciesLabel}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Nome *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex.: Samambaia da sala"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Onde fica (opcional)</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Ex.: Varanda, cozinha…"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>

        {/* 2. Rega */}
        <View style={styles.card}>
          <Text style={styles.step}>2 · Quando regar</Text>
          <Text style={styles.hint}>
            Marque os dias da semana e o horário do lembrete no celular.
          </Text>

          <Text style={styles.label}>Dias da semana *</Text>
          <WeekDayPicker value={waterDays} onChange={setWaterDays} />
          {waterDays.length === 0 ? (
            <Text style={styles.warn}>Selecione pelo menos um dia.</Text>
          ) : null}

          <TimeField
            value={waterTime}
            onChange={setWaterTime}
            label="Horário do lembrete"
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>{waterSummary}</Text>
          </View>
        </View>

        {/* 3. Adubo */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.step}>3 · Adubo (opcional)</Text>
              <Text style={styles.hint}>Lembrete único na data que você escolher.</Text>
            </View>
            <Switch
              value={scheduleFertilize}
              onValueChange={setScheduleFertilize}
              trackColor={{ false: colors.border, true: colors.leaf }}
              thumbColor={colors.white}
            />
          </View>

          {scheduleFertilize ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              <DateField
                value={fertilizeDueAt}
                onChange={setFertilizeDueAt}
                label="Data do lembrete"
              />
              <Text style={styles.label}>Qual adubo? (opcional)</Text>
              <TextInput
                value={fertilizeNote}
                onChangeText={setFertilizeNote}
                placeholder="Ex.: NPK 10-10-10"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
            </View>
          ) : null}
        </View>

        {/* 4. Notas */}
        <View style={styles.card}>
          <Text style={styles.step}>4 · Observações (opcional)</Text>
          <Text style={styles.hint}>Anotações livres sobre a planta.</Text>
          <TextInput
            value={notesText}
            onChangeText={setNotesText}
            placeholder="Ex.: gosta de luz indireta…"
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.input, styles.textarea]}
          />
        </View>

        <Pressable
          style={[styles.cta, !canSave && styles.ctaDisabled]}
          onPress={onSave}
          disabled={!canSave}
        >
          <Text style={styles.ctaText}>Salvar planta</Text>
        </Pressable>
        {!name.trim() ? (
          <Text style={styles.footerHint}>Informe o nome da planta para salvar.</Text>
        ) : waterDays.length === 0 ? (
          <Text style={styles.footerHint}>Escolha pelo menos um dia de rega.</Text>
        ) : null}
      </ScrollView>
      {showBanner ? <BannerAdSlot /> : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.md, gap: 14 },
    back: { color: colors.leafDeep, fontWeight: '700', marginBottom: 4 },
    title: { fontSize: 26, fontWeight: '700', color: colors.ink },
    subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: 4 },
    card: {
      backgroundColor: colors.panel,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 10,
    },
    step: { fontWeight: '800', color: colors.ink, fontSize: 16 },
    hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
    preview: {
      alignItems: 'center',
      backgroundColor: colors.panelDeep,
      borderRadius: radii.md,
      padding: 14,
      gap: 8,
    },
    photoCta: { fontWeight: '700', color: colors.leafDeep, fontSize: 13 },
    label: { fontWeight: '700', color: colors.ink, fontSize: 14, marginTop: 2 },
    warn: { color: colors.wilted, fontSize: 13, fontWeight: '700' },
    summaryBox: {
      backgroundColor: colors.panelDeep,
      borderRadius: radii.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryText: { color: colors.leafDeep, fontWeight: '700', fontSize: 14 },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    species: {
      width: '23%',
      minWidth: 72,
      alignItems: 'center',
      backgroundColor: colors.panelDeep,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 6,
    },
    speciesActive: {
      borderColor: colors.leafDeep,
      backgroundColor: colors.speciesActiveBg,
    },
    speciesLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.ink,
      textAlign: 'center',
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.ink,
      fontSize: 15,
    },
    textarea: { minHeight: 80, textAlignVertical: 'top' },
    cta: {
      marginTop: 4,
      backgroundColor: colors.leafDeep,
      borderRadius: radii.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    ctaDisabled: { opacity: 0.45 },
    ctaText: { color: colors.white, fontWeight: '700', fontSize: 15 },
    footerHint: {
      color: colors.muted,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 8,
    },
  });
