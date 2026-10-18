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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BannerAdSlot } from '../components/BannerAdSlot';
import { DateField } from '../components/DateField';
import { PlantAvatar } from '../components/PlantAvatar';
import { TimeField } from '../components/TimeField';
import { WeekDayPicker } from '../components/WeekDayPicker';
import { addDays } from '../care';
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
  const [notes, setNotes] = useState<string[]>([]);
  const [draftNote, setDraftNote] = useState('');
  const [waterDays, setWaterDays] = useState<Weekday[]>([...DEFAULT_WATER_DAYS]);
  const [waterTime, setWaterTime] = useState(DEFAULT_WATER_TIME);
  const [scheduleFertilize, setScheduleFertilize] = useState(false);
  const [fertilizeDueAt, setFertilizeDueAt] = useState<number>(addDays(Date.now(), 30));
  const [fertilizeNote, setFertilizeNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const addNote = () => {
    const trimmed = draftNote.trim();
    if (!trimmed) return;
    setNotes((prev) => [...prev, trimmed]);
    setDraftNote('');
  };

  const removeNote = (index: number) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  };

  const onSave = () => {
    if (!name.trim()) return;
    if (waterDays.length === 0) return;
    const pendingNotes = draftNote.trim()
      ? [...notes, draftNote.trim()]
      : notes;
    const plant = addPlant({
      name,
      speciesId,
      location,
      notes: pendingNotes,
      waterDays,
      waterTime: waterTime || DEFAULT_WATER_TIME,
      fertilizeDueAt: scheduleFertilize ? fertilizeDueAt : null,
      fertilizeNote: scheduleFertilize ? fertilizeNote : '',
      imageUri,
    });
    navigation.navigate('PlantDetail', { plantId: plant.id });
  };

  return (
    <View style={styles.flex}>
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: showBanner ? 24 : insets.bottom + 24 },
      ]}
    >
      {showBanner || navigation.canGoBack() ? (
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </Pressable>
      ) : null}
      <Text style={styles.title}>Nova planta</Text>

      <Pressable
        style={styles.preview}
        onPress={() => promptPlantImage(setImageUri, Boolean(imageUri))}
      >
        <PlantAvatar speciesId={speciesId} imageUri={imageUri} size={120} round />
        <Text style={styles.photoCta}>
          {imageUri ? 'Trocar foto' : 'Adicionar foto'}
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
            <PlantAvatar speciesId={s.id} size={48} />
            <Text style={styles.speciesLabel}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Nome</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nome"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Local</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Local"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />

      <Text style={styles.section}>Rega</Text>
      <Text style={styles.label}>Dias</Text>
      <WeekDayPicker value={waterDays} onChange={setWaterDays} />
      {waterDays.length === 0 ? (
        <Text style={styles.warn}>Selecione pelo menos um dia.</Text>
      ) : null}
      <TimeField value={waterTime} onChange={setWaterTime} label="Horário" />

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.section}>Agendar adubação</Text>
        </View>
        <Switch
          value={scheduleFertilize}
          onValueChange={setScheduleFertilize}
          trackColor={{ false: colors.border, true: colors.leaf }}
          thumbColor={colors.white}
        />
      </View>

      {scheduleFertilize ? (
        <View style={{ gap: 10 }}>
          <DateField
            value={fertilizeDueAt}
            onChange={setFertilizeDueAt}
            label="Data"
          />
          <Text style={styles.label}>Adubo</Text>
          <TextInput
            value={fertilizeNote}
            onChangeText={setFertilizeNote}
            placeholder="Nome do adubo"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
      ) : null}

      <Text style={styles.section}>Notas</Text>
      {notes.map((note, index) => (
        <View key={`${index}-${note.slice(0, 12)}`} style={styles.noteRow}>
          <Text style={styles.noteText}>{note}</Text>
          <Pressable onPress={() => removeNote(index)}>
            <Text style={styles.noteRemove}>Remover</Text>
          </Pressable>
        </View>
      ))}
      <TextInput
        value={draftNote}
        onChangeText={setDraftNote}
        placeholder="Escreva uma nota"
        placeholderTextColor={colors.muted}
        multiline
        style={[styles.input, styles.textarea]}
      />
      <Pressable
        style={[styles.secondaryCta, !draftNote.trim() && styles.ctaDisabled]}
        onPress={addNote}
        disabled={!draftNote.trim()}
      >
        <Text style={styles.secondaryCtaText}>Adicionar</Text>
      </Pressable>

      <Pressable
        style={[styles.cta, (!name.trim() || waterDays.length === 0) && styles.ctaDisabled]}
        onPress={onSave}
      >
        <Text style={styles.ctaText}>Salvar planta</Text>
      </Pressable>
    </ScrollView>
    {showBanner ? <BannerAdSlot /> : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.md, gap: 10 },
    back: { color: colors.leafDeep, fontWeight: '700', marginBottom: 4 },
    title: { fontSize: 26, fontWeight: '700', color: colors.ink },
    subtitle: { color: colors.muted, fontSize: 15, marginBottom: 8 },
    preview: {
      alignItems: 'center',
      backgroundColor: colors.panel,
      borderRadius: radii.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    photoCta: { fontWeight: '700', color: colors.leafDeep, fontSize: 13 },
    tip: { color: colors.muted, fontSize: 13, textAlign: 'center' },
    section: { fontWeight: '800', color: colors.ink, fontSize: 16, marginTop: 8 },
    label: { fontWeight: '700', color: colors.ink, marginTop: 4, fontSize: 14 },
    meta: { color: colors.muted, fontSize: 13 },
    warn: { color: colors.wilted, fontSize: 13, fontWeight: '700' },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 6,
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
      backgroundColor: colors.panel,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.ink,
      fontSize: 15,
    },
    textarea: { minHeight: 72, textAlignVertical: 'top' },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.panel,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    noteText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 },
    noteRemove: { color: colors.wilted, fontWeight: '700', fontSize: 13 },
    secondaryCta: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      paddingVertical: 10,
      alignItems: 'center',
    },
    secondaryCtaText: { color: colors.leafDeep, fontWeight: '700', fontSize: 14 },
    cta: {
      marginTop: 8,
      backgroundColor: colors.leafDeep,
      borderRadius: radii.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    ctaDisabled: { opacity: 0.45 },
    ctaText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  });
