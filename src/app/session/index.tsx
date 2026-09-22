import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MinTapTarget, Spacing } from '@/constants/theme';
import { useLocalization } from '@/hooks/useLocalization';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useSessionTimer, type SessionOutcome } from '@/hooks/useSessionTimer';
import { useStillnessDetector } from '@/hooks/useStillnessDetector';
import { useTheme } from '@/hooks/use-theme';
import { hapticCommit, hapticFailure, hapticMovementWarning, hapticSelect } from '@/lib/haptics';

// Home doesn't have a duration picker yet (Step 3 leftover) — 25 min matches its label.
const DEFAULT_DURATION_SECONDS = 25 * 60;

function formatRemaining(totalSeconds: number) {
  const seconds = Math.ceil(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

/**
 * The immersive, tab-bar-free focus mode: just the countdown, which settles
 * into place with each passing second instead of a continuously animated
 * decoration. Deliberately bare — everything non-essential was cut per the
 * "meditative focus screen, not a traditional timer UI" brief.
 */
export default function SessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const sessionTheme = useTheme('session');
  const reduceMotion = useReduceMotion();
  const { durationSeconds: durationParam } = useLocalSearchParams<{ durationSeconds?: string }>();
  const durationSeconds = Number(durationParam) || DEFAULT_DURATION_SECONDS;

  // Screen must not auto-lock for the whole session (PROJECT_PLAN.md Step 7) —
  // released automatically the moment this screen unmounts.
  useKeepAwake();

  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const handleComplete = useCallback((result: SessionOutcome) => setOutcome(result), []);
  const { remainingSeconds, finish } = useSessionTimer({ durationSeconds, onComplete: handleComplete });
  const displaySeconds = Math.max(0, Math.ceil(remainingSeconds));

  // Real stillness check (Step 6) — replaces the old "manual stop only"
  // placeholder rule. Disabled once there's already an outcome, so it stops
  // sampling the sensor the instant the session ends either way.
  const { isStill, isWarning } = useStillnessDetector(!outcome);
  useEffect(() => {
    if (!isStill) finish('moved');
  }, [isStill, finish]);

  // Step 11 haptics: a light heads-up the moment movement starts, a bigger
  // one once it's confirmed as a real failure, and — distinctly softer —
  // one for a deliberate manual Stop. (No "droplet earned" haptic yet:
  // that needs Step 5's droplet-awarding logic, which isn't wired up.)
  useEffect(() => {
    if (isWarning) hapticMovementWarning();
  }, [isWarning]);

  useEffect(() => {
    if (outcome === 'success') hapticCommit();
    else if (outcome === 'moved') hapticFailure();
    else if (outcome === 'cancelled') hapticSelect();
  }, [outcome]);

  // No looping animation running for the whole session (that's what cost
  // battery). Instead the countdown itself gets a soft one-shot settle each
  // time the second changes — a few hundred ms of work once a second, not a
  // continuous 60fps loop for the full 25–45 minutes the screen stays on.
  const tick = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    tick.value = 0.4;
    tick.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
  }, [displaySeconds, reduceMotion, tick]);

  const timerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tick.value, [0.4, 1], [0.5, 1]),
    transform: [{ translateY: interpolate(tick.value, [0.4, 1], [4, 0]) }],
  }));

  // Three distinct outcomes get three distinct looks — "you moved" (a real
  // sensor failure) reads differently from "you ended it" (a deliberate
  // Stop tap) and from a completed session (STYLE_GUIDE.md's warning-soft
  // token is reserved for movement specifically).
  const accentColor =
    outcome === 'moved'
      ? sessionTheme.warningSoft
      : outcome === 'cancelled'
        ? sessionTheme.textSecondary
        : sessionTheme.dropletGlow;

  return (
    <ThemedView
      mode="session"
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.five },
      ]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      {/* Hidden only while the countdown is actually running — restored the
          moment there's an outcome, same as the tab bar reappearing on exit. */}
      <StatusBar style="light" hidden={!outcome} animated />

      <View style={styles.center}>
        {outcome ? (
          <>
            <View style={[styles.outcomeBadge, { backgroundColor: accentColor }]}>
              <SymbolView
                name={
                  outcome === 'success'
                    ? { ios: 'checkmark', android: 'check', web: 'check' }
                    : outcome === 'moved'
                      ? { ios: 'hand.raised', android: 'front_hand', web: 'front_hand' }
                      : { ios: 'xmark', android: 'close', web: 'close' }
                }
                size={36}
                tintColor={sessionTheme.background}
              />
            </View>
            <ThemedText mode="session" type="subtitle" style={styles.outcomeTitle}>
              {outcome === 'success'
                ? t.session.successTitle
                : outcome === 'moved'
                  ? t.session.movedTitle
                  : t.session.cancelledTitle}
            </ThemedText>
          </>
        ) : (
          <Animated.View style={timerStyle}>
            <ThemedText mode="session" type="timer" style={styles.timerText}>
              {formatRemaining(displaySeconds)}
            </ThemedText>
          </Animated.View>
        )}
      </View>

      {outcome ? (
        <PrimaryButton mode="session" label={t.session.done} onPress={() => router.back()} />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => finish('cancelled')}
          style={({ pressed }) => [styles.stopButton, { opacity: pressed ? 0.4 : 0.7 }]}>
          <ThemedText mode="session" type="small" themeColor="textSecondary">
            {t.session.stop}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.six,
  },
  outcomeBadge: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  outcomeTitle: {
    textAlign: 'center',
  },
  // Softer than session-text's default #D8D8D2 — this is the one giant, stared-at
  // number on the screen, so it gets a touch more dimming than regular session copy.
  timerText: {
    color: '#C6C4BD',
  },
  stopButton: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
});
