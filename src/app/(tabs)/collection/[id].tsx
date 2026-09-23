import { useEffect } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MaxContentWidth, PillRadius, Spacing } from '@/constants/theme';
import { findPlant } from '@/data/plants';
import { formatDuration } from '@/data/sessionDurations';
import { useLocalization } from '@/hooks/useLocalization';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useTheme } from '@/hooks/use-theme';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';

export default function FlowerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const { t, language } = useLocalization();
  const reduceMotion = useReduceMotion();
  const plant = findPlant(id);
  const collectedAt = useZenBalanceStore((s) => (plant ? s.collectedAt[plant.id] : undefined));
  const flowerSize = Math.min(260, width * 0.62);

  // A slow float — the flower is alive, not a static thumbnail.
  const float = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    float.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [reduceMotion, float]);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -8]) }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(float.value, [0, 1], [0.16, 0.26]),
    transform: [{ scale: interpolate(float.value, [0, 1], [0.97, 1.03]) }],
  }));

  // Locked flowers have nothing to show here yet.
  if (!plant || collectedAt === undefined) return <Redirect href="/collection" />;

  const name = t.plants[`${plant.id}Name`];
  const collectedOn = new Date(collectedAt).toLocaleDateString(language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: name, headerShadowVisible: false }} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
        ]}>
        <Animated.View
          entering={FadeIn.duration(500)}
          style={[styles.stage, { width: flowerSize * 1.25, height: flowerSize * 1.25 }]}>
          <Animated.View style={[styles.halo, haloStyle, { backgroundColor: theme.warmthAccent }]} />
          <ThemedView type="surface" style={styles.disc} />
          <Animated.View style={[{ width: flowerSize, height: flowerSize }, floatStyle]}>
            <Image
              source={plant.image}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel={name}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).duration(450).easing(Easing.out(Easing.cubic))}
          style={styles.text}>
          <ThemedView type="surfaceMuted" style={styles.chip}>
            {plant.size === 'together' ? (
              <SymbolView name={{ ios: 'person.2.fill', android: 'group', web: 'group' }} size={14} tintColor={theme.plantPrimary} />
            ) : null}
            <ThemedText type="smallBold" themeColor="plantPrimary">
              {t.sizes[plant.size]}
            </ThemedText>
          </ThemedView>
          <ThemedText type="title" style={styles.centered}>
            {name}
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.centered}>
            {t.plants[`${plant.id}Blurb`]}
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(260).duration(450).easing(Easing.out(Easing.cubic))}
          style={styles.stats}>
          {plant.size === 'together' ? (
            <Stat
              icon={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
              tint={theme.plantPrimary}
              label={t.together.grownTogether}
              value={formatDuration(plant.togetherSeconds, t.duration.seconds, t.duration.minutes)}
            />
          ) : (
            <Stat
              icon={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
              tint={theme.droplet}
              label={t.collection.grownWith}
              value={`${plant.dropletsToBloom} ${t.home.droplets}`}
            />
          )}
          <Stat
            icon={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
            tint={theme.warmthAccent}
            label={t.collection.collectedOn}
            value={collectedOn}
          />
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

function Stat({
  icon,
  tint,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <ThemedView type="surface" style={styles.stat}>
      <SymbolView name={icon} size={18} tintColor={tint} />
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },
  stage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  disc: {
    position: 'absolute',
    width: '84%',
    height: '84%',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: PillRadius,
  },
  centered: {
    textAlign: 'center',
    maxWidth: 340,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  stat: {
    flexGrow: 1,
    flexBasis: 140,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
