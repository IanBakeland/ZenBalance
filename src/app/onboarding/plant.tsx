import { StyleSheet, Pressable, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function OnboardingPlantScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Choose Plant', headerShadowVisible: false }} />

      <View style={styles.content}>
        <ThemedText type="heading" style={styles.title}>
          Pick your companion
        </ThemedText>
        <ThemedText type="default" style={styles.description}>
          Choose between small, medium, or large plants. (UI placeholder for Step 2)
        </ThemedText>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.plantPrimary, opacity: pressed ? 0.5 : 1.0 },
        ]}
        onPress={() => router.push('/onboarding/language')}>
        <ThemedText type="smallBold" style={styles.buttonText}>
          Next: Choose Language
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
