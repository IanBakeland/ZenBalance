import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { findPlant } from '@/data/plants';

export type Language = 'nl' | 'en';

export interface ZenBalanceState {
  /**
   * False until AsyncStorage has been read. Not persisted meaningfully — the root
   * layout holds the splash screen on it, so a returning user never flashes onboarding.
   */
  hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  languagePreference: Language;
  chosenPlantId: string | null;
  totalDroplets: number;
  /**
   * Set by `addDroplets` so Home can play a one-off droplet-arrival animation
   * on the progress bar, then clear it. Like `hasHydrated`, not meaningfully
   * persisted — reset on every rehydrate so a killed app never replays it.
   */
  pendingRewardDroplets: number | null;
  totalSessionsCompleted: number;
  currentStreak: number;
  /** Plant id → when it was first collected (ms). The keys are the collection. */
  collectedAt: Record<string, number>;
  /**
   * The flower that just bloomed. `addDroplets` has already collected it and
   * cleared the pot; Home keeps showing it in full bloom until the collection
   * popup is dismissed. Persisted, so a killed app still shows the popup.
   */
  pendingCollection: { plantId: string; isNew: boolean } | null;
  setLanguage: (language: Language) => void;
  /** Onboarding only settles the language (via setLanguage); the plant is picked on Home. */
  completeOnboarding: () => void;
  /**
   * Sets the chosen plant. `resetDroplets` clears the current water progress —
   * the caller (the plant picker) is responsible for confirming that with the
   * user first when there's progress to lose.
   */
  switchPlant: (plantId: string, resetDroplets: boolean) => void;
  /** Also collects the chosen plant once this pushes it to full bloom. */
  addDroplets: (amount: number) => void;
  /** Called when the collection popup is dismissed. */
  acknowledgeCollection: () => void;
  /** Home calls this once it's finished playing the arrival animation. */
  clearPendingReward: () => void;
  /** Debug-only: lets the Step 2 "onboarding shows once" test rerun without a reinstall. */
  resetOnboarding: () => void;
}

/** Device language as the onboarding default, per PROJECT_PLAN.md section 2.5. */
function deviceLanguage(): Language {
  return getLocales()[0]?.languageCode === 'nl' ? 'nl' : 'en';
}

export const useZenBalanceStore = create<ZenBalanceState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasCompletedOnboarding: false,
      languagePreference: deviceLanguage(),
      chosenPlantId: null,
      totalDroplets: 0,
      pendingRewardDroplets: null,
      totalSessionsCompleted: 0,
      currentStreak: 0,
      collectedAt: {},
      pendingCollection: null,
      setLanguage: (language) => set(() => ({ languagePreference: language })),
      completeOnboarding: () => set(() => ({ hasCompletedOnboarding: true })),
      switchPlant: (plantId, resetDroplets) =>
        set((state) => ({
          chosenPlantId: plantId,
          totalDroplets: resetDroplets ? 0 : state.totalDroplets,
        })),
      addDroplets: (amount) =>
        set((state) => {
          const totalDroplets = state.totalDroplets + amount;
          const plant = findPlant(state.chosenPlantId);
          if (!plant || totalDroplets < plant.dropletsToBloom) {
            return { totalDroplets, pendingRewardDroplets: amount };
          }
          // ponytail: overflow droplets are dropped — there's no next plant to
          // carry them to until the user picks one.
          return {
            totalDroplets: 0,
            chosenPlantId: null,
            pendingRewardDroplets: amount,
            pendingCollection: { plantId: plant.id, isNew: !(plant.id in state.collectedAt) },
            // Spread last so a regrown flower keeps its first collection date.
            collectedAt: { [plant.id]: Date.now(), ...state.collectedAt },
          };
        }),
      acknowledgeCollection: () => set(() => ({ pendingCollection: null })),
      clearPendingReward: () => set(() => ({ pendingRewardDroplets: null })),
      resetOnboarding: () =>
        set(() => ({ hasCompletedOnboarding: false, chosenPlantId: null })),
    }),
    {
      name: 'zenbalance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Runs once AsyncStorage has been read, including when it was empty.
      onRehydrateStorage: () => () =>
        useZenBalanceStore.setState({ hasHydrated: true, pendingRewardDroplets: null }),
    }
  )
);
