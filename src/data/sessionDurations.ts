/**
 * The timer duration picker's options: how long a focus session runs and how
 * many water droplets it earns on success. Longer sessions earn more — the
 * core progression hook (PROJECT_PLAN.md section 2.3's "roughly 1 droplet per
 * 5 minutes" rule, made explicit and selectable instead of fixed at 25 min).
 */

export type SessionDurationOption = {
  id: string;
  seconds: number;
  droplets: number;
  /** Marks the 10-second option as a testing shortcut, not a real focus length. */
  isTest?: boolean;
};

export const SessionDurations: readonly SessionDurationOption[] = [
  { id: 'test10s', seconds: 10, droplets: 1, isTest: true },
  { id: 'min10', seconds: 10 * 60, droplets: 1 },
  { id: 'min25', seconds: 25 * 60, droplets: 3 },
  { id: 'min45', seconds: 45 * 60, droplets: 5 },
  { id: 'min60', seconds: 60 * 60, droplets: 7 },
];

export function findSessionDuration(id: string | null): SessionDurationOption | undefined {
  return SessionDurations.find((option) => option.id === id);
}
