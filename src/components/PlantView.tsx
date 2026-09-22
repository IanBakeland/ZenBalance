import { StyleSheet, View } from 'react-native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

import { Spacing, type ThemeMode } from '@/constants/theme';
import { useLocalization } from '@/hooks/useLocalization';
import type { Plant } from '@/data/plants';

export type PlantViewProps = {
  plant: Plant;
  /** Index into `plant.stages`. Step 5 derives this from totalDroplets. */
  stage: number;
  mode?: ThemeMode;
};

/** The app's emotional centerpiece — generous whitespace, nothing else competing. */
export function PlantView({ plant, stage, mode }: PlantViewProps) {
  const { t } = useLocalization();
  const index = Math.min(Math.max(stage, 0), plant.stages.length - 1);

  return (
    <View style={styles.container}>
      <ThemedView mode={mode} type="surface" style={styles.pot}>
        <ThemedText mode={mode} style={styles.illustration}>
          {plant.stages[index]}
        </ThemedText>
      </ThemedView>
      <ThemedText mode={mode} type="subtitle">
        {t.plants[`${plant.id}Name`]}
      </ThemedText>
      <ThemedText mode={mode} type="caption" themeColor="textSecondary">
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
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
    // Soft, diffuse only — STYLE_GUIDE.md section 4.
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  illustration: {
    fontSize: 96,
  },
});
