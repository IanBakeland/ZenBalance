import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Stack, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, type ImageSource } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useNetInfo } from '@react-native-community/netinfo';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MaxContentWidth, MinTapTarget, PillRadius, Spacing } from '@/constants/theme';
import { findTogetherFlower, TogetherFlowers } from '@/data/plants';
import { formatDuration } from '@/data/sessionDurations';
import { useLocalization } from '@/hooks/useLocalization';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';
import { useTogetherSession } from '@/hooks/useTogetherSession';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';
import { hapticMovementWarning, hapticSelect } from '@/lib/haptics';
import { chooseFlower, leaveSession, startSession } from '@/lib/together';

export default function TogetherLobbyScreen() {
  const { code: codeParam } = useLocalSearchParams<{ code: string }>();
  const code = String(codeParam ?? '').toUpperCase();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useLocalization();
  const netInfo = useNetInfo();
  const { width } = useWindowDimensions();
  const deviceId = useZenBalanceStore((s) => s.deviceId);
  const { session, status } = useTogetherSession(code);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = session?.hostId === deviceId;
  const hasStarted = !!session?.startTimestamp;
  const flower = findTogetherFlower(session?.flowerId) ?? TogetherFlowers[0];
  const members = Object.entries(session?.members ?? {})
    .map(([id, member]) => ({ id, ...member }))
    .sort((a, b) => (a.joinedAt?.toMillis() ?? Infinity) - (b.joinedAt?.toMillis() ?? Infinity));

  // Someone new sat down at the table — a light tick, not on the first load.
  const seenCount = useRef<number | null>(null);
  useEffect(() => {
    if (status !== 'live') return;
    if (seenCount.current !== null && members.length > seenCount.current) hapticSelect();
    seenCount.current = members.length;
  }, [members.length, status]);

  // The shared start timestamp appearing is what moves EVERY device into the
  // session — nobody is sent a "go" message of their own.
  const startedFor = useRef(false);
  useEffect(() => {
    if (!hasStarted || startedFor.current) return;
    startedFor.current = true;
    router.push({ pathname: '/session/together', params: { code } });
  }, [hasStarted, code, router]);

  // Coming back from the session means it's over — this lobby is spent, so
  // step back to the Together tab instead of showing a finished session.
  const isFocused = useIsFocused();
  const wentToSession = useRef(false);
  useEffect(() => {
    if (!startedFor.current) return;
    if (!isFocused) wentToSession.current = true;
    else if (wentToSession.current) router.back();
  }, [isFocused, router]);

  // Leaving the lobby before the start removes you (or closes it, for the host).
  // Once started, the session screen owns what leaving means.
  const leaveInfo = useRef({ isHost, deviceId });
  useEffect(() => {
    leaveInfo.current = { isHost, deviceId };
  });
  useEffect(
    () => () => {
      if (!startedFor.current) leaveSession(code, leaveInfo.current.deviceId, leaveInfo.current.isHost);
    },
    [code]
  );

  async function start() {
    setBusy(true);
    setError(null);
    try {
      await startSession(code);
    } catch {
      setError(t.together.errorGeneric);
      hapticMovementWarning();
    } finally {
      setBusy(false);
    }
  }

  const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;
  const stageSize = Math.min(width - Spacing.four * 2, 320);

  if (status !== 'live' || !session || (session.closed && !isHost)) {
    const message =
      status === 'connecting'
        ? t.together.connecting
        : status === 'missing'
          ? t.together.errorNotFound
          : session?.closed
            ? t.together.sessionClosed
            : t.together.errorGeneric;
    return (
      <ThemedView style={[styles.container, styles.stateScreen, { paddingBottom: insets.bottom + BottomTabInset }]}>
        <Stack.Screen options={{ title: t.together.title, headerShadowVisible: false }} />
        <Animated.View entering={FadeIn.duration(300)} style={styles.stateBody}>
          <SymbolView
            name={
              status === 'connecting'
                ? { ios: 'antenna.radiowaves.left.and.right', android: 'wifi', web: 'wifi' }
                : { ios: 'leaf', android: 'eco', web: 'eco' }
            }
            size={36}
            tintColor={theme.textSecondary}
          />
          <ThemedText type="default" themeColor="textSecondary" style={styles.centered}>
            {message}
          </ThemedText>
        </Animated.View>
        {status !== 'connecting' ? (
          <PrimaryButton label={t.together.backToTogether} onPress={() => router.back()} />
        ) : null}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t.together.title, headerShadowVisible: false }} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
        ]}>
        {isOffline ? (
          <Animated.View entering={FadeIn.duration(250)}>
            <ThemedView type="surfaceMuted" style={styles.offline}>
              <SymbolView name={{ ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }} size={16} tintColor={theme.warningSoft} />
              <ThemedText type="caption" themeColor="textSecondary">
                {t.together.reconnecting}
              </ThemedText>
            </ThemedView>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(450)} style={styles.codeBlock}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {t.together.inviteCode}
          </ThemedText>
          <View style={styles.codeTiles} accessible accessibilityLabel={code.split('').join(' ')}>
            {code.split('').map((letter, index) => (
              <ThemedView key={index} type="surface" style={styles.codeTile}>
                <ThemedText type="title" themeColor="plantPrimary">
                  {letter}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => Share.share({ message: t.together.shareMessage.replace('{code}', code) })}
            style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}>
            <ThemedView type="surfaceMuted" style={styles.shareChip}>
              <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} size={15} tintColor={theme.plantPrimary} />
              <ThemedText type="smallBold" themeColor="plantPrimary">
                {t.together.shareCode}
              </ThemedText>
            </ThemedView>
          </Pressable>
        </Animated.View>

        <Circle
          size={stageSize}
          flowerImage={flower.image}
          members={members}
          hostId={session.hostId}
          deviceId={deviceId}
        />

        <View style={styles.countRow}>
          <SymbolView name={{ ios: 'person.2.fill', android: 'group', web: 'group' }} size={15} tintColor={theme.plantPrimary} />
          <ThemedText type="smallBold">
            {members.length} {t.together.togetherNow}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="heading">{t.together.chooseFlower}</ThemedText>
          {!isHost ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t.together.chosenByHost}
            </ThemedText>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flowers}>
            {TogetherFlowers.map((option) => {
              const selected = option.id === flower.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: !isHost }}
                  disabled={!isHost || selected}
                  onPress={() => {
                    hapticSelect();
                    chooseFlower(code, option.id).catch(() => setError(t.together.errorGeneric));
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.5 : !isHost && !selected ? 0.45 : 1.0 }]}>
                  <ThemedView
                    type={selected ? 'surface' : 'surfaceMuted'}
                    style={[styles.flowerCard, { borderColor: selected ? theme.plantPrimary : 'transparent' }]}>
                    <Image source={option.image} style={styles.flowerImage} contentFit="contain" />
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {t.plants[`${option.id}Name`]}
                    </ThemedText>
                    <ThemedText type="caption" themeColor={option.isTest ? 'droplet' : 'textSecondary'}>
                      {formatDuration(option.togetherSeconds, t.duration.seconds, t.duration.minutes)}
                      {option.isTest ? ` · ${t.duration.testBadge}` : ''}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.footer}>
          {isHost ? (
            <>
              <PrimaryButton
                label={busy ? t.together.connecting : t.together.startCta}
                disabled={busy || isOffline}
                onPress={start}
              />
              {members.length < 2 ? (
                <ThemedText type="caption" themeColor="textSecondary" style={styles.centered}>
                  {t.together.waitingForFriends}
                </ThemedText>
              ) : null}
            </>
          ) : (
            <WaitingForHost name={session.hostName} />
          )}
          {error ? (
            <ThemedText type="small" themeColor="warningSoft" style={styles.centered}>
              {error}
            </ThemedText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.leave, { opacity: pressed ? 0.5 : 1.0 }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t.together.leave}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

/** Everyone around one pot: the bouquet in the middle, friends seated in a ring. */
function Circle({
  size,
  flowerImage,
  members,
  hostId,
  deviceId,
}: {
  size: number;
  flowerImage: ImageSource;
  members: { id: string; name: string }[];
  hostId: string;
  deviceId: string;
}) {
  const theme = useTheme();
  const { t } = useLocalization();
  const reduceMotion = useReduceMotion();
  const breathe = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    breathe.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduceMotion, breathe]);

  const potStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.97, 1.03]) }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.14, 0.24]),
  }));

  const avatarSize = 48;
  const radius = size / 2 - avatarSize / 2 - Spacing.two;
  const potSize = size * 0.46;

  return (
    <View style={[styles.circle, { width: size, height: size }]}>
      <View style={[styles.ring, { width: radius * 2, height: radius * 2, borderColor: theme.surfaceMuted }]} />
      <Animated.View
        style={[styles.halo, haloStyle, { width: potSize * 1.3, height: potSize * 1.3, backgroundColor: theme.plantAccent }]}
      />
      <Animated.View style={potStyle}>
        <ThemedView type="surface" style={[styles.pot, { width: potSize, height: potSize }]}>
          <Image
            source={flowerImage}
            style={{ width: potSize * 0.74, height: potSize * 0.74 }}
            contentFit="contain"
            transition={{ duration: 500, effect: 'cross-dissolve' }}
          />
        </ThemedView>
      </Animated.View>

      {members.map((member, index) => {
        const angle = (index / Math.max(members.length, 1)) * Math.PI * 2 - Math.PI / 2;
        return (
          <Animated.View
            key={member.id}
            entering={ZoomIn.duration(450).easing(Easing.out(Easing.cubic))}
            exiting={ZoomOut.duration(250)}
            layout={LinearTransition.duration(500).easing(Easing.inOut(Easing.cubic))}
            style={[
              styles.seat,
              {
                left: size / 2 + radius * Math.cos(angle) - 40,
                top: size / 2 + radius * Math.sin(angle) - avatarSize / 2,
              },
            ]}>
            <View>
              <Avatar id={member.id} name={member.name} size={avatarSize} />
              {member.id === hostId ? (
                <ThemedView type="surface" style={styles.hostBadge}>
                  <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} size={10} tintColor={theme.warmthAccent} />
                </ThemedView>
              ) : null}
            </View>
            <ThemedText type="caption" numberOfLines={1} style={styles.seatName}>
              {member.id === deviceId ? t.together.you : member.name}
            </ThemedText>
          </Animated.View>
        );
      })}
    </View>
  );
}

function WaitingForHost({ name }: { name: string }) {
  const theme = useTheme();
  const { t } = useLocalization();
  const reduceMotion = useReduceMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduceMotion, pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.1]) }],
  }));

  return (
    <ThemedView type="surfaceMuted" style={styles.waiting}>
      <Animated.View style={[styles.waitingDot, dotStyle, { backgroundColor: theme.plantPrimary }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {t.together.waitingForHost.replace('{name}', name)}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stateScreen: {
    padding: Spacing.four,
    justifyContent: 'center',
  },
  stateBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  content: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  centered: {
    textAlign: 'center',
  },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: PillRadius,
  },
  codeBlock: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  codeTiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  codeTile: {
    width: 48,
    height: 58,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  shareChip: {
    minHeight: MinTapTarget - 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: PillRadius,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  halo: {
    position: 'absolute',
    borderRadius: 999,
  },
  pot: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  seat: {
    position: 'absolute',
    width: 80,
    alignItems: 'center',
    gap: Spacing.half,
  },
  seatName: {
    maxWidth: 80,
    textAlign: 'center',
  },
  hostBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: -Spacing.two,
  },
  section: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  flowers: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  flowerCard: {
    width: 120,
    alignItems: 'center',
    gap: Spacing.half,
    padding: Spacing.two,
    paddingBottom: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 2,
  },
  flowerImage: {
    width: 76,
    height: 76,
    marginBottom: Spacing.one,
  },
  footer: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    alignItems: 'center',
  },
  waiting: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: PillRadius,
  },
  waitingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  leave: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
