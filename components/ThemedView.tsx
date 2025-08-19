import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  // Only use theme background when a color override is provided; otherwise be transparent
  const bg =
    lightColor !== undefined || darkColor !== undefined
      ? useThemeColor({ light: lightColor, dark: darkColor }, 'background')
      : 'transparent';

  return <View style={[{ backgroundColor: bg }, style]} {...otherProps} />;
}
