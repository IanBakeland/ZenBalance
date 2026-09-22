import { StyleSheet, Pressable, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MinTapTarget, Spacing } from '@/constants/theme';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const totalDroplets = useZenBalanceStore((s) => s.totalDroplets);
  const chosenPlantId = useZenBalanceStore((s) => s.chosenPlantId);
  const resetOnboarding = useZenBalanceStore((s) => s.resetOnboarding);

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
        },
      ]}>
      <Stack.Screen options={{ title: 'ZenBalance', headerShown: false }} />

      {/* Top Header stats */}
      <View style={styles.header}>
        <ThemedText type="smallBold" themeColor="plantPrimary">
          Plant: {chosenPlantId ?? 'None'}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="droplet">
          💧 {totalDroplets} Droplets
        </ThemedText>
      </View>

      {/* Center Plant View Placeholder */}
      <View style={styles.plantContainer}>
        <ThemedView type="surface" style={styles.plantCard}>
          <ThemedText style={styles.plantEmoji}>🌱</ThemedText>
          <ThemedText type="subtitle">Seedling</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            PlantView placeholder (Step 3)
          </ThemedText>
        </ThemedView>
      </View>

      {/* Controls & Actions */}
      <View style={styles.actions}>
        <ThemedText type="caption" themeColor="textSecondary">
          Duration: 25 minutes
        </ThemedText>

        <PrimaryButton label="Start Session" onPress={() => router.push('/session')} />

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.5 : 1.0 }]}
          onPress={resetOnboarding}>
          <ThemedText type="caption" themeColor="textSecondary">
            Reset Onboarding (Debug)
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
  plantContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantCard: {
    width: 240,
    height: 240,
    borderRadius: Spacing.six,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  plantEmoji: {
    fontSize: 64,
  },
  actions: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  resetButton: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
