import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { useZenBalanceStore } from '@/hooks/use-zenbalance-store';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [hasHydrated, setHasHydrated] = useState(false);
  const hasCompletedOnboarding = useZenBalanceStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    if (useZenBalanceStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    const unsub = useZenBalanceStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    return () => {
      unsub();
    };
  }, []);

  if (!hasHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {!hasCompletedOnboarding ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
        </Stack>
      ) : (
        <AppTabs />
      )}
    </ThemeProvider>
  );
}
