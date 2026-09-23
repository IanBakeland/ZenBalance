import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useNetInfo } from '@react-native-community/netinfo';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MaxContentWidth, MinTapTarget, PillRadius, Spacing } from '@/constants/Theme';
import { formatDuration } from '@/data/SessionDurations';
import { TogetherFlowers } from '@/data/Plants';
import { useLocalization } from '@/hooks/UseLocalization';
import { useReduceMotion } from '@/hooks/UseReduceMotion';
import { useTheme } from '@/hooks/UseTheme';
import { useZenBalanceStore } from '@/hooks/UseZenBalanceStore';
import { isFirebaseConfigured } from '@/lib/Firebase';
import { hapticCommit, hapticMovementWarning } from '@/lib/Haptics';
import { CODE_LENGTH, hostSession, joinSession, normalizeCode, TogetherError } from '@/lib/Together';

export default function TogetherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useLocalization();
  const netInfo = useNetInfo();
  const deviceId = useZenBalanceStore((s) => s.deviceId);
  const displayName = useZenBalanceStore((s) => s.displayName);
  const setDisplayName = useZenBalanceStore((s) => s.setDisplayName);

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'host' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // `null` means "not known yet" — don't block on it, the calls time out anyway.
  const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;
  const isAvailable = isFirebaseConfigured && !isOffline;
  const name = displayName.trim();

  async function run(kind: 'host' | 'join') {
    if (!name) {
      setError(t.together.errorName);
      hapticMovementWarning();
      return;
    }
    setError(null);
    setBusy(kind);
    try {
      const sessionCode = kind === 'host' ? await hostSession(deviceId, name) : normalizeCode(code);
      if (kind === 'join') await joinSession(sessionCode, deviceId, name);
      hapticCommit();
      setCode('');
      router.push({ pathname: '/together/[code]', params: { code: sessionCode } });
    } catch (e) {
      const errorCode = e instanceof TogetherError ? e.code : 'generic';
      setError(
        errorCode === 'notFound'
          ? t.together.errorNotFound
          : errorCode === 'started'
            ? t.together.errorStarted
            : errorCode === 'closed'
              ? t.together.errorClosed
              : t.together.errorGeneric
      );
      hapticMovementWarning();
    } finally {
      setBusy(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.five,
          },
        ]}>
        <Hero />

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.steps}>
          <Step icon={{ ios: 'person.2.fill', android: 'group', web: 'group' }} label={t.together.step1} />
          <StepDivider />
          <Step icon={{ ios: 'iphone.slash', android: 'phonelink_off', web: 'phonelink_off' }} label={t.together.step2} />
          <StepDivider />
          <Step icon={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }} label={t.together.step3} />
        </Animated.View>

        {/* Quiet heads-up while online; the fuller banner below takes over when not. */}
        {isAvailable ? (
          <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.requirement}>
            <ThemedView type="surfaceMuted" style={styles.requirementPill}>
              <SymbolView name={{ ios: 'wifi', android: 'wifi', web: 'wifi' }} size={13} tintColor={theme.droplet} />
              <ThemedText type="caption" themeColor="textSecondary">
                {t.together.internetRequired}
              </ThemedText>
            </ThemedView>
          </Animated.View>
        ) : null}

        {!isAvailable ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <ThemedView type="surfaceMuted" style={styles.banner}>
              <SymbolView
                name={
                  isFirebaseConfigured
                    ? { ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }
                    : { ios: 'wrench.and.screwdriver', android: 'build', web: 'build' }
                }
                size={20}
                tintColor={theme.warningSoft}
              />
              <View style={styles.bannerText}>
                <ThemedText type="smallBold">
                  {isFirebaseConfigured ? t.together.offlineTitle : t.together.unconfiguredTitle}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {isFirebaseConfigured ? t.together.offlineBody : t.together.unconfiguredBody}
                </ThemedText>
              </View>
            </ThemedView>
          </Animated.View>
        ) : null}

        <Animated.View
          entering={FadeInDown.delay(250).duration(500)}
          style={[styles.actions, !isAvailable && styles.unavailable]}
          pointerEvents={isAvailable ? 'auto' : 'none'}>
          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t.together.nameLabel}
            </ThemedText>
            <TextInput
              value={displayName}
              onChangeText={(value) => setDisplayName(value.slice(0, 24))}
              placeholder={t.together.namePlaceholder}
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              autoComplete="given-name"
              returnKeyType="done"
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
            />
          </View>

          <ThemedView type="surface" style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedView type="surfaceMuted" style={styles.cardIcon}>
                <SymbolView
                  name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                  size={20}
                  tintColor={theme.plantPrimary}
                />
              </ThemedView>
              <View style={styles.cardText}>
                <ThemedText type="heading">{t.together.hostTitle}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t.together.hostBody}
                </ThemedText>
              </View>
            </View>
            <PrimaryButton
              label={busy === 'host' ? t.together.connecting : t.together.hostTitle}
              disabled={!isAvailable || busy !== null}
              onPress={() => run('host')}
            />
          </ThemedView>

          <ThemedView type="surface" style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedView type="surfaceMuted" style={styles.cardIcon}>
                <SymbolView
                  name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
                  size={20}
                  tintColor={theme.droplet}
                />
              </ThemedView>
              <View style={styles.cardText}>
                <ThemedText type="heading">{t.together.joinTitle}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t.together.joinBody}
                </ThemedText>
              </View>
            </View>
            <View style={styles.joinRow}>
              <TextInput
                value={code}
                onChangeText={(value) => setCode(normalizeCode(value))}
                placeholder={'•'.repeat(CODE_LENGTH)}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={CODE_LENGTH}
                returnKeyType="go"
                onSubmitEditing={() => code.length === CODE_LENGTH && run('join')}
                accessibilityLabel={t.together.inviteCode}
                style={[styles.codeInput, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
              />
              <View style={styles.joinButton}>
                <PrimaryButton
                  label={busy === 'join' ? '…' : t.together.joinCta}
                  disabled={!isAvailable || busy !== null || code.length !== CODE_LENGTH}
                  onPress={() => run('join')}
                />
              </View>
            </View>
          </ThemedView>

          {error ? (
            <Animated.View entering={FadeIn.duration(250)}>
              <ThemedText type="small" themeColor="warningSoft" style={styles.centered}>
                {error}
              </ThemedText>
            </Animated.View>
          ) : null}
        </Animated.View>

        <ExclusiveFlowers />
      </ScrollView>
    </ThemedView>
  );
}

// Where the four friends sit around the bouquet, as fractions of the stage.
const Friends = [
  { id: 'a', x: 0.1, y: 0.2, phase: 0 },
  { id: 'b', x: 0.78, y: 0.12, phase: 1.6 },
  { id: 'c', x: 0.03, y: 0.66, phase: 3.1 },
  { id: 'd', x: 0.82, y: 0.62, phase: 4.4 },
];

/** A little circle of friends around one shared bouquet — the whole idea in one picture. */
function Hero() {
  const theme = useTheme();
  const { t } = useLocalization();
  const reduceMotion = useReduceMotion();
  const time = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    time.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
  }, [reduceMotion, time]);

  const bouquetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.03 * Math.sin(time.value * Math.PI * 2) }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + 0.08 * Math.sin(time.value * Math.PI * 2),
  }));

  const colours = [theme.plantAccent, theme.droplet, theme.warmthAccent, theme.plantAccent];

  return (
    <Animated.View entering={FadeInDown.duration(550).easing(Easing.out(Easing.cubic))}>
      <ThemedView type="surface" style={styles.hero}>
        <View style={styles.heroStage}>
          <Animated.View style={[styles.heroHalo, haloStyle, { backgroundColor: theme.warmthAccent }]} />
          <ThemedView type="surfaceMuted" style={styles.heroPot}>
            <Animated.View style={[styles.heroBouquet, bouquetStyle]}>
              <Image source={TogetherFlowers[1].image} style={styles.fill} contentFit="contain" />
            </Animated.View>
          </ThemedView>
          {Friends.map((friend, index) => (
            <FloatingFriend key={friend.id} friend={friend} colour={colours[index]} time={time} />
          ))}
        </View>
        <ThemedText type="title" style={styles.heroTitle}>
          {t.together.heroTitle}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.centered}>
          {t.together.heroBody}
        </ThemedText>
      </ThemedView>
    </Animated.View>
  );
}

function FloatingFriend({
  friend,
  colour,
  time,
}: {
  friend: (typeof Friends)[number];
  colour: string;
  time: SharedValue<number>;
}) {
  const theme = useTheme();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: 5 * Math.sin(time.value * Math.PI * 2 + friend.phase) }],
  }));

  return (
    <Animated.View
      style={[
        styles.friend,
        style,
        { left: `${friend.x * 100}%`, top: `${friend.y * 100}%`, backgroundColor: colour, borderColor: theme.surface },
      ]}>
      <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} size={20} tintColor="#2B2A25" />
    </Animated.View>
  );
}

function Step({ icon, label }: { icon: SymbolViewProps['name']; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.step}>
      <ThemedView type="surface" style={styles.stepIcon}>
        <SymbolView name={icon} size={18} tintColor={theme.plantPrimary} />
      </ThemedView>
      <ThemedText type="caption" themeColor="textSecondary" style={styles.centered} numberOfLines={2}>
        {label}
      </ThemedText>
    </View>
  );
}

function StepDivider() {
  const theme = useTheme();
  return <View style={[styles.stepDivider, { backgroundColor: theme.surfaceMuted }]} />;
}

/** The bouquets you can only earn here — collected ones in colour, the rest as silhouettes. */
function ExclusiveFlowers() {
  const theme = useTheme();
  const { t } = useLocalization();
  const collectedAt = useZenBalanceStore((s) => s.collectedAt);

  return (
    <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.exclusive}>
      <View style={styles.exclusiveHeader}>
        <View style={styles.exclusiveTitle}>
          <SymbolView name={{ ios: 'person.2.fill', android: 'group', web: 'group' }} size={16} tintColor={theme.warmthAccent} />
          <ThemedText type="heading">{t.together.exclusiveTitle}</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {t.together.exclusiveBody}
        </ThemedText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bouquets}>
        {TogetherFlowers.map((flower) => {
          const collected = flower.id in collectedAt;
          return (
            <ThemedView key={flower.id} type={collected ? 'surface' : 'surfaceMuted'} style={styles.bouquet}>
              <View style={styles.bouquetArt}>
                <Image
                  source={flower.image}
                  style={[styles.fill, !collected && styles.silhouette]}
                  contentFit="contain"
                  tintColor={collected ? undefined : theme.textSecondary}
                />
              </View>
              <ThemedText type="smallBold" numberOfLines={1} themeColor={collected ? 'text' : 'textSecondary'}>
                {collected ? t.plants[`${flower.id}Name`] : '? ? ?'}
              </ThemedText>
              <View style={styles.bouquetMeta}>
                <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} size={11} tintColor={theme.textSecondary} />
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatDuration(flower.togetherSeconds, t.duration.seconds, t.duration.minutes)}
                </ThemedText>
                {flower.isTest ? (
                  <ThemedText type="caption" themeColor="droplet" style={styles.testBadge}>
                    {t.duration.testBadge}
                  </ThemedText>
                ) : null}
              </View>
            </ThemedView>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
  hero: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    paddingTop: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  heroStage: {
    width: '100%',
    maxWidth: 300,
    height: 210,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  heroHalo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  heroPot: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBouquet: {
    width: 118,
    height: 118,
  },
  friend: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    textAlign: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  centered: {
    textAlign: 'center',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.two,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDivider: {
    height: 2,
    width: Spacing.four,
    borderRadius: 1,
    marginTop: 19,
  },
  requirement: {
    alignItems: 'center',
    marginTop: -Spacing.two,
  },
  requirementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: PillRadius,
  },
  banner: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  bannerText: {
    flex: 1,
    gap: Spacing.half,
  },
  actions: {
    gap: Spacing.three,
  },
  unavailable: {
    opacity: 0.5,
  },
  field: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  input: {
    minHeight: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    gap: Spacing.half,
  },
  joinRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    borderRadius: PillRadius,
    paddingHorizontal: Spacing.three,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 6,
    textAlign: 'center',
  },
  joinButton: {
    width: 110,
  },
  exclusive: {
    gap: Spacing.three,
  },
  exclusiveHeader: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  exclusiveTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bouquets: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.two,
  },
  bouquet: {
    width: 128,
    borderRadius: Spacing.four,
    padding: Spacing.two,
    paddingBottom: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  bouquetArt: {
    width: 92,
    height: 92,
    marginBottom: Spacing.one,
  },
  silhouette: {
    opacity: 0.18,
  },
  bouquetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    minHeight: MinTapTarget / 2,
  },
  testBadge: {
    fontWeight: '700',
    marginLeft: Spacing.one,
  },
});
