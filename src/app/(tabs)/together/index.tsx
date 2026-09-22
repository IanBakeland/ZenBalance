import { StyleSheet, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, Spacing } from '@/constants/theme';

export default function TogetherHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
        },
      ]}>
      <Stack.Screen options={{ title: 'Together', headerShown: false }} />

      <View style={styles.header}>
        <ThemedText type="heading">Focus Together</ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          Share one plant with friends. Everyone must stay still!
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedView type="surface" style={styles.card}>
          <ThemedText style={styles.icon}>🪴</ThemedText>
          <ThemedText type="subtitle">Group Session</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.cardHint}>
            Phase 2 placeholder — will connect to Firebase once Phase 1 is validated.
          </ThemedText>
        </ThemedView>
      </View>

      <PrimaryButton
        label="Join Demo Room (DEMO1)"
        onPress={() => router.push('/together/DEMO1')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 260,
    padding: Spacing.four,
    borderRadius: Spacing.six,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  icon: {
    fontSize: 56,
  },
  cardHint: {
    textAlign: 'center',
  },
});
