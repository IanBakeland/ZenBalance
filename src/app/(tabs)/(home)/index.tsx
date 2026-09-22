import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlantView } from '@/components/PlantView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MinTapTarget, PillRadius, Spacing } from '@/constants/theme';
import { findPlant } from '@/data/plants';
import { useLocalization } from '@/hooks/useLocalization';
import { useTheme } from '@/hooks/use-theme';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useLocalization();
  const totalDroplets = useZenBalanceStore((s) => s.totalDroplets);
  const chosenPlantId = useZenBalanceStore((s) => s.chosenPlantId);
  const resetOnboarding = useZenBalanceStore((s) => s.resetOnboarding);
  const plant = findPlant(chosenPlantId);

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
        },
      ]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <ThemedText type="smallBold" themeColor="droplet">
          💧 {totalDroplets} {t.home.droplets}
        </ThemedText>
        {plant ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/plants')}
            style={({ pressed }) => [styles.changePlant, { opacity: pressed ? 0.5 : 1.0 }]}>
            <ThemedText type="caption" themeColor="textSecondary">
              {t.home.changePlant}
            </ThemedText>
            <SymbolView
              name={{ ios: 'arrow.triangle.2.circlepath', android: 'autorenew', web: 'autorenew' }}
              size={15}
              tintColor={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        {plant ? (
          // Step 5 replaces the hardcoded stage with one derived from totalDroplets.
          <PlantView plant={plant} stage={0} />
        ) : (
          <View style={styles.empty}>
            <ThemedView type="surfaceMuted" style={styles.emptyPot}>
              <ThemedText style={styles.emptyIcon}>🫙</ThemedText>
            </ThemedView>
            <ThemedText type="subtitle" style={styles.centered}>
              {t.home.noPlantTitle}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
              {t.home.noPlantBody}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {plant ? (
          <>
            <View style={styles.progressRow}>
              <ThemedText type="caption" themeColor="textSecondary">
                {totalDroplets} / {plant.dropletsToBloom} {t.home.toBloom}
              </ThemedText>
            </View>
            <ThemedView type="surfaceMuted" style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.plantAccent,
                    width: `${Math.min(100, (totalDroplets / plant.dropletsToBloom) * 100)}%`,
                  },
                ]}
              />
            </ThemedView>

            <ThemedText type="caption" themeColor="textSecondary" style={styles.duration}>
              {t.home.duration}: 25 min
            </ThemedText>
            <PrimaryButton
              label={t.home.startSession}
              onPress={() => router.push('/session')}
            />
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changePlant: {
    minHeight: MinTapTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingLeft: Spacing.three,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyPot: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  emptyIcon: {
    fontSize: 72,
    opacity: 0.55,
  },
  centered: {
    textAlign: 'center',
    maxWidth: 300,
  },
  actions: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  progressRow: {
    alignItems: 'center',
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
  },
  duration: {
    marginTop: Spacing.two,
  },
  resetButton: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
