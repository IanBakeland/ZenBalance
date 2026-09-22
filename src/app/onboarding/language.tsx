import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';

export default function OnboardingLanguageScreen() {
  const completeOnboarding = useZenBalanceStore((s) => s.completeOnboarding);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Language', headerShadowVisible: false }} />

      <View style={styles.content}>
        <ThemedText type="heading" style={styles.centered}>
          Select your language
        </ThemedText>
        <ThemedText type="default" style={[styles.centered, styles.description]}>
          Nederlands of Engels. (UI placeholder for Step 2)
        </ThemedText>
      </View>

      {/* The store flip is the whole navigation: the root Stack's guard swaps
          the onboarding stack out for the tabs. No manual router call needed. */}
      <PrimaryButton
        label="Get Started"
        onPress={() => completeOnboarding('seedling_starter', 'nl')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  centered: {
    textAlign: 'center',
  },
  description: {
    maxWidth: 320,
  },
});
