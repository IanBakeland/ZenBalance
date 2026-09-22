import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ZenBalanceState {
  hasCompletedOnboarding: boolean;
  languagePreference: 'nl' | 'en';
  chosenPlantId: string | null;
  totalDroplets: number;
  totalSessionsCompleted: number;
  currentStreak: number;
  completeOnboarding: (plantId: string, language: 'nl' | 'en') => void;
  addDroplets: (amount: number) => void;
  resetOnboarding: () => void;
}

export const useZenBalanceStore = create<ZenBalanceState>()(
  persist(
    (set) => ({
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
    }
  )
);
