import { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MaxContentWidth, PillRadius, Spacing } from '@/constants/Theme';
import { Plants, type Plant, type PlantSize } from '@/data/Plants';
import { useLocalization } from '@/hooks/UseLocalization';
import { useReduceMotion } from '@/hooks/UseReduceMotion';
import { useTheme } from '@/hooks/UseTheme';
import { useZenBalanceStore } from '@/hooks/UseZenBalanceStore';
import { hapticSelect } from '@/lib/Haptics';

type Row = { type: 'section'; size: PlantSize } | { type: 'plant'; plant: Plant; index: number };

// Plants.ts is already ordered small → large, so sections fall out of one pass.
const Rows: Row[] = Plants.flatMap((plant, index) => {
  const plantRow: Row = { type: 'plant', plant, index };
  return Plants[index - 1]?.size === plant.size
    ? [plantRow]
    : [{ type: 'section', size: plant.size }, plantRow];
});

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const { t } = useLocalization();
  const collectedAt = useZenBalanceStore((s) => s.collectedAt);
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const collectedCount = Plants.filter((plant) => plant.id in collectedAt).length;

  // Two roomy columns on phones (down to a folded Galaxy Fold's cover screen),
  // more once there's real width — unfolded, tablet, web.
  const contentWidth = Math.min(width, MaxContentWidth);
  const columns = contentWidth >= 700 ? 4 : contentWidth >= 500 ? 3 : 2;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlashList
        key={columns}
        data={Rows}
        numColumns={columns}
        keyExtractor={(row) => (row.type === 'section' ? row.size : row.plant.id)}
        getItemType={(row) => row.type}
        overrideItemLayout={(layout, row) => {
          if (row.type === 'section') layout.span = columns;
        }}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          paddingHorizontal: Spacing.three,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <ThemedText type="title">{t.collection.title}</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                {t.collection.subtitle}
              </ThemedText>
            </View>
            {collectedCount === 0 ? (
              <EmptyState />
            ) : (
              <Summary collected={collectedCount} total={Plants.length} />
            )}
          </View>
        }
        renderItem={({ item }) =>
          item.type === 'section' ? (
            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                {item.size === 'together' ? (
                  <SymbolView
                    name={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
                    size={16}
                    tintColor={theme.warmthAccent}
                  />
                ) : null}
                <ThemedText type="heading">{t.sizes[item.size]}</ThemedText>
              </View>
              <ThemedText type="caption" themeColor="textSecondary">
                {Plants.filter((p) => p.size === item.size && p.id in collectedAt).length} /{' '}
                {Plants.filter((p) => p.size === item.size).length}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.cell}>
              <FlowerCard
                plant={item.plant}
                index={item.index}
                isCollected={item.plant.id in collectedAt}
                isHighlighted={item.plant.id === highlight}
              />
            </View>
          )
        }
      />
    </ThemedView>
  );
}

function Summary({ collected, total }: { collected: number; total: number }) {
  const theme = useTheme();
  const { t } = useLocalization();
  const reduceMotion = useReduceMotion();
  const fill = useSharedValue(0);

  useEffect(() => {
    const ratio = collected / total;
    fill.value = reduceMotion
      ? ratio
      : withDelay(200, withTiming(ratio, { duration: 900, easing: Easing.inOut(Easing.cubic) }));
  }, [collected, total, reduceMotion, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <ThemedView type="surface" style={styles.summary}>
      <View style={styles.summaryRow}>
        <ThemedText type="subtitle">
          {collected}
          <ThemedText type="heading" themeColor="textSecondary">
            {' '}/ {total}
          </ThemedText>
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t.collection.progress}
        </ThemedText>
      </View>
      <ThemedView type="surfaceMuted" style={styles.track}>
        <Animated.View style={[styles.trackFill, fillStyle, { backgroundColor: theme.plantAccent }]} />
      </ThemedView>
    </ThemedView>
  );
}

/** Intentional, not broken: a breathing silhouette of the first flower to grow. */
function EmptyState() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useLocalization();
  const reduceMotion = useReduceMotion();
  const breathe = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    breathe.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [reduceMotion, breathe]);

  const flowerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.94, 1.02]) }],
  }));
  const dropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 0.5, 1], [0.35, 1, 0.35]),
    transform: [{ translateY: interpolate(breathe.value, [0, 1], [-6, 4]) }],
  }));

  return (
    <ThemedView type="surface" style={styles.empty}>
      <ThemedView type="surfaceMuted" style={styles.emptyPot}>
        <Animated.View style={[styles.emptyDrop, dropStyle]}>
          <SymbolView
            name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }}
            size={20}
            tintColor={theme.droplet}
          />
        </Animated.View>
        <Animated.View style={[styles.emptyFlower, flowerStyle]}>
          <Image
            source={Plants[0].image}
            style={styles.fill}
            contentFit="contain"
            tintColor={theme.plantAccent}
          />
        </Animated.View>
      </ThemedView>
      <ThemedText type="heading" style={styles.centered}>
        {t.collection.emptyTitle}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
        {t.collection.emptyHint}
      </ThemedText>
      <View style={styles.emptyCta}>
        <PrimaryButton label={t.collection.emptyCta} onPress={() => router.navigate('/')} />
      </View>
    </ThemedView>
  );
}

function FlowerCard({
  plant,
  index,
  isCollected,
  isHighlighted,
}: {
  plant: Plant;
  index: number;
  isCollected: boolean;
  isHighlighted: boolean;
}) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useLocalization();
  const reduceMotion = useReduceMotion();
  const name = t.plants[`${plant.id}Name`];

  const press = useSharedValue(0);
  const glow = useSharedValue(0);

  // The just-collected flower settles into its slot with a few soft pulses.
  useEffect(() => {
    if (!isHighlighted || reduceMotion) return;
    const pulse = withSequence(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
      withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.cubic) })
    );
    glow.value = withDelay(450, withRepeat(pulse, 3, false));
  }, [isHighlighted, reduceMotion, glow]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.95]) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.35 }));

  const isTogether = plant.size === 'together';

  const content = (
    <ThemedView
      type={isCollected ? 'surface' : 'surfaceMuted'}
      style={[
        styles.card,
        { borderColor: isHighlighted ? theme.warmthAccent : 'transparent' },
        isCollected && styles.cardRaised,
      ]}>
      <View style={styles.art}>
        {isCollected ? (
          <>
            <Animated.View style={[styles.artGlow, glowStyle, { backgroundColor: theme.warmthAccent }]} />
            <ThemedView type="surfaceMuted" style={styles.artDisc} />
            <Image source={plant.image} style={styles.artImage} contentFit="contain" transition={200} />
            {isTogether ? (
              <ThemedView type="surfaceMuted" style={styles.togetherBadge}>
                <SymbolView name={{ ios: 'person.2.fill', android: 'group', web: 'group' }} size={11} tintColor={theme.plantPrimary} />
                <ThemedText type="caption" themeColor="plantPrimary" style={styles.togetherBadgeText}>
                  {t.together.badge}
                </ThemedText>
              </ThemedView>
            ) : null}
          </>
        ) : (
          <>
            {/* Just a shape — enough to be curious about, not enough to spoil it. */}
            <Image
              source={plant.image}
              style={[styles.artImage, styles.silhouette]}
              contentFit="contain"
              tintColor={theme.textSecondary}
            />
            <ThemedView type="surface" style={styles.lock}>
              <SymbolView
                name={
                  isTogether
                    ? { ios: 'person.2.fill', android: 'group', web: 'group' }
                    : { ios: 'lock.fill', android: 'lock', web: 'lock' }
                }
                size={14}
                tintColor={theme.textSecondary}
              />
            </ThemedView>
          </>
        )}
      </View>

      <View style={styles.cardText}>
        <ThemedText
          type="heading"
          style={styles.cardName}
          themeColor={isCollected ? 'text' : 'textSecondary'}
          numberOfLines={1}>
          {isCollected ? name : '? ? ?'}
        </ThemedText>
        {isHighlighted ? (
          <View style={[styles.newBadge, { backgroundColor: theme.warmthAccent }]}>
            <ThemedText type="caption" style={styles.newBadgeText}>
              {t.collection.newBadge}
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {isCollected ? t.plants.collected : isTogether ? t.collection.togetherOnly : t.collection.locked}
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 55)
        .duration(420)
        .easing(Easing.out(Easing.cubic))}>
      {isCollected ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={name}
          onPressIn={() => press.set(withTiming(1, { duration: 120 }))}
          onPressOut={() => press.set(withTiming(0, { duration: 220 }))}
          onPress={() => {
            hapticSelect();
            router.push({ pathname: '/collection/[id]', params: { id: plant.id } });
          }}>
          <Animated.View style={cardStyle}>{content}</Animated.View>
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={`${t.sizes[plant.size]} · ${t.collection.locked}`}>
          {content}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
  },
  titleBlock: {
    gap: Spacing.one,
  },
  summary: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  track: {
    height: 6,
    borderRadius: PillRadius,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: PillRadius,
  },
  empty: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyPot: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  emptyDrop: {
    position: 'absolute',
    top: Spacing.three,
  },
  emptyFlower: {
    width: 84,
    height: 84,
    marginTop: Spacing.four,
    opacity: 0.55,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  centered: {
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyCta: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  togetherBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: PillRadius,
  },
  togetherBadgeText: {
    fontWeight: '700',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.one,
  },
  cell: {
    padding: Spacing.two,
  },
  card: {
    borderRadius: Spacing.four,
    borderWidth: 2,
    padding: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  cardRaised: {
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  art: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artGlow: {
    position: 'absolute',
    width: '96%',
    height: '96%',
    borderRadius: 999,
  },
  artDisc: {
    position: 'absolute',
    width: '84%',
    height: '84%',
    borderRadius: 999,
  },
  artImage: {
    width: '78%',
    height: '78%',
  },
  silhouette: {
    opacity: 0.16,
  },
  lock: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  cardName: {
    fontSize: 17,
    lineHeight: 22,
  },
  newBadge: {
    paddingHorizontal: Spacing.two,
    borderRadius: PillRadius,
  },
  // Warm near-black: legible on the terracotta badge in both light and dark mode.
  newBadgeText: {
    color: '#2B2A25',
    fontWeight: '700',
  },
});
