import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MinTapTarget, PillRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // The session screen is the one screen on the separate true-black palette
  // (STYLE_GUIDE.md section 2), regardless of the app's light/dark mode.
  const sessionTheme = useTheme('session');

  return (
    <ThemedView
      mode="session"
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <Stack.Screen options={{ title: 'Session', headerShown: false }} />
      <StatusBar style="light" />

      <View>
        <ThemedText mode="session" type="caption" themeColor="textSecondary">
          STAY STILL • FOCUSING
        </ThemedText>
      </View>

      {/* Luminous plant & timer centerpiece — keep the lit area small. */}
      <View style={styles.center}>
        <ThemedText mode="session" type="timer">
          25:00
        </ThemedText>
        <ThemedText mode="session" style={styles.glowPlant}>
          🌿
        </ThemedText>
        <ThemedText mode="session" type="caption" themeColor="plantGlow">
          Sensor check active (placeholder — Steps 4/6)
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.stopButton,
          { borderColor: sessionTheme.textSecondary, opacity: pressed ? 0.5 : 1.0 },
        ]}
        onPress={() => router.back()}>
        <ThemedText mode="session" type="small" themeColor="textSecondary">
          Stop Session
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  glowPlant: {
    fontSize: 72,
  },
  stopButton: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    borderRadius: PillRadius,
    borderWidth: 1,
  },
});
