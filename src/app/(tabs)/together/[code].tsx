import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { useLocalization } from '@/hooks/useLocalization';

export default function TogetherRoomScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const sessionCode = code?.toUpperCase() ?? 'ROOM';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: Spacing.two, paddingBottom: insets.bottom + Spacing.four },
      ]}>
      <Stack.Screen options={{ title: `${t.together.roomHeader} ${sessionCode}`, headerShadowVisible: false }} />

      <View style={styles.center}>
        <ThemedText type="subtitle">
          {t.together.sessionLabel}: {sessionCode}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.hint}>
          {t.together.lobbyHint}
        </ThemedText>
      </View>

      <PrimaryButton label={t.together.leaveRoom} onPress={() => router.back()} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  hint: {
    textAlign: 'center',
  },
});
