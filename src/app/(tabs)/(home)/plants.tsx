import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MinTapTarget, Spacing } from '@/constants/theme';
import { Plants, type Plant } from '@/data/plants';
import { useLocalization } from '@/hooks/useLocalization';
import { useTheme } from '@/hooks/use-theme';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';
import { hapticCommit, hapticSelect } from '@/lib/haptics';

export default function PlantPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const chosenPlantId = useZenBalanceStore((s) => s.chosenPlantId);
  const totalDroplets = useZenBalanceStore((s) => s.totalDroplets);
  const switchPlant = useZenBalanceStore((s) => s.switchPlant);

  // Switching plants while the current one has progress resets that progress —
  // confirm first rather than losing it silently.
  const [pendingPlant, setPendingPlant] = useState<Plant | null>(null);

  function selectPlant(plant: Plant) {
    if (plant.id === chosenPlantId) {
      router.back();
      return;
    }
    if (totalDroplets > 0) {
      setPendingPlant(plant);
      return;
    }
    switchPlant(plant.id, false);
    hapticCommit();
    router.back();
  }

  function confirmSwitch() {
    if (!pendingPlant) return;
    switchPlant(pendingPlant.id, true);
    hapticCommit();
    setPendingPlant(null);
    router.back();
  }

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
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <PlantOption
            plant={item}
            isChosen={item.id === chosenPlantId}
            onPress={() => selectPlant(item)}
          />
        )}
      />

      <Modal
        visible={pendingPlant !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingPlant(null)}>
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          onPress={() => setPendingPlant(null)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <ThemedView type="surface" style={styles.dialogCard}>
              <ThemedText type="heading">{t.plants.confirmSwitchTitle}</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                {t.plants.confirmSwitchBody}
              </ThemedText>
              <View style={styles.dialogActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    hapticSelect();
                    setPendingPlant(null);
                  }}
                  style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.5 : 1.0 }]}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    {t.plants.confirmSwitchCancel}
                  </ThemedText>
                </Pressable>
                <View style={styles.continueButton}>
                  <PrimaryButton label={t.plants.confirmSwitchContinue} onPress={confirmSwitch} />
                </View>
              </View>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 18, 14, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
  },
  dialogCard: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  cancelButton: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  continueButton: {
    flex: 1,
  },
});
