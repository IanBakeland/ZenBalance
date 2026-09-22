import { StyleSheet, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLocalization } from '@/hooks/useLocalization';

export default function TogetherHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
        },
      ]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <ThemedText type="heading">{t.together.title}</ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          {t.together.subtitle}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedView type="surface" style={styles.card}>
          <ThemedText style={styles.icon}>🪴</ThemedText>
          <ThemedText type="subtitle">{t.together.cardTitle}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.cardHint}>
            {t.together.cardHint}
          </ThemedText>
        </ThemedView>
      </View>

      <PrimaryButton
        label={t.together.joinDemo}
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
