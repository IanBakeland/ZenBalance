import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, MinTapTarget, PillRadius, Spacing } from '@/constants/Theme';
import { formatDuration, SessionDurations, type SessionDurationOption } from '@/data/SessionDurations';
import { useLocalization } from '@/hooks/UseLocalization';
import { useTheme } from '@/hooks/UseTheme';
import { hapticSelect } from '@/lib/Haptics';

export default function DurationPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t.duration.headerTitle, headerShadowVisible: false }} />

      <FlashList
        data={SessionDurations}
        keyExtractor={(option) => option.id}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
        }}
        ListHeaderComponent={
          <View style={styles.intro}>
            <ThemedText type="default" themeColor="textSecondary">
              {t.duration.intro}
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <DurationOption
            option={item}
            onPress={() => {
              hapticSelect();
              router.push({
                pathname: '/session/ready',
                params: { durationSeconds: item.seconds, droplets: item.droplets },
              });
            }}
          />
        )}
      />
    </ThemedView>
  );
}

function DurationOption({
  option,
  onPress,
}: {
  option: SessionDurationOption;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useLocalization();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1.0 }]}>
      <ThemedView type="surfaceMuted" style={styles.card}>
        <View style={styles.cardText}>
          <View style={styles.titleRow}>
            <ThemedText type="heading">
              {formatDuration(option.seconds, t.duration.seconds, t.duration.minutes)}
            </ThemedText>
            {option.isTest ? (
              <ThemedView type="backgroundElement" style={styles.testBadge}>
                <ThemedText type="caption" themeColor="textSecondary">
                  {t.duration.testBadge}
                </ThemedText>
              </ThemedView>
            ) : null}
          </View>
          <ThemedText type="caption" themeColor="droplet">
            💧 +{option.droplets} {t.home.droplets}
          </ThemedText>
        </View>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={18}
          tintColor={theme.textSecondary}
        />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  intro: {
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
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
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
  testBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: PillRadius,
  },
});
