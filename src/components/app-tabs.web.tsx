import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

import { MaxContentWidth, MinTapTarget, PillRadius, Spacing } from '@/constants/theme';
import { useLocalization } from '@/hooks/useLocalization';

export default function AppTabs() {
  const { t } = useLocalization();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="(home)" href="/" asChild>
            <TabButton>{t.tabs.home}</TabButton>
          </TabTrigger>
          <TabTrigger name="together" href="/together" asChild>
            <TabButton>{t.tabs.together}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText
          type="smallBold"
          themeColor={isFocused ? 'plantPrimary' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="surface" style={styles.innerContainer}>
        <ThemedText type="smallBold" themeColor="plantPrimary" style={styles.brandText}>
          ZenBalance
        </ThemedText>

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: PillRadius,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    minHeight: MinTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: PillRadius,
  },
});
