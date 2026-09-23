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
 * browser has no vibration API, so no platform guard is needed here. Every
 * call swallows rejections, so a missing haptic engine never surfaces as an error.
 */

// Devices without a haptic engine (or with it switched off) reject; that's fine.
function ignore() {}

/** Moving through a set of choices — the lightest tick there is. */
export function hapticSelect() {
  if (Platform.OS === 'android') {
    return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Frequent_Tick).catch(ignore);
  }
  return Haptics.selectionAsync().catch(ignore);
}

/** A primary button press. Deliberately not wired to back/navigation taps. */
export function hapticTap() {
  if (Platform.OS === 'android') {
    return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key).catch(ignore);
  }
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
}

/** A decision that landed: onboarding finished, plant chosen, session completed. */
export function hapticCommit() {
  if (Platform.OS === 'android') {
    return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(ignore);
  }
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
}

/**
 * The phone just started moving, mid-session — a heads-up before the session
 * actually fails, not the failure itself. STYLE_GUIDE.md section 5: should
 * register as "oops," not an alarm, so this stays one tier below `hapticFailure`.
 */
export function hapticMovementWarning() {
  if (Platform.OS === 'android') {
    return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press).catch(ignore);
  }
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(ignore);
}

/** The session actually failed — movement was sustained past the debounce window. */
export function hapticFailure() {
  if (Platform.OS === 'android') {
    return Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject).catch(ignore);
  }
  return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(ignore);
}
