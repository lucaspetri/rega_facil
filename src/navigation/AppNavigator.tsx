import { useMemo } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  BottomTabBar,
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BannerAdSlot } from '../components/BannerAdSlot';
import { useCopilot } from '../context/CopilotContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { AddPlantScreen } from '../screens/AddPlantScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PlantDetailScreen } from '../screens/PlantDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { RootStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabBarWithBanner = (props: BottomTabBarProps) => (
  <View>
    <BannerAdSlot bottomInset={0} />
    <BottomTabBar {...props} />
  </View>
);

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBarWithBanner {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.leafDeep,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          height: 52 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Home'
              ? 'flower-outline'
              : route.name === 'AddPlantTab'
                ? 'plus-circle-outline'
                : 'cog-outline';
          return <MaterialCommunityIcons name={name} size={size + 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Plantas' }} />
      <Tab.Screen name="AddPlantTab" component={AddPlantScreen} options={{ title: 'Nova' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { state } = useCopilot();
  const colors = useThemeColors();

  const navigationTheme = useMemo(
    () => ({
      ...(state.darkMode ? DarkTheme : DefaultTheme),
      colors: {
        ...(state.darkMode ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.background,
        card: colors.panel,
        primary: colors.ink,
        text: colors.ink,
        border: colors.border,
      },
    }),
    [state.darkMode, colors],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={MainTabs} />
        <Stack.Screen name="PlantDetail" component={PlantDetailScreen} />
        <Stack.Screen name="AddPlant" component={AddPlantScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
