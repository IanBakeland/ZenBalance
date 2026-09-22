import en from '@/locales/en.json';
import nl from '@/locales/nl.json';

import { useZenBalanceStore, type Language } from '@/hooks/use-zenbalance-store';

/** `nl.json` must have exactly the same keys as `en.json` — TypeScript enforces it here. */
export type Dictionary = typeof en;

const Dictionaries: Record<Language, Dictionary> = { en, nl };

/** Reads `languagePreference` from the store and returns the matching strings. */
export function useLocalization() {
  const language = useZenBalanceStore((s) => s.languagePreference);

  return { t: Dictionaries[language], language };
}
