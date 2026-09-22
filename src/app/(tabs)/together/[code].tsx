import { StyleSheet, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TogetherRoomScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const sessionCode = typeof code === 'string' ? code : (code?.[0] ?? 'ROOM');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.two,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <Stack.Screen
        options={{
          title: `Room: ${sessionCode}`,
          headerShown: true,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.center}>
        <ThemedText type="subtitle">Session: {sessionCode}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.hint}>
          Lobby placeholder for group focus session (Phase 2).
        </ThemedText>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.plantPrimary, opacity: pressed ? 0.5 : 1.0 },
        ]}
        onPress={() => router.back()}>
        <ThemedText type="smallBold" style={styles.buttonText}>
          Leave Room
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  hint: {
    textAlign: 'center',
  },
  button: {
    paddingVertical: Spacing.three,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
