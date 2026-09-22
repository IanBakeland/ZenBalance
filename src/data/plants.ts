/**
 * Static plant data, mirroring the course's `coffees.ts` pattern.
 * Names and descriptions live in `src/locales/*.json`, keyed by these ids.
 */

export type PlantId = 'basil' | 'fern' | 'monstera';
export type PlantSize = 'small' | 'medium' | 'large';

export type Plant = {
  id: PlantId;
  size: PlantSize;
  /**
   * Droplets needed to reach the final stage. Roughly 1 droplet per 5 minutes of
   * stillness (PROJECT_PLAN.md section 2.3), so a 25-minute session earns ~5.
   * These are the playtesting knob — raise them if plants bloom too fast.
   */
  dropletsToBloom: number;
  /** One entry per growth stage, seedling first. Emoji stand in until the illustrations land. */
  stages: readonly string[];
};

export const Plants: readonly Plant[] = [
  { id: 'basil', size: 'small', dropletsToBloom: 15, stages: ['🌱', '🌿', '🪴', '☘️', '🌼'] },
  { id: 'fern', size: 'medium', dropletsToBloom: 35, stages: ['🌱', '🌿', '🪴', '🎍', '🌸'] },
  { id: 'monstera', size: 'large', dropletsToBloom: 70, stages: ['🌱', '🌿', '🪴', '🌳', '🌺'] },
];

export function findPlant(id: string | null): Plant | undefined {
  return Plants.find((plant) => plant.id === id);
}
