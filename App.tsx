import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, getColors } from './src/constants/theme';
import { CopilotProvider, useCopilot } from './src/context/CopilotContext';
import { hasAcceptedCurrentLegal } from './src/legal/acceptance';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LegalGateScreen } from './src/screens/LegalGateScreen';

const Bootstrap = () => {
  const { ready, state } = useCopilot();
  const themeColors = getColors(state.darkMode);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: themeColors.backgroundMid }]}>
        <ActivityIndicator color={themeColors.leafDeep} size="large" />
      </View>
    );
  }

  const legalOk = hasAcceptedCurrentLegal(state.legalAcceptedVersion);

  return (
    <>
      <StatusBar style={state.darkMode ? 'light' : 'dark'} />
      {legalOk ? <AppNavigator /> : <LegalGateScreen />}
    </>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PressStart2P: require('./src/assets/fonts/PressStart2P-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.leafDeep} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <CopilotProvider>
          <Bootstrap />
        </CopilotProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundMid,
  },
});
