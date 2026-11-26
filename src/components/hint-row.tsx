
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { fontFamilies } from '@/theme/typography';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({
  title = 'Try editing',
  hint = 'app/index.tsx',
}: HintRowProps) {
  return (
    <View style={styles.stepRow}>
      <AppText style={styles.title}>{title}</AppText>

      <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
        <AppText style={styles.hint}>{hint}</AppText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fontFamilies.regular,
  },
  hint: {
    fontFamily: fontFamilies.regular,
    color: '#4e4d4d',
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
