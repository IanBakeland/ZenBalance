import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

import { PillRadius, Spacing } from '@/constants/Theme';
import { Plants, SoloPlants, type SoloPlantSize } from '@/data/Plants';
import { useLocalization } from '@/hooks/UseLocalization';
import { useReduceMotion } from '@/hooks/UseReduceMotion';
import { useTheme } from '@/hooks/UseTheme';
import { useZenBalanceStore } from '@/hooks/UseZenBalanceStore';
import { hapticSelect } from '@/lib/Haptics';

const CYCLE_MS = 2800;

// One entry per size tier: its first flower as the thumbnail, plus the droplet range.
const Tiers = (['small', 'medium', 'large'] as SoloPlantSize[]).map((size) => {
  const plants = SoloPlants.filter((plant) => plant.size === size);
  return {
    size,
    image: plants[0].image,
    min: Math.min(...plants.map((p) => p.dropletsToBloom)),
    max: Math.max(...plants.map((p) => p.dropletsToBloom)),
  };
});

/**
 * Home with an empty pot: a slow slideshow of what could grow here, and the
 * three size tiers so the choice feels like a choice, not a blank page.
 */
export function NoFlowerState() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useLocalization();
  const reduceMotion = useReduceMotion();
  const collectedAt = useZenBalanceStore((s) => s.collectedAt);
  const collectedCount = Plants.filter((plant) => plant.id in collectedAt).length;

  // expo-image cross-dissolves on its own whenever the source changes.
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SoloPlants.length), CYCLE_MS);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const breathe = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    breathe.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS / 2, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [reduceMotion, breathe]);

  const flowerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.95, 1.02]) }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.12, 0.22]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.96, 1.04]) }],
  }));
  const dropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 0.5, 1], [0.4, 1, 0.4]),
    transform: [{ translateY: interpolate(breathe.value, [0, 1], [-6, 4]) }],
  }));

  const openPicker = () => {
    hapticSelect();
    router.push('/plants');
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))} style={styles.stage}>
        <Animated.View style={[styles.halo, haloStyle, { backgroundColor: theme.plantAccent }]} />
        <ThemedView type="surface" style={styles.pot}>
          <Animated.View style={[styles.drop, dropStyle]}>
            <SymbolView
              name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
              size={20}
              tintColor={theme.droplet}
            />
          </Animated.View>
          <Animated.View style={[styles.flower, flowerStyle]}>
            <Image
              source={SoloPlants[index].image}
              style={styles.fill}
              contentFit="contain"
              transition={{ duration: 900, effect: 'cross-dissolve' }}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </ThemedView>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).duration(500).easing(Easing.out(Easing.cubic))}
        style={styles.text}>
        <ThemedText type="subtitle" style={styles.centered}>
          {t.home.noPlantTitle}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          {t.home.noPlantBody}
        </ThemedText>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(240).duration(500).easing(Easing.out(Easing.cubic))}
        style={styles.tiers}>
        {Tiers.map((tier) => (
          <Pressable
            key={tier.size}
            accessibilityRole="button"
            accessibilityLabel={`${t.sizes[tier.size]}, ${tier.min}–${tier.max} ${t.home.droplets}`}
            onPress={openPicker}
            style={({ pressed }) => [styles.tierPressable, { opacity: pressed ? 0.5 : 1.0 }]}>
            <ThemedView type="surface" style={styles.tier}>
              <ThemedView type="surfaceMuted" style={styles.tierDisc}>
                <Image source={tier.image} style={styles.tierImage} contentFit="contain" />
              </ThemedView>
              <ThemedText type="smallBold">{t.sizes[tier.size]}</ThemedText>
              <View style={styles.tierMeta}>
                <SymbolView
                  name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
                  size={11}
                  tintColor={theme.droplet}
                />
                <ThemedText type="caption" themeColor="textSecondary">
                  {tier.min}–{tier.max}
                </ThemedText>
              </View>
            </ThemedView>
          </Pressable>
        ))}
      </Animated.View>

      {collectedCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/collection')}
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}>
          <ThemedView type="surfaceMuted" style={styles.collected}>
            <SymbolView
              name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
              size={14}
              tintColor={theme.warmthAccent}
            />
            <ThemedText type="caption" themeColor="textSecondary">
              {collectedCount} / {Plants.length} {t.collection.progress}
            </ThemedText>
          </ThemedView>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.four,
    alignSelf: 'stretch',
  },
  stage: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  pot: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    // Soft, diffuse only — STYLE_GUIDE.md section 4.
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  drop: {
    position: 'absolute',
    top: Spacing.three,
  },
  flower: {
    width: 128,
    height: 128,
    marginTop: Spacing.three,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  text: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  centered: {
    textAlign: 'center',
    maxWidth: 300,
  },
  tiers: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignSelf: 'stretch',
    maxWidth: 420,
    width: '100%',
    marginHorizontal: 'auto',
  },
  tierPressable: {
    flex: 1,
  },
  tier: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.four,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
  },
  tierDisc: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  tierImage: {
    width: 42,
    height: 42,
  },
  tierMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  collected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: PillRadius,
  },
});
