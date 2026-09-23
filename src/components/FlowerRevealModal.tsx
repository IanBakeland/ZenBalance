import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { PrimaryButton } from './PrimaryButton';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

import { MinTapTarget, PillRadius, Spacing } from '@/constants/theme';
import type { Plant } from '@/data/plants';
import { useLocalization } from '@/hooks/useLocalization';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';
import { hapticCommit } from '@/lib/haptics';

const REVEAL_MS = 1400;
/** Point in the reveal where the silhouette has turned into the real flower. */
const BLOOM_AT = 0.55;

export type FlowerRevealModalProps = {
  plant: Plant | undefined;
  /** False when a flower that's already in the collection was grown again. */
  isNew: boolean;
  onChooseNext: () => void;
  onViewCollection: () => void;
  /** Android back: just dismiss. */
  onClose: () => void;
  /** Together overrides the solo copy with its own "we did this" wording. */
  title?: string;
  body?: string;
  primaryLabel?: string;
};

/**
 * The payoff for a finished flower. A slow, single reveal — silhouette to
 * colour, one ripple, one success haptic — rather than confetti: STYLE_GUIDE.md
 * wants the bloom moment to feel like "a quiet exhale, not a celebration explosion".
 */
export function FlowerRevealModal({
  plant,
  isNew,
  onChooseNext,
  onViewCollection,
  onClose,
  title,
  body,
  primaryLabel,
}: FlowerRevealModalProps) {
  const theme = useTheme();
  const { t } = useLocalization();
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const flowerSize = Math.min(200, width * 0.48);
  const visible = plant !== undefined;

  // Keeps the last flower on the card while the modal fades out, instead of
  // the card emptying the instant the parent clears `plant`.
  const [shown, setShown] = useState<{ plant: Plant; isNew: boolean } | null>(null);
  if (plant && (plant !== shown?.plant || isNew !== shown.isNew)) setShown({ plant, isNew });

  const reveal = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    // Nothing to do on hide: the card holds its final frame through the fade-out.
    if (!visible) return;
    reveal.value = 0;
    if (reduceMotion) {
      reveal.value = 1;
      hapticCommit();
      return;
    }
    reveal.value = withDelay(
      150,
      withTiming(1, { duration: REVEAL_MS, easing: Easing.inOut(Easing.cubic) })
    );
    breathe.value = withDelay(
      REVEAL_MS,
      withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    // Lands exactly as the colour comes in — the one haptic this moment gets.
    const timer = setTimeout(hapticCommit, 150 + REVEAL_MS * BLOOM_AT);
    return () => {
      clearTimeout(timer);
      cancelAnimation(breathe);
    };
  }, [visible, reduceMotion, reveal, breathe]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [0, 0.2], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(reveal.value, [0, 0.3], [28, 0], Extrapolation.CLAMP) }],
  }));
  const flowerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(reveal.value, [0.1, BLOOM_AT + 0.1], [0.55, 1], Extrapolation.CLAMP) },
      { rotate: `${interpolate(reveal.value, [0.1, BLOOM_AT + 0.1], [-8, 0], Extrapolation.CLAMP)}deg` },
    ],
  }));
  const silhouetteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [0.25, BLOOM_AT], [1, 0], Extrapolation.CLAMP),
  }));
  const colourStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [0.25, BLOOM_AT], [0, 1], Extrapolation.CLAMP),
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [0.3, BLOOM_AT], [0, 0.28], Extrapolation.CLAMP),
    transform: [
      {
        scale:
          interpolate(reveal.value, [0.3, BLOOM_AT], [0.6, 1], Extrapolation.CLAMP) *
          interpolate(breathe.value, [0, 1], [1, 1.06]),
      },
    ],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [BLOOM_AT - 0.05, BLOOM_AT, 1], [0, 0.5, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(reveal.value, [BLOOM_AT - 0.05, 1], [0.7, 1.5], Extrapolation.CLAMP) }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [BLOOM_AT, 0.8], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(reveal.value, [BLOOM_AT, 0.8], [10, 0], Extrapolation.CLAMP) }],
  }));
  const actionsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [0.75, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {shown ? (
          <Animated.View style={[styles.dialog, cardStyle]}>
            <ThemedView type="surface" style={styles.card}>
              <View style={[styles.stage, { width: flowerSize * 1.3, height: flowerSize * 1.3 }]}>
                <Animated.View
                  style={[styles.round, haloStyle, { backgroundColor: theme.warmthAccent }]}
                />
                <Animated.View style={[styles.round, styles.ripple, rippleStyle, { borderColor: theme.warmthAccent }]} />
                <Animated.View style={[{ width: flowerSize, height: flowerSize }, flowerStyle]}>
                  <Animated.View style={[StyleSheet.absoluteFill, silhouetteStyle]}>
                    <Image
                      source={shown.plant.image}
                      style={styles.image}
                      contentFit="contain"
                      tintColor={theme.plantPrimaryDark}
                    />
                  </Animated.View>
                  <Animated.View style={[StyleSheet.absoluteFill, colourStyle]}>
                    <Image
                      source={shown.plant.image}
                      style={styles.image}
                      contentFit="contain"
                      accessibilityLabel={t.plants[`${shown.plant.id}Name`]}
                    />
                  </Animated.View>
                </Animated.View>
              </View>

              <Animated.View style={[styles.text, textStyle]}>
                <ThemedView type="surfaceMuted" style={styles.eyebrow}>
                  <SymbolView
                    name={
                      shown.plant.size === 'together'
                        ? { ios: 'person.2.fill', android: 'group', web: 'group' }
                        : { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }
                    }
                    size={14}
                    tintColor={theme.warmthAccent}
                  />
                  <ThemedText type="smallBold" themeColor="warmthAccent">
                    {t.plants[`${shown.plant.id}Name`]} · {t.sizes[shown.plant.size]}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="title" style={styles.centered} accessibilityRole="header">
                  {title ?? t.collection.revealTitle}
                </ThemedText>
                <ThemedText type="default" themeColor="textSecondary" style={styles.centered}>
                  {body ?? (shown.isNew ? t.collection.revealBody : t.collection.revealBodyRepeat)}
                </ThemedText>
              </Animated.View>

              <Animated.View style={[styles.actions, actionsStyle]}>
                <PrimaryButton label={primaryLabel ?? t.collection.revealNext} onPress={onChooseNext} />
                <Pressable
                  accessibilityRole="button"
                  onPress={onViewCollection}
                  style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.5 : 1.0 }]}>
                  <ThemedText type="smallBold" themeColor="plantPrimary">
                    {t.collection.revealView}
                  </ThemedText>
                </Pressable>
              </Animated.View>
            </ThemedView>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 18, 14, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
  },
  card: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
  },
  stage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  round: {
    position: 'absolute',
    width: '86%',
    height: '86%',
    borderRadius: 999,
  },
  ripple: {
    borderWidth: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: PillRadius,
  },
  centered: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.four,
    gap: Spacing.one,
  },
  secondary: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
