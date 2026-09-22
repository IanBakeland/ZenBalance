import { StyleSheet, Pressable, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function OnboardingTutorialScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Welcome', headerShadowVisible: false }} />

      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          ZenBalance
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          A calm focus timer where stillness helps your plant grow. Place your phone face-up on the desk and stay present.
        </ThemedText>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.plantPrimary, opacity: pressed ? 0.5 : 1.0 },
        ]}
        onPress={() => router.push('/onboarding/plant')}>
        <ThemedText type="smallBold" style={styles.buttonText}>
          Next: Choose Plant
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 24,
  },
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
