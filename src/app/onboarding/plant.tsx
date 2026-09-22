import { StyleSheet, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';

export default function OnboardingPlantScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Choose Plant', headerShadowVisible: false }} />

      <View style={styles.content}>
        <ThemedText type="heading" style={styles.centered}>
          Pick your companion
        </ThemedText>
        <ThemedText type="default" style={[styles.centered, styles.description]}>
          Choose between small, medium, or large plants. (UI placeholder for Step 2)
        </ThemedText>
      </View>

      <PrimaryButton
        label="Next: Choose Language"
        onPress={() => router.push('/onboarding/language')}
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
