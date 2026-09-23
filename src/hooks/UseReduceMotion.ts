import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** STYLE_GUIDE.md section 8: fall back to a static/fade look when the OS reduce-motion setting is on. */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}
