import { Colors, ThemeColor, ThemeMode } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(modeOverride?: ThemeMode) {
  const scheme = useColorScheme();
  const theme: ThemeMode = modeOverride ?? (scheme === 'dark' ? 'dark' : 'light');

  return Colors[theme];
}
