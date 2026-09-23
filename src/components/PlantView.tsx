import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

import { Spacing, type ThemeMode } from '@/constants/Theme';
import { StageCount, type Plant } from '@/data/Plants';
import { useLocalization } from '@/hooks/UseLocalization';
import { useReduceMotion } from '@/hooks/UseReduceMotion';
import { useTheme } from '@/hooks/UseTheme';

export type PlantViewProps = {
  plant: Plant;
  /** 0 (seedling) to StageCount - 1 (in bloom) — see `growthStage`. */
  stage: number;
  mode?: ThemeMode;
};

/**
 * The app's emotional centerpiece — generous whitespace, nothing else competing.
 * One illustration per flower, so growth reads as the flower itself filling
 * out its pot stage by stage, with a warm halo reserved for full bloom.
 */
export function PlantView({ plant, stage, mode }: PlantViewProps) {
  const { t } = useLocalization();
  const theme = useTheme(mode);
  const reduceMotion = useReduceMotion();
  const index = Math.min(Math.max(stage, 0), StageCount - 1);
  const isBloom = index === StageCount - 1;

  const growth = useSharedValue(index);
  useEffect(() => {
    // STYLE_GUIDE.md section 5: growth-stage transitions 600–900ms, no overshoot.
    growth.value = reduceMotion
      ? index
      : withTiming(index, { duration: 850, easing: Easing.inOut(Easing.cubic) });
  }, [index, reduceMotion, growth]);

  const flowerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(growth.value, [0, StageCount - 1], [0.7, 1]),
    transform: [{ scale: interpolate(growth.value, [0, StageCount - 1], [0.42, 1]) }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(growth.value, [StageCount - 2, StageCount - 1], [0, 0.22], 'clamp'),
  }));

  return (
    <View style={styles.container}>
      <ThemedView mode={mode} type="surface" style={styles.pot}>
        <Animated.View style={[styles.halo, haloStyle, { backgroundColor: theme.warmthAccent }]} />
        <Animated.View style={[styles.flower, flowerStyle]}>
          <Image
            source={plant.image}
            style={styles.image}
            contentFit="contain"
            transition={250}
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      </ThemedView>
      <ThemedText mode={mode} type="subtitle">
        {t.plants[`${plant.id}Name`]}
      </ThemedText>
      <ThemedText mode={mode} type="caption" themeColor={isBloom ? 'warmthAccent' : 'textSecondary'}>
        {t.stages[index]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  pot: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
    // Soft, diffuse only — STYLE_GUIDE.md section 4.
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  halo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  flower: {
    width: 184,
    height: 184,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
