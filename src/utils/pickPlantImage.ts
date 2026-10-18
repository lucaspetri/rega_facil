import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const pickPlantImage = async (
  source: 'camera' | 'library',
): Promise<string | null> => {
  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão', 'Precisamos da câmera para tirar a foto da planta.');
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets[0]) return null;
      return result.assets[0].uri;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão', 'Precisamos da galeria para escolher a foto.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  } catch (error) {
    console.warn('[image-picker]', error);
    Alert.alert('Erro', 'Não foi possível obter a imagem.');
    return null;
  }
};

export const promptPlantImage = (
  onPicked: (uri: string | null) => void,
  allowClear = false,
) => {
  const buttons: {
    text: string;
    style?: 'cancel' | 'destructive' | 'default';
    onPress?: () => void;
  }[] = [
    {
      text: 'Tirar foto',
      onPress: () => {
        void pickPlantImage('camera').then(onPicked);
      },
    },
    {
      text: 'Galeria',
      onPress: () => {
        void pickPlantImage('library').then(onPicked);
      },
    },
  ];

  if (allowClear) {
    buttons.push({
      text: 'Usar visual padrão',
      style: 'destructive',
      onPress: () => onPicked(null),
    });
  }

  buttons.push({ text: 'Cancelar', style: 'cancel' });
  Alert.alert('Foto da planta', 'Escolha uma opção', buttons);
};
