import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import Animated, { Easing, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MinTapTarget, Spacing } from '@/constants/theme';
import { SoloPlants } from '@/data/plants';
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
  const theme = useTheme();
  const setLanguage = useZenBalanceStore((s) => s.setLanguage);
  // Pre-selected from the device locale by the store's default, and committed on
  // tap — so every string on screen flips to the new language immediately.
  const { t, language } = useLocalization();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.hero}>
        <Animated.View entering={ZoomIn.duration(700).easing(Easing.out(Easing.cubic))} style={styles.mark}>
          <View style={[styles.markHalo, { backgroundColor: theme.plantAccent }]} />
          <ThemedView type="surface" style={styles.markPot}>
            <Image source={SoloPlants[0].image} style={styles.markFlower} contentFit="contain" />
          </ThemedView>
        </Animated.View>
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

      <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.picker}>
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
      </Animated.View>

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
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  markHalo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.2,
  },
  markPot: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  markFlower: {
    width: 84,
    height: 84,
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
