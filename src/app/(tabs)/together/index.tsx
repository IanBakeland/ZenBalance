import { StyleSheet, Pressable, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TogetherHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
        },
      ]}>
      <Stack.Screen options={{ title: 'Together', headerShown: false }} />

      <View style={styles.header}>
        <ThemedText type="heading">Focus Together</ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Share one plant with friends. Everyone must stay still!
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedView type="surface" style={styles.card}>
          <ThemedText style={styles.icon}>🪴</ThemedText>
          <ThemedText type="subtitle">Group Session</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.cardHint}>
            Phase 2 placeholder — will connect to Firebase once Phase 1 is validated.
          </ThemedText>
        </ThemedView>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.plantPrimary, opacity: pressed ? 0.5 : 1.0 },
          ]}
          onPress={() => router.push('/together/DEMO1')}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            Join Demo Room (DEMO1)
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
  },
  header: {
    gap: Spacing.one,
  },
  subtitle: {
    lineHeight: 22,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 260,
    padding: Spacing.four,
    borderRadius: Spacing.six,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  icon: {
    fontSize: 56,
  },
  cardHint: {
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.two,
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
