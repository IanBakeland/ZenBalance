import { View, type ViewProps } from 'react-native';

import { ThemeColor, ThemeMode } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  type?: ThemeColor;
  mode?: ThemeMode;
};

export function ThemedView({ style, type = 'background', mode, ...otherProps }: ThemedViewProps) {
  const theme = useTheme(mode);

  return <View style={[{ backgroundColor: theme[type] }, style]} {...otherProps} />;
}
