import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from './PrimaryButton';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLocalization } from '@/hooks/useLocalization';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';
import { hapticCommit } from '@/lib/haptics';

/**
 * The one tutorial in the app. Two routes render it: `onboarding/tutorial` on a
 * first launch, and `(home)/tutorial` when it's opened again from the ⓘ button.
 * Only the footer differs — the first run commits onboarding, a replay just goes back.
 */
export default function TutorialScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const completeOnboarding = useZenBalanceStore((s) => s.completeOnboarding);
  const insets = useSafeAreaInsets();
  // Read once at mount rather than subscribing: finishing onboarding flips this
  // flag, and the footer must not change under the user's finger mid-press.
  const [isReplay] = useState(() => useZenBalanceStore.getState().hasCompletedOnboarding);

  const steps = [
    { icon: '📵', title: t.onboarding.step1Title, body: t.onboarding.step1Body },
    { icon: '💧', title: t.onboarding.step2Title, body: t.onboarding.step2Body },
    { icon: '🌿', title: t.onboarding.step3Title, body: t.onboarding.step3Body },
  ];

  return (
    <ThemedView
      style={[
        styles.container,
        // The replay lives inside the Home tab, so the floating native tab bar
        // would otherwise sit on top of the button. Onboarding has no tab bar.
        isReplay && { paddingBottom: insets.bottom + BottomTabInset + Spacing.three },
      ]}>
      <Stack.Screen options={{ title: t.onboarding.tutorialHeaderTitle, headerShadowVisible: false }} />

      <View style={styles.intro}>
        <ThemedText type="title">{t.onboarding.tutorialTitle}</ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          {t.onboarding.tutorialIntro}
        </ThemedText>
      </View>

      <View style={styles.steps}>
        {steps.map((step, index) => (
          <RevealStep key={step.title} delay={index * 220}>
            <ThemedView type="surfaceMuted" style={styles.badge}>
              <ThemedText style={styles.badgeIcon}>{step.icon}</ThemedText>
            </ThemedView>
            <View style={styles.stepText}>
              <ThemedText type="heading">{step.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {step.body}
              </ThemedText>
            </View>
          </RevealStep>
        ))}
      </View>

      <View style={styles.footer}>
        {isReplay ? null : (
          <ThemedText type="caption" themeColor="plantPrimary" style={styles.note}>
            {t.onboarding.plantNote}
          </ThemedText>
        )}
        <PrimaryButton
          label={isReplay ? t.onboarding.replayCta : t.onboarding.cta}
          onPress={() => {
            if (isReplay) {
              // canGoBack is false when the tutorial was deep-linked straight in,
              // which would otherwise dead-end the user on this screen.
              if (router.canGoBack()) router.back();
              else router.replace('/');
              return;
            }
            hapticCommit();
            // Flipping the store is the whole navigation: the root Stack's guard
            // swaps the onboarding stack out for the tabs.
            completeOnboarding();
          }}
        />
      </View>
    </ThemedView>
  );
}

/**
 * Fades and lifts one step into place. Slow, ease-out, no overshoot, per
 * STYLE_GUIDE.md section 5 — and because it's only a fade plus a few pixels,
 * it already is the "reduce motion" fallback that section 8 asks for.
 */
function RevealStep({ delay, children }: { delay: number; children: React.ReactNode }) {
  // useState, not useRef: an Animated.Value is read during render to build the
  // style, which the react-hooks/refs lint rule rightly disallows for refs.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 700,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        styles.step,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.five,
  },
  intro: {
    gap: Spacing.two,
  },
  steps: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 26,
  },
  stepText: {
    flex: 1,
    gap: Spacing.half,
  },
  footer: {
    gap: Spacing.three,
  },
  note: {
    textAlign: 'center',
  },
});
