
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  actions,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 16) },
      ]}
    >
      {onBack && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Wróć"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color="#4e4d4d" />
        </Pressable>
      )}

      <View style={styles.titleContainer}>
        <AppText

          style={styles.title}
          numberOfLines={1}
        >
          {title}
        </AppText>

        {subtitle ? (
          <AppText
            style={styles.subtitle}
            numberOfLines={1}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {actions ? (
        <View style={styles.actions}>
          {actions}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#f5e6ce',
    zIndex: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#4e4d4d',
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    marginTop: 2,
    color: '#77766f',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexShrink: 0,
    alignItems: 'center',
    gap: 8,
  },
});
