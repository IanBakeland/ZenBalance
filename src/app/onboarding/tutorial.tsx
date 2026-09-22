import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { useLocalization } from '@/hooks/useLocalization';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';
import { hapticCommit } from '@/lib/haptics';

export default function OnboardingTutorialScreen() {
  const { t } = useLocalization();
  const completeOnboarding = useZenBalanceStore((s) => s.completeOnboarding);

  const steps = [
    { icon: '📵', title: t.onboarding.step1Title, body: t.onboarding.step1Body },
    { icon: '💧', title: t.onboarding.step2Title, body: t.onboarding.step2Body },
    { icon: '🌿', title: t.onboarding.step3Title, body: t.onboarding.step3Body },
  ];

  return (
    <ThemedView style={styles.container}>
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
        <ThemedText type="caption" themeColor="plantPrimary" style={styles.note}>
          {t.onboarding.plantNote}
        </ThemedText>
        <PrimaryButton
          label={t.onboarding.cta}
          onPress={() => {
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
