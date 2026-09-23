import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from './ThemedText';

import { useReduceMotion } from '@/hooks/UseReduceMotion';

function formatRemaining(totalSeconds: number) {
  const seconds = Math.ceil(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

/**
 * The session countdown, shared by solo and Together sessions. No looping
 * animation running for the whole session (that's what cost battery) — the
 * number gets a soft one-shot settle each time the second changes instead.
 */
export function SessionCountdown({ seconds }: { seconds: number }) {
  const reduceMotion = useReduceMotion();
  const tick = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    tick.value = 0.4;
    tick.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
  }, [seconds, reduceMotion, tick]);

  const timerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tick.value, [0.4, 1], [0.5, 1]),
    transform: [{ translateY: interpolate(tick.value, [0.4, 1], [4, 0]) }],
  }));

  return (
    <Animated.View style={timerStyle}>
      <ThemedText mode="session" type="timer" style={styles.timerText}>
        {formatRemaining(seconds)}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Softer than session-text's default #D8D8D2 — this is the one giant, stared-at
  // number on the screen, so it gets a touch more dimming than regular session copy.
  timerText: {
    color: '#C6C4BD',
  },
});
