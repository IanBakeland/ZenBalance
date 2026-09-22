import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Every haptic in the app goes through here, so intensity stays tunable in one
 * place — turn a level down if it starts to feel naggy on a real device.
 *
 * Android deliberately uses `performAndroidHapticsAsync` rather than
 * `impactAsync`: the latter drives the raw Vibrator (a buzz, and it wants the
 * VIBRATE permission), while these are the system's own soft haptics.
 *
 * Web is handled by expo-haptics itself and degrades to nothing where the
 * browser has no vibration API, so no platform guard is needed here.
 */

/** Moving through a set of choices — the lightest tick there is. */
export function hapticSelect() {
  if (Platform.OS === 'android') {
    return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Frequent_Tick);
  }
  return Haptics.selectionAsync();
}

/** A primary button press. Deliberately not wired to back/navigation taps. */
export function hapticTap() {
  if (Platform.OS === 'android') {
    return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key);
  }
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** A decision that landed: onboarding finished, plant chosen, session completed. */
export function hapticCommit() {
  if (Platform.OS === 'android') {
    return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
  }
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
