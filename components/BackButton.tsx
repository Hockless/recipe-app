import { shared } from '@/styles/theme';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleProp, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';

interface Props {
  label?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  textStyle?: StyleProp<TextStyle>;
}

const BackButton: React.FC<Props> = ({ label = '← Back', style, onPress, textStyle }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress || (() => router.back())}
      style={[shared.backButton, style]}
      activeOpacity={0.7}
    >
      <ThemedText style={[shared.backButtonText, textStyle]}>{label}</ThemedText>
    </TouchableOpacity>
  );
};

export default BackButton;
export { BackButton };
