import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  // Always call the hook (rules of hooks) and then decide fallback
  const themed = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const bg = lightColor !== undefined || darkColor !== undefined ? themed : 'transparent';

  return <View style={[{ backgroundColor: bg }, style]} {...otherProps} />;
}
