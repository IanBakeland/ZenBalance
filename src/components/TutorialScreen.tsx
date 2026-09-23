import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from './PrimaryButton';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import {
  CollectionScene,
  FinalScene,
  PhoneScene,
  SceneSize,
  SoloTogetherScene,
  WaterScene,
} from './TutorialScenes';

import { BottomTabInset, MinTapTarget, PillRadius, Spacing } from '@/constants/Theme';
import { useLocalization } from '@/hooks/UseLocalization';
import { useTheme } from '@/hooks/UseTheme';
import { useZenBalanceStore } from '@/hooks/UseZenBalanceStore';
import { hapticCommit, hapticSelect } from '@/lib/Haptics';

type Page = { Scene: ComponentType<{ active: boolean }>; title: string; body: string };

/**
 * The one tutorial in the app. Two routes render it: `onboarding/tutorial` on a
 * first launch, and `(home)/tutorial` when it's opened again from the ⓘ button.
 * Only the ending differs — the first run commits onboarding, a replay just goes back.
 *
 * Five swipeable pages, one idea each; the illustration leads, the text supports.
 */
export default function TutorialScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const completeOnboarding = useZenBalanceStore((s) => s.completeOnboarding);
  // Read once at mount rather than subscribing: finishing onboarding flips this
  // flag, and the footer must not change under the user's finger mid-press.
  const [isReplay] = useState(() => useZenBalanceStore.getState().hasCompletedOnboarding);

  const pages: Page[] = [
    { Scene: PhoneScene, title: t.tutorial.p1Title, body: t.tutorial.p1Body },
    { Scene: WaterScene, title: t.tutorial.p2Title, body: t.tutorial.p2Body },
    { Scene: CollectionScene, title: t.tutorial.p3Title, body: t.tutorial.p3Body },
    { Scene: SoloTogetherScene, title: t.tutorial.p4Title, body: t.tutorial.p4Body },
    { Scene: FinalScene, title: t.tutorial.p5Title, body: t.tutorial.p5Body },
  ];
  const lastIndex = pages.length - 1;

  const [index, setIndex] = useState(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });
  // A Next tap already gave its own haptic (PrimaryButton); only swipes add one.
  const pagedByButton = useRef(false);

  // Unfolding a Fold (or rotating) changes the page width — stay on the same page.
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: index * width, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  function goTo(next: number) {
    pagedByButton.current = true;
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  }

  function onMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) {
      setIndex(next);
      if (!pagedByButton.current) hapticSelect();
    }
    pagedByButton.current = false;
  }

  function leave() {
    // canGoBack is false when the tutorial was deep-linked straight in,
    // which would otherwise dead-end the user on this screen.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function finish() {
    if (isReplay) {
      leave();
      return;
    }
    hapticCommit();
    // Flipping the store is the whole navigation: the root Stack's guard
    // swaps the onboarding stack out for the tabs.
    completeOnboarding();
  }

  // Room for the illustration: whatever the text and footer leave, capped so
  // it never dominates a tablet or gets squeezed on a folded cover screen.
  const sceneSize = Math.max(200, Math.min(width - Spacing.five * 2, height * 0.42, 360));

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.two,
          // The replay lives inside the Home tab, so the floating native tab bar
          // would otherwise sit on top of the button. Onboarding has no tab bar.
          paddingBottom: isReplay ? insets.bottom + BottomTabInset + Spacing.three : insets.bottom + Spacing.three,
        },
      ]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        {router.canGoBack() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isReplay ? t.onboarding.replayCta : t.onboarding.tutorialHeaderTitle}
            onPress={leave}
            style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.5 : 1.0 }]}>
            <SymbolView
              name={
                isReplay
                  ? { ios: 'xmark', android: 'close', web: 'close' }
                  : { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }
              }
              size={20}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
        {index < lastIndex ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              hapticSelect();
              if (isReplay) leave();
              else completeOnboarding();
            }}
            style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.5 : 1.0 }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t.tutorial.skip}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        style={styles.pager}>
        {pages.map(({ Scene, title, body }, pageIndex) => (
          <TutorialPage
            key={pageIndex}
            index={pageIndex}
            width={width}
            scrollX={scrollX}
            sceneSize={sceneSize}
            title={title}
            body={body}>
            <Scene active={pageIndex === index} />
          </TutorialPage>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: pages.length, now: index + 1 }}>
          {pages.map((_, dotIndex) => (
            <Dot key={dotIndex} index={dotIndex} width={width} scrollX={scrollX} />
          ))}
        </View>
        <PrimaryButton
          label={index < lastIndex ? t.tutorial.next : isReplay ? t.onboarding.replayCta : t.tutorial.start}
          onPress={() => (index < lastIndex ? goTo(index + 1) : finish())}
        />
      </View>
    </ThemedView>
  );
}

/**
 * One page. As it slides, the illustration drifts slower than the page and
 * the text a touch faster — a gentle parallax that makes swiping feel physical.
 */
function TutorialPage({
  index,
  width,
  scrollX,
  sceneSize,
  title,
  body,
  children,
}: {
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  sceneSize: number;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const sceneStyle = useAnimatedStyle(() => {
    const offset = scrollX.value - index * width;
    return {
      opacity: interpolate(Math.abs(offset), [0, width * 0.8], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: offset * 0.35 }],
    };
  });
  const textStyle = useAnimatedStyle(() => {
    const offset = scrollX.value - index * width;
    return {
      opacity: interpolate(Math.abs(offset), [0, width * 0.6], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: -offset * 0.12 }],
    };
  });

  return (
    <View style={[styles.page, { width }]}>
      <Animated.View style={[styles.sceneArea, sceneStyle]}>
        {/* Scenes are drawn at SceneSize and scaled, so they fit any phone. */}
        <View style={{ width: sceneSize, height: sceneSize, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ transform: [{ scale: sceneSize / SceneSize }] }}>{children}</View>
        </View>
      </Animated.View>
      <Animated.View style={[styles.text, textStyle]}>
        <ThemedText type="title" style={styles.centered} accessibilityRole="header">
          {title}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.centered}>
          {body}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

function Dot({ index, width, scrollX }: { index: number; width: number; scrollX: SharedValue<number> }) {
  const theme = useTheme();
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value / width - index);
    return {
      width: interpolate(distance, [0, 1], [24, 8], Extrapolation.CLAMP),
      opacity: interpolate(distance, [0, 1], [1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, style, { backgroundColor: theme.plantPrimary }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  iconButton: {
    width: MinTapTarget,
    height: MinTapTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skip: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  sceneArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    alignSelf: 'center',
    maxWidth: 380,
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  centered: {
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  dot: {
    height: 8,
    borderRadius: PillRadius,
  },
});
