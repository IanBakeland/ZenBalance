import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  totalSessionsCompleted: number;
  currentStreak: number;
  setLanguage: (language: Language) => void;
  /** Onboarding only settles the language (via setLanguage); the plant is picked on Home. */
  completeOnboarding: () => void;
  /** Also used to swap plants later on — droplets are global, so progress carries over. */
  choosePlant: (plantId: string) => void;
  addDroplets: (amount: number) => void;
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
      totalSessionsCompleted: 0,
      currentStreak: 0,
      setLanguage: (language) => set(() => ({ languagePreference: language })),
      completeOnboarding: () => set(() => ({ hasCompletedOnboarding: true })),
      choosePlant: (plantId) => set(() => ({ chosenPlantId: plantId })),
      addDroplets: (amount) =>
        set((state) => ({ totalDroplets: state.totalDroplets + amount })),
      resetOnboarding: () =>
        set(() => ({ hasCompletedOnboarding: false, chosenPlantId: null })),
    }),
    {
      name: 'zenbalance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Runs once AsyncStorage has been read, including when it was empty.
      onRehydrateStorage: () => () => useZenBalanceStore.setState({ hasHydrated: true }),
    }
  )
);
