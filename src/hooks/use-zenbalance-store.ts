import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ZenBalanceState {
  /**
   * False until AsyncStorage has been read. Not persisted meaningfully — the root
   * layout holds the splash screen on it, so a returning user never flashes onboarding.
   */
  hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  languagePreference: 'nl' | 'en';
  chosenPlantId: string | null;
  totalDroplets: number;
  totalSessionsCompleted: number;
  currentStreak: number;
  completeOnboarding: (plantId: string, language: 'nl' | 'en') => void;
  addDroplets: (amount: number) => void;
  /** Debug-only: lets the Step 2 "onboarding shows once" test rerun without a reinstall. */
  resetOnboarding: () => void;
}

export const useZenBalanceStore = create<ZenBalanceState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasCompletedOnboarding: false,
      languagePreference: 'nl',
      chosenPlantId: null,
      totalDroplets: 0,
      totalSessionsCompleted: 0,
      currentStreak: 0,
      completeOnboarding: (plantId, language) =>
        set(() => ({
          hasCompletedOnboarding: true,
          chosenPlantId: plantId,
          languagePreference: language,
        })),
      addDroplets: (amount) =>
        set((state) => ({ totalDroplets: state.totalDroplets + amount })),
      resetOnboarding: () =>
        set(() => ({
          hasCompletedOnboarding: false,
          chosenPlantId: null,
        })),
    }),
    {
      name: 'zenbalance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Runs once AsyncStorage has been read, including when it was empty.
      onRehydrateStorage: () => () => useZenBalanceStore.setState({ hasHydrated: true }),
    }
  )
);
