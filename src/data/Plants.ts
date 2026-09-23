/**
 * Static plant data, mirroring the course's `coffees.ts` pattern.
 * Names and descriptions live in `src/locales/*.json`, keyed by these ids.
 */

import type { ImageSource } from 'expo-image';

export type SoloPlantId = 'daisy' | 'hibiscus' | 'camellia' | 'marigold' | 'gerbera' | 'peony' | 'dahlia';
export type TogetherFlowerId = 'sweetPeas' | 'gardenBouquet' | 'roseBouquet' | 'peonyBouquet';
export type PlantId = SoloPlantId | TogetherFlowerId;
export type SoloPlantSize = 'small' | 'medium' | 'large';
/** 'together' doubles as the collection section and its label in `t.sizes`. */
export type PlantSize = SoloPlantSize | 'together';

/** Grown alone on Home, with droplets from solo sessions. */
export type SoloPlant = {
  id: SoloPlantId;
  size: SoloPlantSize;
  /**
   * Droplets needed to reach full bloom, at which point the flower is collected.
   * A 25-minute session earns 3 (see SessionDurations.ts). These are the
   * playtesting knob — raise them if flowers bloom too fast.
   */
  dropletsToBloom: number;
  /** Trimmed, downscaled copy of the source PNG in assets/plants/ (see assets/flowers/). */
  image: ImageSource;
};

/** Only ever earned by a Together session that runs its full length with the plant alive. */
export type TogetherFlower = {
  id: TogetherFlowerId;
  size: 'together';
  /** How long the group has to keep their phones down. */
  togetherSeconds: number;
  image: ImageSource;
  isTest?: boolean;
};

export type Plant = SoloPlant | TogetherFlower;

export const SoloPlants: readonly SoloPlant[] = [
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

export const TogetherFlowers: readonly TogetherFlower[] = [
  // The 30-second bouquet is the testing shortcut for the whole Together flow.
  { id: 'sweetPeas', size: 'together', togetherSeconds: 30, isTest: true, image: require('@/assets/flowers/friends4.png') },
  { id: 'gardenBouquet', size: 'together', togetherSeconds: 60 * 60, image: require('@/assets/flowers/friends1.png') },
  { id: 'roseBouquet', size: 'together', togetherSeconds: 90 * 60, image: require('@/assets/flowers/friends2.png') },
  { id: 'peonyBouquet', size: 'together', togetherSeconds: 120 * 60, image: require('@/assets/flowers/friends3.png') },
];

export const Plants: readonly Plant[] = [...SoloPlants, ...TogetherFlowers];

/** Seedling → in bloom; matches the `stages` labels in the locale files. */
export const StageCount = 5;

/** Only a full bloom reaches the last stage — that's the moment it's collected. */
export function growthStage(plant: SoloPlant, droplets: number) {
  if (droplets >= plant.dropletsToBloom) return StageCount - 1;
  return Math.floor((droplets / plant.dropletsToBloom) * (StageCount - 1));
}

export function findPlant(id: string | null | undefined): Plant | undefined {
  return Plants.find((plant) => plant.id === id);
}

/** Solo code paths (Home, droplets) use this, so a Together flower can never be grown alone. */
export function findSoloPlant(id: string | null | undefined): SoloPlant | undefined {
  return SoloPlants.find((plant) => plant.id === id);
}

export function findTogetherFlower(id: string | null | undefined): TogetherFlower | undefined {
  return TogetherFlowers.find((plant) => plant.id === id);
}
