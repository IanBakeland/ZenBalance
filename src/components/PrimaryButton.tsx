import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from './ThemedText';

import { MinTapTarget, PillRadius, Spacing, type ThemeMode } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  mode?: ThemeMode;
};

/** The pill-shaped primary action used on every screen. Course Pressable pattern. */
export function PrimaryButton({ label, mode, ...rest }: PrimaryButtonProps) {
  const theme = useTheme(mode);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.plantPrimary, opacity: pressed ? 0.5 : 1.0 },
      ]}
      {...rest}>
      <ThemedText mode={mode} type="smallBold" themeColor="onPlantPrimary" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: MinTapTarget,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: PillRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
  },
});
