import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const UPDATE_INTERVAL_MS = 250;
// Euclidean distance between the current (x,y,z) reading and the rolling
// baseline vector, in g. Playtesting knob.
const MOVEMENT_THRESHOLD = 0.12;
// A single spike must never fail a session — require a short run of readings over threshold.
const CONSECUTIVE_READINGS_REQUIRED = 2;
// How fast the baseline drifts toward the current reading while still (0–1, higher = faster).
const BASELINE_SMOOTHING = 0.2;

/**
 * Tracks whether the phone has stayed still: each accelerometer reading's
 * full (x,y,z) vector compared against its own rolling baseline vector,
 * debounced over a couple of consecutive readings, plus an AppState
 * background/inactive check. Once `isStill` flips to `false` it stays false
 * — the caller decides what that means (session ends).
 *
 * Deliberately a per-axis vector distance, not a scalar magnitude deviation
 * (`sqrt(x²+y²+z²)` vs. its own baseline): gravity's *magnitude* stays ~1g
 * through almost any slow reorientation, so a magnitude-only check barely
 * reacts to gently picking the phone up and only ever fires on an outright
 * shake. Comparing the vector itself catches the tilt directly.
 *
 * `isWarning` flips true the moment a deviation starts (the first
 * over-threshold reading, before the debounce count is reached) and back to
 * false if it settles without ever confirming — lets the caller give an
 * early "careful" cue distinct from the final failure. AppState
 * backgrounding has no such lead-up (it's already happened by the time the
 * event fires), so it goes straight to `isStill = false`.
 */
export function useStillnessDetector(enabled: boolean) {
  const [isStill, setIsStill] = useState(true);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let baseline: { x: number; y: number; z: number } | null = null;
    let overThresholdStreak = 0;

    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    const motionSubscription = Accelerometer.addListener(({ x, y, z }) => {
      if (baseline === null) {
        baseline = { x, y, z };
        return;
      }

      const deviation = Math.sqrt(
        (x - baseline.x) ** 2 + (y - baseline.y) ** 2 + (z - baseline.z) ** 2
      );

      if (deviation > MOVEMENT_THRESHOLD) {
        overThresholdStreak += 1;
        if (overThresholdStreak === 1) setIsWarning(true);
        if (overThresholdStreak >= CONSECUTIVE_READINGS_REQUIRED) {
          setIsStill(false);
        }
      } else {
        if (overThresholdStreak > 0) setIsWarning(false);
        overThresholdStreak = 0;
        // Baseline only drifts while still, so a real pickup can't quietly
        // become the new "normal" mid-motion.
        baseline = {
          x: baseline.x + (x - baseline.x) * BASELINE_SMOOTHING,
          y: baseline.y + (y - baseline.y) * BASELINE_SMOOTHING,
          z: baseline.z + (z - baseline.z) * BASELINE_SMOOTHING,
        };
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        setIsStill(false);
      }
    });

    return () => {
      motionSubscription.remove();
      appStateSubscription.remove();
    };
  }, [enabled]);

  return { isStill, isWarning };
}
