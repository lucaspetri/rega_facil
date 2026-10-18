import { Image, StyleSheet, View } from 'react-native';

import { useThemeColors } from '../hooks/useThemeColors';
import { getSpeciesArt } from '../species';

type Props = {
  speciesId: string;
  imageUri?: string | null;
  size?: number;
  round?: boolean;
};

export const PlantAvatar = ({
  speciesId,
  imageUri = null,
  size = 72,
  round = false,
}: Props) => {
  const colors = useThemeColors();
  const source = imageUri ? { uri: imageUri } : getSpeciesArt(speciesId);
  const radius = round ? size / 2 : size * 0.22;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.panelDeep,
        },
      ]}
    >
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          borderRadius: imageUri || round ? radius : 0,
        }}
        resizeMode={imageUri ? 'cover' : 'contain'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
