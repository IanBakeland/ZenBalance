import { StyleSheet, Pressable, View } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';

export default function OnboardingLanguageScreen() {
  const completeOnboarding = useZenBalanceStore((s) => s.completeOnboarding);
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Language', headerShadowVisible: false }} />

      <View style={styles.content}>
        <ThemedText type="heading" style={styles.title}>
          Select your language
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          Nederlands of Engels. (UI placeholder for Step 2)
        </ThemedText>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.plantPrimary, opacity: pressed ? 0.5 : 1.0 },
        ]}
        onPress={() => completeOnboarding('seedling_starter', 'nl')}>
        <ThemedText type="smallBold" style={styles.buttonText}>
          Get Started
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
