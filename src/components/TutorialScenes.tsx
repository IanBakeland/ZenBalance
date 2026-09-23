import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

import { PillRadius, Spacing } from '@/constants/Theme';
import { findPlant, type PlantId } from '@/data/Plants';
import { useLocalization } from '@/hooks/UseLocalization';
import { useReduceMotion } from '@/hooks/UseReduceMotion';
import { useTheme } from '@/hooks/UseTheme';
import { hapticCommit, hapticSelect } from '@/lib/Haptics';

/**
 * The tutorial's illustrations. Each scene is drawn on a 300×300 canvas (the
 * tutorial scales it to the screen) and plays ONCE each time its page becomes
 * active — no loops, so the text next to it stays easy to read.
 */
export const SceneSize = 300;

type SceneProps = { active: boolean };

const START_DELAY = 250;

function image(id: PlantId): ImageSource {
  return findPlant(id)!.image;
}

/**
 * 0 → 1 over `duration` whenever the page becomes active, reset while it's
 * off-screen so swiping back replays it. `haptic` fires at fraction `hapticAt`
 * of the way through — tied to one visual beat, never to a loop.
 */
function useScene(active: boolean, duration: number, haptic?: { at: number; fire: () => void }) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  const hapticRef = useRef(haptic);
  useEffect(() => {
    hapticRef.current = haptic;
  });

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    const current = hapticRef.current;
    if (reduceMotion) {
      progress.value = 1;
      current?.fire();
      return;
    }
    progress.value = withDelay(
      START_DELAY,
      withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) })
    );
    if (!current) return;
    const timer = setTimeout(current.fire, START_DELAY + duration * current.at);
    return () => clearTimeout(timer);
  }, [active, reduceMotion, duration, progress]);

  return progress;
}

function clamp(value: number, input: number[], output: number[]) {
  'worklet';
  return interpolate(value, input, output, Extrapolation.CLAMP);
}

// --- 1. Put your phone down --------------------------------------------------

export function PhoneScene({ active }: SceneProps) {
  const theme = useTheme();
  const { t } = useLocalization();
  // The haptic lands with the phone: a soft "set down" tick.
  const p = useScene(active, 1500, { at: 0.6, fire: hapticSelect });

  const phoneStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { translateY: clamp(p.value, [0, 0.6], [-34, 18]) },
      { rotateX: `${clamp(p.value, [0, 0.6], [0, 62])}deg` },
      { rotateZ: `${clamp(p.value, [0, 0.6], [-10, 0])}deg` },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: clamp(p.value, [0.2, 0.6], [0, 0.14]),
    transform: [{ scaleX: clamp(p.value, [0.2, 0.6], [0.5, 1]) }],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: clamp(p.value, [0.58, 0.64, 1], [0, 0.55, 0]),
    transform: [{ scale: clamp(p.value, [0.58, 1], [0.7, 1.7]) }],
  }));
  const chipStyle = useAnimatedStyle(() => ({
    opacity: clamp(p.value, [0.72, 0.92], [0, 1]),
    transform: [{ translateY: clamp(p.value, [0.72, 0.92], [10, 0]) }],
  }));

  return (
    <View style={styles.canvas}>
      <Animated.View style={[styles.phoneShadow, shadowStyle]} />
      <Animated.View style={[styles.ripple, rippleStyle, { borderColor: theme.droplet }]} />
      <Animated.View style={phoneStyle}>
        <ThemedView type="surface" style={[styles.phone, { borderColor: theme.text }]}>
          <View style={[styles.notch, { backgroundColor: theme.text }]} />
          <SymbolView name={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }} size={28} tintColor={theme.plantPrimary} />
        </ThemedView>
      </Animated.View>
      <Animated.View style={[styles.chipBelow, chipStyle]}>
        <ThemedView type="surface" style={styles.chip}>
          <View style={[styles.dot, { backgroundColor: theme.plantPrimary }]} />
          <ThemedText type="smallBold">{t.tutorial.p1Chip}</ThemedText>
        </ThemedView>
      </Animated.View>
    </View>
  );
}

// --- 2. Focus turns into water ------------------------------------------------

/** Where each droplet lands, as a fraction of the scene. */
const DropLandings = [0.3, 0.55, 0.8];

export function WaterScene({ active }: SceneProps) {
  const theme = useTheme();
  const { t } = useLocalization();
  // The bloom is the payoff of the whole loop — the one stronger haptic here.
  const p = useScene(active, 2600, { at: 0.9, fire: hapticCommit });

  const flowerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: clamp(
          p.value,
          [0, 0.3, 0.34, 0.55, 0.59, 0.8, 0.9],
          [0.38, 0.38, 0.56, 0.56, 0.74, 0.74, 1]
        ),
      },
    ],
  }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: clamp(p.value, [0.82, 0.95], [0, 0.26]) }));
  const fillStyle = useAnimatedStyle(() => ({
    width: `${clamp(p.value, [0, 0.3, 0.34, 0.55, 0.59, 0.8, 0.84], [0, 0, 33, 33, 66, 66, 100])}%`,
  }));
  const chipStyle = useAnimatedStyle(() => ({
    opacity: clamp(p.value, [0.88, 1], [0, 1]),
    transform: [{ translateY: clamp(p.value, [0.88, 1], [8, 0]) }],
  }));

  return (
    <View style={styles.canvas}>
      {DropLandings.map((land, index) => (
        <FallingDrop key={index} progress={p} land={land} offset={(index - 1) * 26} />
      ))}
      <View style={styles.potStage}>
        <Animated.View style={[styles.halo, haloStyle, { backgroundColor: theme.warmthAccent }]} />
        <ThemedView type="surface" style={styles.pot}>
          <Animated.View style={[styles.potFlower, flowerStyle]}>
            <Image source={image('daisy')} style={styles.fill} contentFit="contain" />
          </Animated.View>
        </ThemedView>
      </View>
      <ThemedView type="surfaceMuted" style={styles.track}>
        <Animated.View style={[styles.trackFill, fillStyle, { backgroundColor: theme.plantAccent }]} />
      </ThemedView>
      <Animated.View style={[styles.bloomChip, chipStyle]}>
        <ThemedView type="surface" style={styles.chip}>
          <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={13} tintColor={theme.warmthAccent} />
          <ThemedText type="smallBold" themeColor="warmthAccent">
            {t.tutorial.p2Chip}
          </ThemedText>
        </ThemedView>
      </Animated.View>
    </View>
  );
}

function FallingDrop({ progress, land, offset }: { progress: SharedValue<number>; land: number; offset: number }) {
  const theme = useTheme();
  const start = land - 0.16;
  const style = useAnimatedStyle(() => ({
    opacity: clamp(progress.value, [start, start + 0.03, land - 0.02, land], [0, 1, 1, 0]),
    transform: [
      { translateX: offset },
      { translateY: clamp(progress.value, [start, land], [-10, 70]) },
      { scale: clamp(progress.value, [land - 0.03, land], [1, 0.6]) },
    ],
  }));
  return (
    <Animated.View style={[styles.drop, style]}>
      <SymbolView name={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }} size={22} tintColor={theme.droplet} />
    </Animated.View>
  );
}

// --- 3. Grow your collection ----------------------------------------------------

const Fan: { id: PlantId; locked?: boolean; x: number; y: number; rotate: number }[] = [
  { id: 'daisy', x: -104, y: 26, rotate: -14 },
  { id: 'dahlia', x: 104, y: 26, rotate: 14, locked: true },
  { id: 'hibiscus', x: -54, y: 6, rotate: -7 },
  { id: 'peony', x: 54, y: 6, rotate: 7 },
  { id: 'marigold', x: 0, y: 0, rotate: 0 },
];

export function CollectionScene({ active }: SceneProps) {
  const p = useScene(active, 1600, { at: 1, fire: hapticSelect });
  return (
    <View style={styles.canvas}>
      {Fan.map((card, order) => (
        <FanCard key={card.id} progress={p} order={order} {...card} />
      ))}
    </View>
  );
}

function FanCard({
  progress,
  order,
  id,
  locked,
  x,
  y,
  rotate,
}: {
  progress: SharedValue<number>;
  order: number;
} & (typeof Fan)[number]) {
  const theme = useTheme();
  const { t } = useLocalization();
  const from = order * 0.12;
  const style = useAnimatedStyle(() => {
    const local = clamp(progress.value, [from, from + 0.45], [0, 1]);
    return {
      opacity: local,
      transform: [
        { translateX: x * local },
        { translateY: y + (1 - local) * 50 },
        { rotate: `${rotate * local}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.fanSlot, style]}>
      <ThemedView type={locked ? 'surfaceMuted' : 'surface'} style={[styles.card, !locked && styles.cardRaised]}>
        <View style={styles.cardArt}>
          <Image
            source={image(id)}
            style={[styles.fill, locked && styles.silhouette]}
            contentFit="contain"
            tintColor={locked ? theme.textSecondary : undefined}
          />
          {locked ? (
            <ThemedView type="surface" style={styles.lock}>
              <SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} size={12} tintColor={theme.textSecondary} />
            </ThemedView>
          ) : null}
        </View>
        <ThemedText type="caption" themeColor={locked ? 'textSecondary' : 'text'} numberOfLines={1} style={styles.cardName}>
          {locked ? '? ? ?' : t.plants[`${id}Name`]}
        </ThemedText>
      </ThemedView>
    </Animated.View>
  );
}

// --- 4. Alone or together ----------------------------------------------------------

export function SoloTogetherScene({ active }: SceneProps) {
  const theme = useTheme();
  const { t } = useLocalization();
  const p = useScene(active, 1500, { at: 0.75, fire: hapticSelect });

  const soloStyle = useAnimatedStyle(() => ({
    opacity: clamp(p.value, [0, 0.45], [0, 1]),
    transform: [{ translateX: clamp(p.value, [0, 0.45], [-24, 0]) }],
  }));
  const togetherStyle = useAnimatedStyle(() => ({
    opacity: clamp(p.value, [0.3, 0.75], [0, 1]),
    transform: [{ translateX: clamp(p.value, [0.3, 0.75], [24, 0]) }],
  }));
  const stripStyle = useAnimatedStyle(() => ({
    opacity: clamp(p.value, [0.7, 1], [0, 1]),
    transform: [{ translateY: clamp(p.value, [0.7, 1], [8, 0]) }],
  }));

  return (
    <View style={[styles.canvas, styles.soloTogether]}>
      <View style={styles.modeRow}>
        <Animated.View style={[styles.modeSlot, soloStyle]}>
          <ThemedView type="surface" style={[styles.modeCard, styles.cardRaised]}>
            <View style={styles.friends}>
              <Friend colour={theme.plantAccent} />
            </View>
            <Image source={image('daisy')} style={styles.modeImage} contentFit="contain" />
            <ThemedText type="smallBold">{t.tutorial.solo}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
              {t.tutorial.soloCaption}
            </ThemedText>
          </ThemedView>
        </Animated.View>

        <Animated.View style={[styles.modeSlot, togetherStyle]}>
          <ThemedView type="surface" style={[styles.modeCard, styles.cardRaised, { borderColor: theme.warmthAccent }]}>
            <View style={styles.friends}>
              <Friend colour={theme.plantAccent} />
              <Friend colour={theme.droplet} overlap />
              <Friend colour={theme.warmthAccent} overlap />
            </View>
            <Image source={image('gardenBouquet')} style={styles.modeImage} contentFit="contain" />
            <ThemedText type="smallBold">{t.tutorial.together}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
              {t.tutorial.togetherCaption}
            </ThemedText>
          </ThemedView>
          <ThemedView type="surfaceMuted" style={styles.onlyBadge}>
            <SymbolView name={{ ios: 'person.2.fill', android: 'group', web: 'group' }} size={10} tintColor={theme.warmthAccent} />
            <ThemedText type="caption" themeColor="warmthAccent" style={styles.bold}>
              {t.collection.togetherOnly}
            </ThemedText>
          </ThemedView>
        </Animated.View>
      </View>

      <Animated.View style={[styles.strip, stripStyle]}>
        <StripStep icon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }} label={t.together.step1} />
        <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={10} tintColor={theme.textSecondary} />
        <StripStep icon={{ ios: 'iphone.slash', android: 'phonelink_off', web: 'phonelink_off' }} label={t.together.step2} />
        <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={10} tintColor={theme.textSecondary} />
        <StripStep icon={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }} label={t.together.step3} />
      </Animated.View>
    </View>
  );
}

function Friend({ colour, overlap }: { colour: string; overlap?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.friend, overlap && styles.friendOverlap, { backgroundColor: colour, borderColor: theme.surface }]}>
      <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} size={13} tintColor="#2B2A25" />
    </View>
  );
}

function StripStep({ icon, label }: { icon: SymbolViewProps['name']; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stripStep}>
      <SymbolView name={icon} size={16} tintColor={theme.plantPrimary} />
      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2} style={styles.centered}>
        {label}
      </ThemedText>
    </View>
  );
}

// --- 5. Grow something beautiful --------------------------------------------------

const Ring: PlantId[] = ['daisy', 'hibiscus', 'sweetPeas', 'marigold', 'gerbera', 'roseBouquet'];

export function FinalScene({ active }: SceneProps) {
  const theme = useTheme();
  const { t } = useLocalization();
  // The flower opening is the welcome — a success haptic right as it blooms.
  const p = useScene(active, 1800, { at: 0.5, fire: hapticCommit });

  const flowerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clamp(p.value, [0, 0.5], [0.45, 1]) }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: clamp(p.value, [0.35, 0.55], [0, 0.26]),
    transform: [{ scale: clamp(p.value, [0.35, 0.6], [0.7, 1]) }],
  }));
  const loopStyle = useAnimatedStyle(() => ({
    opacity: clamp(p.value, [0.75, 1], [0, 1]),
    transform: [{ translateY: clamp(p.value, [0.75, 1], [8, 0]) }],
  }));

  return (
    <View style={styles.canvas}>
      <View style={styles.finalStage}>
        <Animated.View style={[styles.finalHalo, haloStyle, { backgroundColor: theme.warmthAccent }]} />
        {Ring.map((id, index) => (
          <RingFlower key={id} id={id} index={index} progress={p} />
        ))}
        <ThemedView type="surface" style={styles.finalPot}>
          <Animated.View style={[styles.finalFlower, flowerStyle]}>
            <Image source={image('peony')} style={styles.fill} contentFit="contain" />
          </Animated.View>
        </ThemedView>
      </View>
      <Animated.View style={[styles.loop, loopStyle]}>
        <LoopStep icon={{ ios: 'iphone.slash', android: 'phonelink_off', web: 'phonelink_off' }} label={t.tutorial.loopFocus} />
        <LoopArrow />
        <LoopStep icon={{ ios: 'drop.fill', android: 'water_drop', web: 'water_drop' }} label={t.tutorial.loopWater} tint={theme.droplet} />
        <LoopArrow />
        <LoopStep icon={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }} label={t.tutorial.loopBloom} />
        <LoopArrow />
        <LoopStep icon={{ ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' }} label={t.tutorial.loopCollect} tint={theme.warmthAccent} />
      </Animated.View>
    </View>
  );
}

function RingFlower({ id, index, progress }: { id: PlantId; index: number; progress: SharedValue<number> }) {
  const angle = (index / Ring.length) * Math.PI * 2 - Math.PI / 2;
  const radius = 98;
  const from = 0.4 + index * 0.06;
  const style = useAnimatedStyle(() => {
    const local = clamp(progress.value, [from, from + 0.25], [0, 1]);
    return {
      opacity: local,
      transform: [
        { translateX: Math.cos(angle) * radius * (0.7 + 0.3 * local) },
        { translateY: Math.sin(angle) * radius * (0.7 + 0.3 * local) },
        { scale: local },
      ],
    };
  });
  return (
    <Animated.View style={[styles.ringSlot, style]}>
      <ThemedView type="surface" style={[styles.ringDisc, styles.cardRaised]}>
        <Image source={image(id)} style={styles.ringImage} contentFit="contain" />
      </ThemedView>
    </Animated.View>
  );
}

function LoopStep({ icon, label, tint }: { icon: SymbolViewProps['name']; label: string; tint?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.loopStep}>
      <SymbolView name={icon} size={15} tintColor={tint ?? theme.plantPrimary} />
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function LoopArrow() {
  const theme = useTheme();
  return (
    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={9} tintColor={theme.textSecondary} />
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: SceneSize,
    height: SceneSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  centered: {
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: PillRadius,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // 1 — phone
  phone: {
    width: 92,
    height: 168,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notch: {
    position: 'absolute',
    top: 10,
    width: 26,
    height: 5,
    borderRadius: 3,
    opacity: 0.6,
  },
  phoneShadow: {
    position: 'absolute',
    top: 200,
    width: 150,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#000',
  },
  ripple: {
    position: 'absolute',
    top: 150,
    width: 170,
    height: 80,
    borderRadius: 999,
    borderWidth: 2,
  },
  chipBelow: {
    position: 'absolute',
    bottom: 12,
  },
  // 2 — water
  drop: {
    position: 'absolute',
    top: 10,
  },
  potStage: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  halo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  pot: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  potFlower: {
    width: 140,
    height: 140,
  },
  track: {
    width: 150,
    height: 6,
    borderRadius: PillRadius,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  trackFill: {
    height: '100%',
    borderRadius: PillRadius,
  },
  bloomChip: {
    position: 'absolute',
    top: 64,
    right: 8,
  },
  // 3 — collection fan
  fanSlot: {
    position: 'absolute',
  },
  card: {
    width: 96,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  cardRaised: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardArt: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    fontWeight: '600',
  },
  silhouette: {
    opacity: 0.2,
  },
  lock: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 4 — solo / together
  soloTogether: {
    gap: Spacing.four,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  modeSlot: {
    width: 136,
  },
  modeCard: {
    alignItems: 'center',
    gap: Spacing.half,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  friends: {
    flexDirection: 'row',
    height: 30,
    marginBottom: Spacing.one,
  },
  friend: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendOverlap: {
    marginLeft: -10,
  },
  modeImage: {
    width: 84,
    height: 84,
    marginBottom: Spacing.one,
  },
  onlyBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: PillRadius,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    width: SceneSize,
  },
  stripStep: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  // 5 — final
  finalStage: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalHalo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  finalPot: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  finalFlower: {
    width: 100,
    height: 100,
  },
  ringSlot: {
    position: 'absolute',
  },
  ringDisc: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringImage: {
    width: 38,
    height: 38,
  },
  loop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  loopStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half + 1,
  },
});
