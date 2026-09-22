import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MinTapTarget, Spacing } from '@/constants/theme';
import { Plants, type Plant } from '@/data/plants';
import { useLocalization } from '@/hooks/useLocalization';
import { useTheme } from '@/hooks/use-theme';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';
import { hapticCommit } from '@/lib/haptics';

export default function PlantPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const chosenPlantId = useZenBalanceStore((s) => s.chosenPlantId);
  const choosePlant = useZenBalanceStore((s) => s.choosePlant);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t.plants.headerTitle, headerShadowVisible: false }} />

      <FlashList
        data={Plants}
        keyExtractor={(plant) => plant.id}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
        }}
        ListHeaderComponent={
          <View style={styles.intro}>
            <ThemedText type="default" themeColor="textSecondary">
              {t.plants.intro}
            </ThemedText>
            {chosenPlantId ? (
              <ThemedText type="caption" themeColor="plantPrimary">
                {t.plants.keepDroplets}
              </ThemedText>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <PlantOption
            plant={item}
            isChosen={item.id === chosenPlantId}
            onPress={() => {
              choosePlant(item.id);
              hapticCommit();
              router.back();
            }}
          />
        )}
      />
    </ThemedView>
  );
}

function PlantOption({
  plant,
  isChosen,
  onPress,
}: {
  plant: Plant;
  isChosen: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useLocalization();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isChosen }}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}>
      <ThemedView
        type={isChosen ? 'surface' : 'surfaceMuted'}
        style={[styles.card, { borderColor: isChosen ? theme.plantPrimary : 'transparent' }]}>
        <View style={styles.preview}>
          {/* The final stage, so the card shows what you're growing towards. */}
          <ThemedText style={styles.previewIcon}>
            {plant.stages[plant.stages.length - 1]}
          </ThemedText>
        </View>

        <View style={styles.cardText}>
          <View style={styles.titleRow}>
            <ThemedText type="heading">{t.plants[`${plant.id}Name`]}</ThemedText>
            {isChosen ? (
              <SymbolView
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                size={20}
                tintColor={theme.plantPrimary}
              />
            ) : null}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {t.plants[`${plant.id}Blurb`]}
          </ThemedText>
          <ThemedText type="caption" themeColor="droplet">
            {t.sizes[plant.size]} · {plant.dropletsToBloom} {t.plants.dropletsToBloom}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  intro: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  separator: {
    height: Spacing.three,
  },
  card: {
    minHeight: MinTapTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 2,
  },
  preview: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 44,
  },
  cardText: {
    flex: 1,
    gap: Spacing.half,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
