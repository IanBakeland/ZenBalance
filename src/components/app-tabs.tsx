import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useLocalization } from '@/hooks/useLocalization';

export default function AppTabs() {
  const { t } = useLocalization();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={colors.backgroundSelected}
      tintColor={colors.plantPrimary}
      iconColor={{
        default: colors.textSecondary,
        selected: colors.plantPrimary,
      }}
      labelStyle={{
        selected: { color: colors.plantPrimary },
      }}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>{t.tabs.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="leaf" md="eco" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="together">
        <NativeTabs.Trigger.Label>{t.tabs.together}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" md="group" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
