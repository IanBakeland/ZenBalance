import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from './ThemedText';

import { MinTapTarget, PillRadius, Spacing, type ThemeMode } from '@/constants/Theme';
import { useTheme } from '@/hooks/UseTheme';
import { hapticTap } from '@/lib/Haptics';

export type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  mode?: ThemeMode;
};

/**
 * The pill-shaped primary action used on every screen. Course Pressable pattern.
 * Carries the app's one unconditional haptic: a single light tap. Screens that
 * mark a real commitment (onboarding done, plant chosen) add `hapticCommit` on top.
 */
export function PrimaryButton({ label, mode, onPress, disabled, ...rest }: PrimaryButtonProps) {
  const theme = useTheme(mode);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={(event) => {
        hapticTap();
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.plantPrimary, opacity: disabled ? 0.4 : pressed ? 0.5 : 1.0 },
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
