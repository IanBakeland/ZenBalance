import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/UseColorScheme';
import { useZenBalanceStore } from '@/hooks/UseZenBalanceStore';

SplashScreen.preventAutoHideAsync();

/** Feeds our palette to the navigation headers/screen backgrounds so they don't flash white. */
function navigationTheme(scheme: 'light' | 'dark'): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[scheme];

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.plantPrimary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.surfaceMuted,
    },
  };
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const hasHydrated = useZenBalanceStore((s) => s.hasHydrated);
  const hasCompletedOnboarding = useZenBalanceStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    if (hasHydrated) SplashScreen.hideAsync();
  }, [hasHydrated]);

  // AsyncStorage is async, so the store starts at its defaults; showing anything
  // before it's read would flash onboarding at a returning user.
  if (!hasHydrated) return null;

  return (
    <ThemeProvider value={navigationTheme(scheme)}>
      <StatusBar style="auto" />
      {/* The guards are the whole onboarding gate: flipping hasCompletedOnboarding
          removes one branch's routes, and expo-router navigates to the other. */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!hasCompletedOnboarding}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={hasCompletedOnboarding}>
          <Stack.Screen name="(tabs)" />
          {/* Outside (tabs) on purpose — see src/app/session/_layout.tsx — so the
              native tab bar never renders underneath the focus session. */}
          <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
