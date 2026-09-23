import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useIsFocused, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlowerRevealModal } from '@/components/FlowerRevealModal';
import { NoFlowerState } from '@/components/NoFlowerState';
import { PlantView } from '@/components/PlantView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MinTapTarget, PillRadius, Spacing } from '@/constants/theme';
import { findSoloPlant, growthStage } from '@/data/plants';
import { useLocalization } from '@/hooks/useLocalization';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useLocalization();
  const reduceMotion = useReduceMotion();
  const totalDroplets = useZenBalanceStore((s) => s.totalDroplets);
  const pendingRewardDroplets = useZenBalanceStore((s) => s.pendingRewardDroplets);
  const clearPendingReward = useZenBalanceStore((s) => s.clearPendingReward);
  const chosenPlantId = useZenBalanceStore((s) => s.chosenPlantId);
  const resetOnboarding = useZenBalanceStore((s) => s.resetOnboarding);
  const pendingCollection = useZenBalanceStore((s) => s.pendingCollection);
  const acknowledgeCollection = useZenBalanceStore((s) => s.acknowledgeCollection);
  // A just-collected flower has already left the pot in the store; keep it on
  // screen in full bloom until the collection popup is dismissed.
  const plant = findSoloPlant(pendingCollection?.plantId ?? chosenPlantId);
  const droplets = pendingCollection && plant ? plant.dropletsToBloom : totalDroplets;
  // Hold the stage back until the droplet rain has landed, so the flower grows
  // as the water arrives rather than before it.
  const stage = plant
    ? growthStage(plant, pendingRewardDroplets ? Math.max(0, droplets - pendingRewardDroplets) : droplets)
    : 0;

  // Smooth fill transition (droplets landing shouldn't just snap the bar),
  // plus a slow, quiet highlight sweep so it reads as water, not a generic
  // loading bar. Both stay off entirely under reduce-motion.
  const progressRatio = plant ? Math.min(1, droplets / plant.dropletsToBloom) : 0;
  const fill = useSharedValue(progressRatio);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  // A brief scaleY bump right as the last droplet lands — the "ripple" when
  // water is added — layered onto the same fill view the bar already uses.
  const ripple = useSharedValue(0);
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(ripple.value, [0, 1], [1, 1.6]) }],
  }));

  // Up to 5 droplets fall in a staggered sequence above the bar, then merge
  // in: the ripple fires and the bar's fill animates from its pre-reward
  // ratio to the real one. One shared value drives every droplet (see
  // FallingDroplet) instead of one-per-droplet, so this stays a fixed number
  // of hooks regardless of how many droplets were earned.
  const visibleDropletCount = pendingRewardDroplets ? Math.min(pendingRewardDroplets, 5) : 0;
  const fallProgress = useSharedValue(0);

  // The (home) tab stays mounted in the background for the whole session —
  // Home doesn't remount when the user comes back from it — so a reward set
  // moments before `dismissTo('/')` would otherwise start (and could even
  // finish) animating off-screen. Wait for actual focus before playing it.
  const isFocused = useIsFocused();

  // `fill`/`ripple`/`fallProgress` are only ever mutated in this one effect
  // (including inside the withTiming completion worklet below) — the reward
  // sequence and the plain "just keep the bar synced" case share one owner
  // instead of racing each other over the same shared values.
  useEffect(() => {
    if (pendingRewardDroplets) {
      if (!isFocused) return; // wait for focus; don't animate off-screen
      if (reduceMotion) {
        fill.value = progressRatio;
        clearPendingReward();
        return;
      }
      fallProgress.value = 0;
      fallProgress.value = withTiming(
        1,
        { duration: 350 + visibleDropletCount * 200, easing: Easing.linear },
        (finished) => {
          if (finished) {
            ripple.value = withSequence(
              withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
              withTiming(0, { duration: 260, easing: Easing.inOut(Easing.cubic) })
            );
            fill.value = withTiming(progressRatio, {
              duration: 700,
              easing: Easing.inOut(Easing.cubic),
            });
            runOnJS(clearPendingReward)();
          }
        }
      );
      return;
    }

    fill.value = withTiming(progressRatio, { duration: 700, easing: Easing.inOut(Easing.cubic) });
  }, [
    pendingRewardDroplets,
    isFocused,
    reduceMotion,
    progressRatio,
    visibleDropletCount,
    fill,
    fallProgress,
    ripple,
    clearPendingReward,
  ]);

  // The popup waits for the droplet rain and the bloom itself to finish playing.
  const revealPlantId = pendingCollection && !pendingRewardDroplets && isFocused ? pendingCollection.plantId : null;
  const [revealDelayDoneFor, setRevealDelayDoneFor] = useState<string | null>(null);
  useEffect(() => {
    if (!revealPlantId) return;
    const timer = setTimeout(() => setRevealDelayDoneFor(revealPlantId), reduceMotion ? 0 : 1100);
    return () => clearTimeout(timer);
  }, [revealPlantId, reduceMotion]);
  const showReveal = revealPlantId !== null && revealDelayDoneFor === revealPlantId;

  function viewCollection() {
    const plantId = pendingCollection?.plantId;
    acknowledgeCollection();
    router.navigate({ pathname: '/collection', params: plantId ? { highlight: plantId } : {} });
  }

  const shimmer = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
      -1,
      false
    );
  }, [reduceMotion, shimmer]);
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : interpolate(shimmer.value, [0, 0.15, 0.5, 0.85, 1], [0, 0.4, 0.4, 0.4, 0]),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-40, 340]) }],
  }));

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Insets live on the scroll content, not the screen: padding the screen
          left a dead band above the tab bar where scrolled content got cut off. */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}>
        <View style={styles.header}>
          <View>
            {plant && !pendingCollection ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/plants')}
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}>
                <ThemedView type="surfaceMuted" style={styles.changePlantChip}>
                  <SymbolView
                    name={{ ios: 'arrow.triangle.2.circlepath', android: 'autorenew', web: 'autorenew' }}
                    size={15}
                    tintColor={theme.plantPrimary}
                  />
                  <ThemedText type="smallBold" themeColor="plantPrimary">
                    {t.home.changePlant}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ) : null}
          </View>

          {/* Replays the same tutorial the user saw during onboarding. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.onboarding.tutorialHeaderTitle}
            onPress={() => router.push('/tutorial')}
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1.0 }]}>
            <SymbolView
              name={{ ios: 'info.circle', android: 'info', web: 'info' }}
              size={22}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.center}>
          {plant ? (
            <PlantView plant={plant} stage={stage} />
          ) : (
            <NoFlowerState />
          )}
        </View>

        <View style={styles.actions}>
          {plant ? (
            <>
              <View style={styles.progressRow}>
                <ThemedText type="caption" themeColor="textSecondary">
                  {droplets} / {plant.dropletsToBloom} {t.home.toBloom}
                </ThemedText>
              </View>
              {visibleDropletCount > 0 ? (
                <View style={styles.dropletRain} pointerEvents="none">
                  {Array.from({ length: visibleDropletCount }).map((_, index) => (
                    <FallingDroplet
                      key={index}
                      index={index}
                      count={visibleDropletCount}
                      progress={fallProgress}
                    />
                  ))}
                </View>
              ) : null}
              <ThemedView type="surfaceMuted" style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    fillStyle,
                    rippleStyle,
                    { backgroundColor: theme.plantAccent },
                  ]}>
                  <Animated.View style={[styles.progressShimmer, shimmerStyle]} />
                </Animated.View>
              </ThemedView>

              {/* Nothing is in the pot while a collected flower is on show. */}
              {!pendingCollection ? (
                <PrimaryButton
                  label={t.home.startSession}
                  onPress={() => router.push('/duration')}
                />
              ) : null}
            </>
          ) : (
            <PrimaryButton label={t.home.choosePlant} onPress={() => router.push('/plants')} />
          )}

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.5 : 1.0 }]}
            onPress={resetOnboarding}>
            <ThemedText type="caption" themeColor="textSecondary">
              {t.home.resetOnboarding}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <FlowerRevealModal
        plant={showReveal ? plant : undefined}
        isNew={pendingCollection?.isNew ?? true}
        onChooseNext={() => {
          acknowledgeCollection();
          router.push('/plants');
        }}
        onViewCollection={viewCollection}
        onClose={acknowledgeCollection}
      />
    </ThemedView>
  );
}

/**
 * One droplet in the reward-arrival sequence. All droplets share a single
 * `fallProgress` value (see HomeScreen) — each just reads a different slice
 * of it via `index`/`count`, which is what keeps this to one shared value
 * total instead of one per droplet (Reanimated hooks can't be created in a
 * loop with a dynamic count).
 */
function FallingDroplet({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: SharedValue<number>;
}) {
  const start = index / count;
  const end = start + 1 / count + 0.15;

  const style = useAnimatedStyle(() => {
    const local = interpolate(progress.value, [start, end], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: interpolate(local, [0, 0.15, 0.8, 1], [0, 1, 1, 0]),
      transform: [
        { translateY: interpolate(local, [0, 1], [-18, 6]) },
        { scale: interpolate(local, [0, 0.2, 1], [0.6, 1, 0.85]) },
      ],
    };
  });

  return <Animated.Text style={[styles.fallingDroplet, style]}>💧</Animated.Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  scroll: {
    flex: 1,
  },
  // flexGrow (not flex) on the content: on a normal screen the flex:1 `center`
  // child still expands to fill the space and the layout looks identical; on
  // a short screen (e.g. a folded-phone aspect ratio) the content simply
  // grows past the viewport and scrolls instead of `center` being squeezed
  // below what PlantView needs and overlapping the progress bar beneath it.
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changePlantChip: {
    minHeight: MinTapTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: PillRadius,
  },
  iconButton: {
    minWidth: MinTapTarget,
    minHeight: MinTapTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  actions: {
    gap: Spacing.two,
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  progressRow: {
    alignItems: 'center',
  },
  dropletRain: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 22,
  },
  fallingDroplet: {
    fontSize: 16,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: PillRadius,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: PillRadius,
    overflow: 'hidden',
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: PillRadius,
  },
  resetButton: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
