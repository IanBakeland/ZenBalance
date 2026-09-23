import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, type ImageSource } from 'expo-image';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { FlowerRevealModal } from '@/components/FlowerRevealModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SessionCountdown } from '@/components/SessionCountdown';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MinTapTarget, PillRadius, Spacing } from '@/constants/theme';
import { findTogetherFlower, TogetherFlowers } from '@/data/plants';
import { useLocalization } from '@/hooks/useLocalization';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useSessionTimer, type SessionOutcome } from '@/hooks/useSessionTimer';
import { useStillnessDetector } from '@/hooks/useStillnessDetector';
import { useTheme } from '@/hooks/use-theme';
import { useTogetherSession } from '@/hooks/useTogetherSession';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';
import { hapticFailure, hapticMovementWarning, hapticSelect } from '@/lib/haptics';
import {
  confirmSurvived,
  killPlant,
  localFocusStart,
  type TogetherSession,
} from '@/lib/together';

/** Loads the shared document, then hands off to the run once there's a shared start. */
export default function TogetherSessionScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { t } = useLocalization();
  const { session, status } = useTogetherSession(code);
  const start = session ? localFocusStart(session) : null;

  if (!session || start === null || !code) {
    return (
      <ThemedView mode="session" style={styles.loading}>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        <StatusBar style="light" />
        <ThemedText mode="session" type="default" themeColor="textSecondary">
          {status === 'connecting' ? t.together.connecting : t.together.errorGeneric}
        </ThemedText>
        {status !== 'connecting' ? (
          <PrimaryButton mode="session" label={t.together.backToTogether} onPress={() => router.back()} />
        ) : null}
      </ThemedView>
    );
  }

  return <TogetherRun code={code} session={session} start={start} />;
}

type Verification = 'granted' | 'denied' | 'unreachable';

function TogetherRun({ code, session, start }: { code: string; session: TogetherSession; start: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const deviceId = useZenBalanceStore((s) => s.deviceId);
  const displayName = useZenBalanceStore((s) => s.displayName);
  const collectFlower = useZenBalanceStore((s) => s.collectFlower);
  const flower = findTogetherFlower(session.flowerId) ?? TogetherFlowers[0];
  const duration = session.durationSeconds;

  // Same rule as a solo session: the screen stays on for the sensor.
  useKeepAwake();

  // --- Local end of the session, and the shared kill -------------------------

  const plantAliveRef = useRef(session.plantAlive);
  useEffect(() => {
    plantAliveRef.current = session.plantAlive;
  });

  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const handleComplete = useCallback(
    (result: SessionOutcome) => {
      setOutcome(result);
      // Moving (or leaving) kills the plant for EVERYONE — unless someone
      // else's move already did, in which case there's nothing to write.
      if (result !== 'success' && plantAliveRef.current) {
        killPlant(code, deviceId, displayName.trim() || '?').catch(() => {});
      }
    },
    [code, deviceId, displayName]
  );
  const { remainingSeconds, finish } = useSessionTimer({
    durationSeconds: duration,
    startTime: start,
    onComplete: handleComplete,
  });

  const leadIn = Math.ceil(Math.max(0, remainingSeconds - duration));
  const displaySeconds = Math.max(0, Math.ceil(Math.min(remainingSeconds, duration)));
  const isLeadIn = leadIn > 0 && !outcome;

  // Only watched once everyone has had the lead-in to lay their phone down.
  const { isStill, isWarning } = useStillnessDetector(!isLeadIn && !outcome && session.plantAlive);
  useEffect(() => {
    if (!isStill) finish('moved');
  }, [isStill, finish]);
  useEffect(() => {
    if (isWarning) hapticMovementWarning();
  }, [isWarning]);

  // Someone else's phone moved: stop our timer too. No write — see handleComplete.
  useEffect(() => {
    if (!session.plantAlive) finish('moved');
  }, [session.plantAlive, finish]);

  // The plant starts growing — one quiet tick so everyone feels it begin.
  const wasLeadIn = useRef(isLeadIn);
  useEffect(() => {
    if (wasLeadIn.current && !isLeadIn && !outcome) hapticSelect();
    wasLeadIn.current = isLeadIn;
  }, [isLeadIn, outcome]);

  // --- The reward gate ---------------------------------------------------------
  //
  // The timer reaching zero on this phone is NOT enough to earn the flower —
  // the server has to confirm the shared plant survived the full time.

  const [verification, setVerification] = useState<Verification | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (outcome !== 'success') return;
    let cancelled = false;
    confirmSurvived(code).then(
      (survived) => {
        if (cancelled) return;
        if (survived) {
          setIsNew(!(flower.id in useZenBalanceStore.getState().collectedAt));
          collectFlower(flower.id);
        }
        setVerification(survived ? 'granted' : 'denied');
      },
      () => !cancelled && setVerification('unreachable')
    );
    return () => {
      cancelled = true;
    };
  }, [outcome, attempt, code, flower.id, collectFlower]);

  const isDead =
    !session.plantAlive || outcome === 'moved' || outcome === 'cancelled' || verification === 'denied';

  useEffect(() => {
    if (isDead) hapticFailure();
  }, [isDead]);

  // Our own move may not have reached the server yet, so a local 'moved' with
  // no recorded killer is us too.
  const killedByMe =
    session.killedById === deviceId ||
    (!session.killedById && (outcome === 'moved' || outcome === 'cancelled'));
  const whoText = killedByMe
    ? t.together.diedByYou
    : session.killedBy
      ? t.together.diedBy.replace('{name}', session.killedBy)
      : null;
  const members = Object.entries(session.members)
    .map(([id, member]) => ({ id, ...member }))
    .sort((a, b) => (a.joinedAt?.toMillis() ?? 0) - (b.joinedAt?.toMillis() ?? 0));

  const growth = isLeadIn ? 0 : 1 - displaySeconds / duration;

  return (
    <ThemedView
      mode="session"
      style={[styles.container, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.four }]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <StatusBar style="light" hidden={!outcome && !isLeadIn} animated />

      <View style={styles.members}>
        {members.map((member) => (
          <Animated.View key={member.id} entering={FadeIn.duration(400)}>
            <Avatar
              id={member.id}
              name={member.name}
              size={36}
              mode="session"
              dimmed={isDead && member.id === session.killedById}
            />
          </Animated.View>
        ))}
      </View>

      <View style={styles.center}>
        <SharedPlant image={flower.image} growth={growth} isDead={isDead} />

        {isDead ? (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.callout}>
            <ThemedView mode="session" type="surfaceMuted" style={styles.calloutCard}>
              <ThemedText mode="session" type="subtitle" themeColor="dangerMuted" style={styles.centered}>
                {t.together.diedTitle}
              </ThemedText>
              {whoText ? (
                <ThemedText mode="session" type="default" style={styles.centered}>
                  {whoText}
                </ThemedText>
              ) : null}
              <ThemedText mode="session" type="caption" themeColor="textSecondary" style={styles.centered}>
                {t.together.diedHint}
              </ThemedText>
            </ThemedView>
          </Animated.View>
        ) : isLeadIn ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.textGroup}>
            <ThemedText mode="session" type="subtitle">
              {t.together.leadInTitle}
            </ThemedText>
            <ThemedText mode="session" type="caption" themeColor="textSecondary" style={styles.centered}>
              {t.together.leadInHint}
            </ThemedText>
            <ThemedText mode="session" type="timer" themeColor="plantGlow">
              {leadIn}
            </ThemedText>
          </Animated.View>
        ) : outcome === 'success' && verification !== 'granted' ? (
          <View style={styles.textGroup}>
            <ThemedText mode="session" type="default" themeColor="textSecondary" style={styles.centered}>
              {verification === 'unreachable' ? t.together.verifyFailed : t.together.verifying}
            </ThemedText>
            {verification === 'unreachable' ? (
              <PrimaryButton
                mode="session"
                label={t.together.retry}
                onPress={() => {
                  setVerification(null);
                  setAttempt((n) => n + 1);
                }}
              />
            ) : null}
          </View>
        ) : outcome !== 'success' ? (
          <View style={styles.textGroup}>
            <SessionCountdown seconds={displaySeconds} />
            <ThemedText mode="session" type="caption" themeColor="textSecondary" style={styles.centered}>
              {t.together.keepAlive}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {isDead || verification === 'granted' ? (
        <PrimaryButton mode="session" label={t.together.backToTogether} onPress={() => router.back()} />
      ) : !outcome ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => finish('cancelled')}
          style={({ pressed }) => [styles.stopButton, { opacity: pressed ? 0.4 : 0.7 }]}>
          <ThemedText mode="session" type="small" themeColor="textSecondary">
            {t.together.stop}
          </ThemedText>
        </Pressable>
      ) : null}

      <FlowerRevealModal
        plant={verification === 'granted' ? flower : undefined}
        isNew={isNew}
        title={t.together.completeTitle}
        body={isNew ? t.together.completeBody : t.together.completeBodyRepeat}
        primaryLabel={t.together.backToTogether}
        onChooseNext={() => router.back()}
        onViewCollection={() =>
          router.dismissTo({ pathname: '/collection', params: { highlight: flower.id } })
        }
        onClose={() => router.back()}
      />
    </ThemedView>
  );
}

/**
 * The group's one plant. Everyone derives `growth` from the same shared start,
 * so every phone shows the same stage without syncing it separately.
 * Dying is the one place allowed punchier motion (STYLE_GUIDE.md section 7):
 * a quick droop and fade to a withered silhouette.
 */
function SharedPlant({ image, growth, isDead }: { image: ImageSource; growth: number; isDead: boolean }) {
  const sessionTheme = useTheme('session');
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const size = Math.min(240, width * 0.6);
  const grow = useSharedValue(growth);
  const wilt = useSharedValue(isDead ? 1 : 0);

  useEffect(() => {
    grow.value = reduceMotion ? growth : withTiming(growth, { duration: 900, easing: Easing.inOut(Easing.cubic) });
  }, [growth, reduceMotion, grow]);
  useEffect(() => {
    if (!isDead) return;
    wilt.value = reduceMotion ? 1 : withTiming(1, { duration: 700, easing: Easing.in(Easing.cubic) });
  }, [isDead, reduceMotion, wilt]);

  const plantStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(wilt.value, [0, 1], [0, 14]) },
      { rotate: `${interpolate(wilt.value, [0, 1], [0, 16])}deg` },
      { scale: interpolate(grow.value, [0, 1], [0.45, 1]) * interpolate(wilt.value, [0, 1], [1, 0.88]) },
    ],
  }));
  const colourStyle = useAnimatedStyle(() => ({ opacity: interpolate(wilt.value, [0, 1], [1, 0]) }));
  const witheredStyle = useAnimatedStyle(() => ({ opacity: interpolate(wilt.value, [0, 1], [0, 0.75]) }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(grow.value, [0, 1], [0.1, 0.28]) * interpolate(wilt.value, [0, 1], [1, 0]),
  }));

  return (
    <View style={[styles.plantStage, { width: size * 1.25, height: size * 1.25 }]}>
      <Animated.View style={[styles.glow, glowStyle, { backgroundColor: sessionTheme.plantGlow }]} />
      <Animated.View style={[{ width: size, height: size }, plantStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, colourStyle]}>
          <Image source={image} style={styles.fill} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, witheredStyle]}>
          <Image source={image} style={styles.fill} contentFit="contain" tintColor={sessionTheme.dangerMuted} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  members: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  center: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
  },
  plantStage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  textGroup: {
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  centered: {
    textAlign: 'center',
  },
  callout: {
    alignSelf: 'stretch',
  },
  calloutCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  stopButton: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    borderRadius: PillRadius,
  },
});
