import { Colors, ThemeMode } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/UseColorScheme';

export function useTheme(modeOverride?: ThemeMode) {
  const scheme = useColorScheme();
  const theme: ThemeMode = modeOverride ?? (scheme === 'dark' ? 'dark' : 'light');

  return Colors[theme];
}
