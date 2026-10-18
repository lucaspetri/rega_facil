import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { requestNotificationPermission } from '../notifications';

type DocKind = 'privacy' | 'terms' | null;

export const LegalGateScreen = () => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { acceptLegal, setNotificationsEnabled } = useCopilot();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doc, setDoc] = useState<DocKind>(null);

  const onAccept = async () => {
    if (!checked || busy) return;
    setBusy(true);
    try {
      acceptLegal(LEGAL_VERSION);
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
    } finally {
      setBusy(false);
    }
  };

  const docTitle = doc === 'privacy' ? PRIVACY_POLICY_TITLE : TERMS_OF_USE_TITLE;
  const docBody = doc === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE;

  return (
    <View
      style={[
        styles.flex,
        { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.brand}>Rega Fácil</Text>
        <Text style={styles.title}>Olá</Text>
        <Text style={styles.subtitle}>
          Para usar o app, confirme que leu a{' '}
          <Text style={styles.inlineLink} onPress={() => setDoc('privacy')}>
            Política de Privacidade
          </Text>
          {' '}e os{' '}
          <Text style={styles.inlineLink} onPress={() => setDoc('terms')}>
            Termos de Uso
          </Text>
          .
        </Text>

        <Pressable
          style={styles.checkRow}
          onPress={() => setChecked((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          <View style={[styles.checkbox, checked && styles.checkboxOn]}>
            {checked ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>Li e concordo</Text>
        </Pressable>

        <Pressable
          style={[styles.cta, (!checked || busy) && styles.ctaDisabled]}
          onPress={onAccept}
          disabled={!checked || busy}
        >
          <Text style={styles.ctaText}>{busy ? '…' : 'Continuar'}</Text>
        </Pressable>
      </View>

      <Modal visible={doc != null} animationType="fade" onRequestClose={() => setDoc(null)}>
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
            <Text style={styles.version}>Versão {LEGAL_VERSION}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
    content: { paddingHorizontal: spacing.lg, gap: 16 },
    brand: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.muted,
      letterSpacing: 0.3,
    },
    title: { fontSize: 32, fontWeight: '700', color: colors.ink },
    subtitle: { fontSize: 15, color: colors.muted, lineHeight: 22 },
    inlineLink: {
      color: colors.leafDeep,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: {
      backgroundColor: colors.leafDeep,
      borderColor: colors.leafDeep,
    },
    checkMark: { color: colors.white, fontWeight: '700', fontSize: 13 },
    checkLabel: { fontSize: 14, color: colors.ink, fontWeight: '500' },
    cta: {
      marginTop: 4,
      backgroundColor: colors.leafDeep,
      borderRadius: radii.md,
      paddingVertical: 13,
      alignItems: 'center',
    },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { color: colors.white, fontWeight: '700', fontSize: 15 },
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
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, flex: 1, paddingRight: 12 },
    link: { color: colors.leafDeep, fontWeight: '600', fontSize: 15 },
    modalBody: { padding: spacing.md, paddingBottom: 40 },
    modalText: { fontSize: 14, color: colors.ink, lineHeight: 22 },
    version: { marginTop: 16, fontSize: 12, color: colors.muted },
  });
