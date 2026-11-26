import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';

export function ProgressBar({
  value,
  max,
  className: _className = '',
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const percent =
    max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max,
        now: Math.min(max, Math.max(0, value)),
      }}
      style={styles.progressTrack}
    >
      <View
        style={[
          styles.progressFill,
          { width: `${percent}%` },
        ]}
      />
    </View>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={({ pressed }) => [
        styles.toggleTrack,
        checked ? styles.toggleActive : styles.toggleInactive,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.toggleThumb,
          checked ? styles.toggleThumbActive : styles.toggleThumbInactive,
        ]}
      />
    </Pressable>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <View
      accessibilityLabel={label}
      style={styles.segmentContainer}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.segment,
              active ? styles.segmentActive : styles.segmentInactive,
              pressed && styles.pressed,
            ]}
          >
            {Icon ? (
              <Icon
                size={16}
                color={active ? '#4e4d4d' : '#77766f'}
              />
            ) : null}

            <AppText
           
              style={[
                styles.segmentText,
                active
                  ? styles.segmentTextActive
                  : styles.segmentTextInactive,
              ]}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Icon size={26} color="#3b742f" />
      </View>

      <AppText style={styles.emptyTitle}>
        {title}
      </AppText>

      <AppText style={styles.emptyText}>
        {text}
      </AppText>

      {action ? (
        <View style={styles.emptyAction}>
          {action}
        </View>
      ) : null}
    </View>
  );
}

export function DemoNotice({ text }: { text: string }) {
  return (
    <AppText style={styles.noticeText}>
      <AppText style={styles.noticeBold}>
        Dane demonstracyjne.
      </AppText>
      {' '}
      {text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  progressTrack: {
    width: '100%',
    height: 10,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#e5eddf',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#73a62d',
  },

  toggleTrack: {
    width: 48,
    height: 28,
    flexShrink: 0,
    justifyContent: 'center',
    borderRadius: 999,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#3b742f',
  },
  toggleInactive: {
    backgroundColor: '#b8b6af',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.75,
  },

  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    backgroundColor: '#eeece7',
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  segmentInactive: {
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#4e4d4d',
  },
  segmentTextInactive: {
    color: '#77766f',
  },

  emptyContainer: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#c9c6bd',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#edf4e9',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#4e4d4d',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    maxWidth: 280,
    marginTop: 6,
    color: '#77766f',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 20,
  },

  noticeText: {
    borderWidth: 1,
    borderColor: '#e9d9b9',
    borderRadius: 16,
    backgroundColor: '#fbf4e8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#80643c',
    fontSize: 12,
    lineHeight: 18,
  },
  noticeBold: {
    color: '#80643c',
  },
});