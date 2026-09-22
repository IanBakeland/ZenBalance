import { StyleSheet, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';

export default function OnboardingTutorialScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Welcome', headerShadowVisible: false }} />

      <View style={styles.content}>
        <ThemedText type="title" style={styles.centered}>
          ZenBalance
        </ThemedText>
        <ThemedText type="default" style={[styles.centered, styles.description]}>
          A calm focus timer where stillness helps your plant grow. Place your phone face-up
          on the desk and stay present.
        </ThemedText>
      </View>

      <PrimaryButton
        label="Next: Choose Plant"
        onPress={() => router.push('/onboarding/plant')}
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
