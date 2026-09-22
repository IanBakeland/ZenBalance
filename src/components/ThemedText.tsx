import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, ThemeMode } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'heading' | 'caption' | 'small' | 'smallBold' | 'link' | 'timer' | 'code';
  themeColor?: ThemeColor;
  mode?: ThemeMode;
};

export function ThemedText({ style, type = 'default', themeColor, mode, ...rest }: ThemedTextProps) {
  const theme = useTheme(mode);

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'heading' && styles.heading,
        type === 'caption' && styles.caption,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'link' && styles.link,
        type === 'timer' && styles.timer,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: Fonts.rounded,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
  },
  heading: {
    fontFamily: Fonts.rounded,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  default: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  small: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  smallBold: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  timer: {
    fontFamily: Fonts.sans,
    fontSize: 54,
    lineHeight: 60,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  link: {
    fontFamily: Fonts.sans,
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '600',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});
