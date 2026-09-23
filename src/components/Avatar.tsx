import { StyleSheet, View } from 'react-native';

import { ThemedText } from './ThemedText';

import type { ThemeMode } from '@/constants/Theme';
import { useTheme } from '@/hooks/UseTheme';

export type AvatarProps = {
  /** Stable per person, so a friend has the same colour on every device. */
  id: string;
  name: string;
  size?: number;
  mode?: ThemeMode;
  /** Muted, for the friend who picked their phone up. */
  dimmed?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

/** STYLE_GUIDE.md section 6: warm, abstract initials — never photos. */
export function Avatar({ id, name, size = 44, mode, dimmed }: AvatarProps) {
  const theme = useTheme(mode);
  const palette = [theme.plantAccent, theme.droplet, theme.warmthAccent];
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return (
    <View
      accessibilityLabel={name}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dimmed ? theme.textSecondary : palette[hash % palette.length],
          borderColor: theme.background,
          opacity: dimmed ? 0.55 : 1,
        },
      ]}>
      <ThemedText style={[styles.initials, { fontSize: size * 0.36, lineHeight: size * 0.44 }]}>
        {initials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  // Warm near-black reads on every palette colour, light and dark.
  initials: {
    color: '#2B2A25',
    fontWeight: '700',
  },
});
