import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, spacing, type ThemeColors } from '../constants/theme';
import { useCopilot } from '../context/CopilotContext';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  LEGAL_VERSION,
  PRIVACY_POLICY,
  PRIVACY_POLICY_TITLE,
  TERMS_OF_USE,
  TERMS_OF_USE_TITLE,
} from '../legal/documents';
import {
  openSystemNotificationSettings,
  requestNotificationPermission,
} from '../notifications';

type DocKind = 'privacy' | 'terms' | null;

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { state, setNotificationsEnabled, setDarkMode, resetDemo } = useCopilot();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [doc, setDoc] = useState<DocKind>(null);

  const enableAlerts = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (!granted) {
      Alert.alert(
        'Notificações desativadas',
        'Para lembrar a rega, permita notificações do Rega Fácil nas configurações do aparelho.',
        [
          { text: 'Agora não', style: 'cancel' },
          {
            text: 'Abrir configurações',
            onPress: () => {
              void openSystemNotificationSettings();
            },
          },
        ],
      );
    }
  };

  const docTitle = doc === 'privacy' ? PRIVACY_POLICY_TITLE : TERMS_OF_USE_TITLE;
  const docBody = doc === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE;

  return (
    <View style={[styles.flex, { paddingTop: insets.top + 16 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Configurações</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aparência</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Modo escuro</Text>
            </View>
            <Switch
              value={state.darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.border, true: colors.leaf }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alertas</Text>
          <Pressable style={styles.cta} onPress={enableAlerts}>
            <Text style={styles.ctaText}>
              {state.notificationsEnabled ? 'Alertas ativos' : 'Ativar alertas'}
            </Text>
          </Pressable>
          {state.notificationsEnabled ? (
            <Pressable onPress={() => setNotificationsEnabled(false)}>
              <Text style={styles.link}>Desativar alertas</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados</Text>
          <Pressable
            style={styles.danger}
            onPress={() =>
              Alert.alert(
                'Resetar dados',
                'Apagar todas as plantas deste aparelho?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Resetar',
                    style: 'destructive',
                    onPress: () => {
                      void resetDemo();
                    },
                  },
                ],
              )
            }
          >
            <Text style={styles.dangerText}>Resetar dados</Text>
          </Pressable>
        </View>

        <View style={styles.footerLinks}>
          <Pressable onPress={() => setDoc('privacy')}>
            <Text style={styles.footerLink}>{PRIVACY_POLICY_TITLE}</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => setDoc('terms')}>
            <Text style={styles.footerLink}>{TERMS_OF_USE_TITLE}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={doc != null} animationType="slide" onRequestClose={() => setDoc(null)}>
        <View
          style={[
            styles.modalFlex,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{docTitle}</Text>
            <Pressable onPress={() => setDoc(null)}>
              <Text style={styles.link}>Fechar</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.modalText}>{docBody}</Text>
            <Text style={[styles.meta, { marginTop: 16 }]}>Versão {LEGAL_VERSION}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.md, gap: 12 },
    title: { fontSize: 26, fontWeight: '800', color: colors.ink },
    subtitle: { color: colors.muted, fontSize: 15, marginBottom: 4 },
    card: {
      backgroundColor: colors.panel,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 8,
    },
    cardTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
    meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },
    toggleLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
    cta: {
      marginTop: 6,
      backgroundColor: colors.waterDeep,
      borderRadius: radii.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    ctaText: { color: colors.white, fontWeight: '800' },
    link: {
      color: colors.leafDeep,
      fontWeight: '700',
      marginTop: 4,
    },
    footerLinks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 8,
      marginTop: 4,
    },
    footerLink: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    footerDot: { color: colors.muted, fontSize: 13 },
    danger: {
      marginTop: 8,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerBg,
      paddingVertical: 12,
      alignItems: 'center',
    },
    dangerText: { color: colors.wilted, fontWeight: '800' },
    modalFlex: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.ink,
      flex: 1,
      paddingRight: 12,
    },
    modalBody: { padding: spacing.md, paddingBottom: 40 },
    modalText: { fontSize: 14, color: colors.ink, lineHeight: 22 },
  });
