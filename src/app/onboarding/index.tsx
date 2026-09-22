import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MinTapTarget, Spacing } from '@/constants/theme';
import { useLocalization } from '@/hooks/useLocalization';
import { useTheme } from '@/hooks/use-theme';
import { useZenBalanceStore, type Language } from '@/hooks/use-zenbalance-store';
import { hapticSelect } from '@/lib/haptics';

/** Native names, so each option is readable whichever language you arrive with. */
const LanguageOptions: { code: Language; name: string; greeting: string }[] = [
  { code: 'nl', name: 'Nederlands', greeting: 'Hallo' },
  { code: 'en', name: 'English', greeting: 'Hello' },
];

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const setLanguage = useZenBalanceStore((s) => s.setLanguage);
  // Pre-selected from the device locale by the store's default, and committed on
  // tap — so every string on screen flips to the new language immediately.
  const { t, language } = useLocalization();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.hero}>
        <ThemedText style={styles.mark}>🌱</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {t.onboarding.welcome}
        </ThemedText>
        <ThemedText type="title" themeColor="plantPrimary">
          {t.onboarding.appName}
        </ThemedText>
        <ThemedText type="default" style={styles.tagline}>
          {t.onboarding.tagline}
        </ThemedText>
      </View>

      <View style={styles.picker}>
        <ThemedText type="heading" style={styles.pickerTitle}>
          {t.onboarding.languageQuestion}
        </ThemedText>

        {LanguageOptions.map((option) => (
          <LanguageCard
            key={option.code}
            name={option.name}
            greeting={option.greeting}
            isSelected={option.code === language}
            onPress={() => {
              setLanguage(option.code);
              hapticSelect();
            }}
          />
        ))}

        <ThemedText type="caption" themeColor="textSecondary" style={styles.pickerTitle}>
          {t.onboarding.languageHint}
        </ThemedText>
      </View>

      <PrimaryButton
        label={t.onboarding.continue}
        onPress={() => router.push('/onboarding/tutorial')}
      />
    </ThemedView>
  );
}

function LanguageCard({
  name,
  greeting,
  isSelected,
  onPress,
}: {
  name: string;
  greeting: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}>
      <ThemedView
        type={isSelected ? 'surface' : 'surfaceMuted'}
        style={[styles.card, { borderColor: isSelected ? theme.plantPrimary : 'transparent' }]}>
        <View style={styles.cardText}>
          <ThemedText type="heading">{name}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {greeting}
          </ThemedText>
        </View>
        {isSelected ? (
          <SymbolView
            name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
            size={26}
            tintColor={theme.plantPrimary}
          />
        ) : null}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.five,
  },
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.one,
  },
  mark: {
    fontSize: 56,
    marginBottom: Spacing.two,
  },
  tagline: {
    textAlign: 'center',
    maxWidth: 300,
    marginTop: Spacing.two,
  },
  picker: {
    gap: Spacing.two,
  },
  pickerTitle: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  card: {
    minHeight: MinTapTarget + Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 2,
  },
  cardText: {
    flex: 1,
    gap: Spacing.half,
  },
});
