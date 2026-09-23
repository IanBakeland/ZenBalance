/**
 * Static plant data, mirroring the course's `coffees.ts` pattern.
 * Names and descriptions live in `src/locales/*.json`, keyed by these ids.
 */

import type { ImageSource } from 'expo-image';

export type PlantId = 'daisy' | 'hibiscus' | 'camellia' | 'marigold' | 'gerbera' | 'peony' | 'dahlia';
export type PlantSize = 'small' | 'medium' | 'large';

export type Plant = {
  id: PlantId;
  size: PlantSize;
  /**
   * Droplets needed to reach full bloom, at which point the flower is collected.
   * A 25-minute session earns 3 (see sessionDurations.ts). These are the
   * playtesting knob — raise them if flowers bloom too fast.
   */
  dropletsToBloom: number;
  /** Trimmed, downscaled copy of the source PNG in assets/plants/ (see assets/flowers/). */
  image: ImageSource;
};

export const Plants: readonly Plant[] = [
  // Daisy is deliberately cheap: two 10-second test sessions walk the whole
  // grow → collect flow without a real focus session.
  { id: 'daisy', size: 'small', dropletsToBloom: 2, image: require('@/assets/flowers/small1.png') },
  { id: 'hibiscus', size: 'small', dropletsToBloom: 5, image: require('@/assets/flowers/small2.png') },
  { id: 'camellia', size: 'small', dropletsToBloom: 8, image: require('@/assets/flowers/small3.png') },
  { id: 'marigold', size: 'medium', dropletsToBloom: 14, image: require('@/assets/flowers/medium1.png') },
  { id: 'gerbera', size: 'medium', dropletsToBloom: 20, image: require('@/assets/flowers/medium2.png') },
  { id: 'peony', size: 'large', dropletsToBloom: 35, image: require('@/assets/flowers/big1.png') },
  { id: 'dahlia', size: 'large', dropletsToBloom: 50, image: require('@/assets/flowers/big2.png') },
];

/** Seedling → in bloom; matches the `stages` labels in the locale files. */
export const StageCount = 5;

/** Only a full bloom reaches the last stage — that's the moment it's collected. */
export function growthStage(plant: Plant, droplets: number) {
  if (droplets >= plant.dropletsToBloom) return StageCount - 1;
  return Math.floor((droplets / plant.dropletsToBloom) * (StageCount - 1));
}

export function findPlant(id: string | null | undefined): Plant | undefined {
  return Plants.find((plant) => plant.id === id);
}
