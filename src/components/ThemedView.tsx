import { View, type ViewProps } from 'react-native';

import { ThemeColor, ThemeMode } from '@/constants/Theme';
import { useTheme } from '@/hooks/UseTheme';

export type ThemedViewProps = ViewProps & {
  type?: ThemeColor;
  mode?: ThemeMode;
};

export function ThemedView({ style, type = 'background', mode, ...otherProps }: ThemedViewProps) {
  const theme = useTheme(mode);

  return <View style={[{ backgroundColor: theme[type] }, style]} {...otherProps} />;
}
