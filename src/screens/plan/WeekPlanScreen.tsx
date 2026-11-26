
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { CleaningTask } from '@/types';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { todayISO } from '@/lib/dates';
import { horizonDates, planSubtitle } from '@/lib/schedule';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { WeekBoard } from '@/components/plan/WeekBoard';
import { TaskSettingsSheet } from '@/components/tasks/TaskSettingsSheet';
import { AppText } from '@/components/ui/AppText';
import { fontFamilies } from '@/theme/typography';

export function WeekPlanScreen() {
  const { state, toggleTaskDone } = useAppStore();
  const { goBack } = useNavigation();
  const { showToast } = useToast();

  const [selected, setSelected] = useState<CleaningTask | null>(null);

  const today = todayISO();
  const dates = horizonDates(today);

  const active = state.tasks.filter((task) => task.enabled);

  const upcoming = state.tasks
    .filter(
      (task) =>
        task.enabled &&
        task.dueDate > dates[dates.length - 1],
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Twój tydzień"
        subtitle={planSubtitle(state.home, today)}
        onBack={goBack}
      />

      <View style={styles.content}>
        <AppText style={styles.description}>
          Zadania są rozłożone według czasu, częstotliwości i tego,
          co masz w domu. Jeśli jakiś dzień nie wyjdzie, przesuń
          czynność albo pomiń ją tym razem.
        </AppText>

        {state.home.specialNeeds.trim() ? (
          <View style={styles.specialNeeds}>
            <AppText style={styles.specialNeedsText}>
              W planie jest miejsce na to:{' '}
              {state.home.specialNeeds.trim()}
            </AppText>
          </View>
        ) : null}

        <WeekBoard
          tasks={active}
          home={state.home}
          today={today}
          dates={dates}
          history={state.history}
          interactive
          onToggle={(task, done) => {
            toggleTaskDone(task.id);
            showToast(
              done ? 'Cofnięto zaznaczenie' : 'Zrobione.',
            );
          }}
          onOpen={(task) =>
            setSelected(
              state.tasks.find((item) => item.id === task.id) ??
                task,
            )
          }
        />

        {upcoming.length > 0 ? (
          <View style={styles.upcomingSection}>
            <AppText style={styles.sectionTitle}>
              Później, bez pośpiechu
            </AppText>

            <View style={styles.upcomingList}>
              {upcoming.slice(0, 8).map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => setSelected(task)}
                  accessibilityRole="button"
                  style={styles.upcomingItem}
                >
                  <AppText style={styles.upcomingTitle}>
                    {task.title}
                  </AppText>
                  <AppText style={styles.upcomingNote}>
                    {task.scheduleNote ?? 'Rzadsza czynność'}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {selected ? (
        <TaskSettingsSheet
          task={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5e6ce',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  description: {
    color: '#77766f',
    fontSize: 13,
    lineHeight: 21,
    fontFamily: fontFamilies.regular,
  },
  specialNeeds: {
    borderRadius: 16,
    backgroundColor: '#f8f2e8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  specialNeedsText: {
    color: '#4e4d4d',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontFamilies.regular,
  },
  upcomingSection: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 10,
    color: '#4e4d4d',
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  upcomingList: {
    gap: 8,
  },
  upcomingItem: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    elevation: 1,
  },
  upcomingTitle: {
    color: '#4e4d4d',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fontFamilies.medium,
  },
  upcomingNote: {
    color: '#77766f',
    fontSize: 12,
    fontFamily: fontFamilies.regular,
  },
});
