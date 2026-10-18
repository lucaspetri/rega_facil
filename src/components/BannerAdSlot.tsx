import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ADS_NON_PERSONALIZED_ONLY } from '../ads/config';
import {
  canUseNativeAds,
  getBannerUnitId,
  initializeMobileAds,
  loadAdsModule,
} from '../ads/mobileAds';
import type { ThemeColors } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

type Props = {
  bottomInset?: number;
};

type BannerProps = {
  unitId: string;
  size: string;
  requestOptions?: { requestNonPersonalizedAdsOnly?: boolean };
  onAdFailedToLoad?: () => void;
};

/** Banner AdMob (só em development/production build — no Expo Go não renderiza). */
export const BannerAdSlot = ({ bottomInset }: Props) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const padBottom = bottomInset ?? Math.max(insets.bottom, 4);
  const nativeOk = canUseNativeAds();

  const [ready, setReady] = useState(false);
  const [BannerComp, setBannerComp] = useState<ComponentType<BannerProps> | null>(null);
  const [bannerSize, setBannerSize] = useState<string>('BANNER');
  const [unitId, setUnitId] = useState(getBannerUnitId(null));

  useEffect(() => {
    if (!nativeOk) return;
    let mounted = true;
    (async () => {
      const ok = await initializeMobileAds();
      const mod = await loadAdsModule();
      if (!mounted) return;
      if (!ok || !mod) return;
      setBannerComp(() => mod.BannerAd as ComponentType<BannerProps>);
      setBannerSize(
        mod.BannerAdSize?.ANCHORED_ADAPTIVE_BANNER ??
          mod.BannerAdSize?.BANNER ??
          'BANNER',
      );
      setUnitId(getBannerUnitId(mod));
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [nativeOk]);

  if (!nativeOk || !ready || !BannerComp) {
    return null;
  }

  return (
    <View style={[styles.wrap, { paddingBottom: padBottom }]}>
      <BannerComp
        unitId={unitId}
        size={bannerSize}
        requestOptions={{
          requestNonPersonalizedAdsOnly: ADS_NON_PERSONALIZED_ONLY,
        }}
        onAdFailedToLoad={() => setReady(false)}
      />
    </View>
  );
};

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      width: '100%',
      alignItems: 'center',
    },
  });
