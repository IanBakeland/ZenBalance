import { StyleSheet, Pressable, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sessionTheme = useTheme('session');

  return (
    <ThemedView
      mode="session"
      type="background"
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <Stack.Screen
        options={{
          title: 'Session',
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />

      {/* AMOLED Header */}
      <View style={styles.header}>
        <ThemedText mode="session" type="caption" themeColor="textSecondary">
          STAY STILL • FOCUSING
        </ThemedText>
      </View>

      {/* Luminous Plant & Timer Centerpiece */}
      <View style={styles.center}>
        <ThemedText mode="session" type="timer" themeColor="text">
          25:00
        </ThemedText>
        <ThemedText mode="session" style={styles.glowPlant}>
          🌿
        </ThemedText>
        <ThemedText mode="session" type="caption" themeColor="plantGlow">
          Sensor check active (Placeholder Step 4/6)
        </ThemedText>
      </View>

      {/* Manual Stop Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.stopButton,
            { borderColor: sessionTheme.textSecondary, opacity: pressed ? 0.5 : 1.0 },
          ]}
          onPress={() => router.back()}>
          <ThemedText mode="session" type="small" themeColor="textSecondary">
            Stop Session
          </ThemedText>
        </Pressable>
      </View>
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
  header: {
    paddingTop: Spacing.two,
  },
  center: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  glowPlant: {
    fontSize: 72,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  stopButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: 999,
    borderWidth: 1,
  },
});
