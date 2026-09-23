import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRootNavigationState,
  useRouter,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MinTapTarget, Spacing } from '@/constants/Theme';
import { useLocalization } from '@/hooks/UseLocalization';
import { useReduceMotion } from '@/hooks/UseReduceMotion';
import { useTheme } from '@/hooks/UseTheme';

type NavState = { key?: string; routes: { name: string; state?: NavState }[] };

// Depth-first, because useRootNavigationState() sits above expo-router's own
// wrapper navigators, so the exact nesting depth isn't something to hardcode.
function findStackKey(state: NavState | undefined, routeName: string): string | undefined {
  for (const route of state?.routes ?? []) {
    if (route.name === routeName) return route.state?.key;
    const found = findStackKey(route.state, routeName);
    if (found) return found;
  }
}

/** The "place your phone down" instruction screen shown before a focus session starts. */
export default function SessionReadyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const sessionTheme = useTheme('session');
  const { durationSeconds, droplets } = useLocalSearchParams<{
    durationSeconds?: string;
    droplets?: string;
  }>();
  const reduceMotion = useReduceMotion();
  const navigation = useNavigation();
  const rootState = useRootNavigationState();

  const startSession = () => {
    // The duration picker is still on (home)'s own stack underneath this
    // full-screen modal; left there, it flashes on screen when the result
    // screen closes. Pop it now, while it's hidden. Targeting that stack by
    // key means the action goes to it directly instead of bubbling up to the
    // root stack (which would close this modal instead), and it's a quiet no-op if
    // that stack is already at Home.
    const homeKey = findStackKey(rootState, '(home)');
    if (homeKey) navigation.dispatch({ type: 'POP_TO_TOP', target: homeKey });
    router.replace({ pathname: '/session', params: { durationSeconds, droplets } });
  };

  const settle = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      settle.value = 0.5;
      return;
    }
    settle.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true
    );
  }, [reduceMotion, settle]);

  const phoneStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(settle.value, [0, 1], [0, -6]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(settle.value, [0, 1], [0.45, 0.85]),
    transform: [{ scale: interpolate(settle.value, [0, 1], [0.94, 1.05]) }],
  }));

  const steps = [t.session.readyStep1, t.session.readyStep2, t.session.readyStep3];

  return (
    <ThemedView
      mode="session"
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.session.readyClose}
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.closeButton,
          { top: insets.top + Spacing.three, opacity: pressed ? 0.5 : 1.0 },
        ]}>
        <SymbolView
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          size={20}
          tintColor={sessionTheme.textSecondary}
        />
      </Pressable>

      <View style={styles.header}>
        <ThemedText mode="session" type="title">
          {t.session.readyTitle}
        </ThemedText>
        <ThemedText mode="session" type="default" themeColor="textSecondary" style={styles.subtitle}>
          {t.session.readySubtitle}
        </ThemedText>
      </View>

      <View style={styles.illustration}>
        <Animated.View
          style={[
            styles.glow,
            glowStyle,
            { backgroundColor: sessionTheme.plantGlow, shadowColor: sessionTheme.plantGlow },
          ]}
        />
        <Animated.View style={[styles.phone, phoneStyle, { borderColor: sessionTheme.text }]} />
      </View>

      <View style={styles.steps}>
        {steps.map((step) => (
          <View key={step} style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: sessionTheme.plantGlow }]} />
            <ThemedText mode="session" type="default" style={styles.stepText}>
              {step}
            </ThemedText>
          </View>
        ))}
      </View>

      <PrimaryButton
        mode="session"
        label={t.session.readyCta}
        onPress={startSession}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.four,
    width: MinTapTarget,
    height: MinTapTarget,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    gap: Spacing.two,
    marginTop: Spacing.seven,
  },
  subtitle: {
    maxWidth: 300,
  },
  illustration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 70,
    borderRadius: 999,
    shadowOpacity: 0.55,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  phone: {
    width: 76,
    height: 140,
    borderRadius: 20,
    borderWidth: 2,
  },
  steps: {
    gap: Spacing.three,
    marginBottom: Spacing.six,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepText: {
    flex: 1,
  },
});
