import { Pressable, StyleSheet, View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';

import type {
  CleaningTask,
  HistoryEntry,
  HomeProfile,
} from '@/types';
import { formatWeekdayName } from '@/lib/dates';
import {
  dayHeadline,
  dayKind,
  daySupport,
  resolveCalendar,
  tasksForDay,
} from '@/lib/schedule';
import { TaskRow } from '@/components/tasks/TaskRow';
import { AppText } from '@/components/ui/AppText';

interface WeekBoardProps {
  tasks: CleaningTask[];
  home: HomeProfile;
  today: string;
  dates: string[];
  history?: HistoryEntry[];
  interactive?: boolean;
  onToggle?: (task: CleaningTask, done: boolean) => void;
  onOpen?: (task: CleaningTask) => void;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function WeekBoard({
  tasks,
  home,
  today,
  dates,
  history = [],
  interactive = false,
  onToggle,
  onOpen,
}: WeekBoardProps) {
  const calendar = resolveCalendar(home);

  return (
    <View style={styles.container}>
      {dates.map((date) => {
        const kind = dayKind(date, calendar);

        const doneIds = new Set(
          history
            .filter((entry) => entry.doneDate === date)
            .map((entry) => entry.taskId),
        );

        const dayTasks = tasksForDay(
          tasks,
          date,
          today,
          calendar,
          doneIds,
        );

        const minutes = dayTasks.reduce(
          (sum, task) =>
            sum + (doneIds.has(task.id) ? 0 : task.minutes),
          0,
        );

        const support = daySupport(kind, dayTasks.length);
        const isToday = date === today;
        const isPast = date < today;

        return (
          <View key={date} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <AppText style={styles.dayTitle}>
                {capitalize(formatWeekdayName(date))}
                {isToday ? ' · dziś' : ''}
              </AppText>

              <AppText style={styles.headline}>
                {dayHeadline(kind, minutes, calendar.flexible)}
              </AppText>
            </View>

            {support && dayTasks.length === 0 ? (
              <AppText style={styles.support}>
                {support}
              </AppText>
            ) : null}

            {dayTasks.length > 0 ? (
              <View style={styles.taskList}>
                {dayTasks.map((task) => {
                  const done =
                    doneIds.has(task.id) ||
                    task.lastDoneDate === date;

                  const canToggle =
                    interactive && isToday && !isPast;

                  return (
                    <TaskRow
                      key={task.id}
                      task={task}
                      today={today}
                      done={done}
                      whenLabel={
                        done
                          ? 'Zrobione'
                          : isToday
                            ? 'Na dziś'
                            : isPast
                              ? 'Można wrócić do tego później'
                              : 'Zaplanowane'
                      }
                      onToggle={
                        canToggle && onToggle
                          ? () => onToggle(task, done)
                          : undefined
                      }
                      trailing={
                        interactive && onOpen ? (
                          <Pressable
                            onPress={() => onOpen(task)}
                            accessibilityRole="button"
                            accessibilityLabel={`Ustawienia: ${task.title}`}
                            style={({ pressed }) => [
                              styles.settingsButton,
                              pressed && styles.pressed,
                            ]}
                          >
                            <SlidersHorizontal
                              size={16}
                              color="#77766f"
                            />
                          </Pressable>
                        ) : undefined
                      }
                    />
                  );
                })}
              </View>
            ) : null}

            {support && dayTasks.length > 0 && kind === 'rest' ? (
              <AppText style={styles.restSupport}>
                {support}
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  dayCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    elevation: 2,
    shadowColor: '#4e4d4d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  dayTitle: {
    flexShrink: 1,
    color: '#4e4d4d',
    fontSize: 15,
  },
  headline: {
    flexShrink: 1,
    color: '#3b742f',
    fontSize: 13,
    textAlign: 'right',
  },
  support: {
    marginTop: 8,
    color: '#77766f',
    fontSize: 13,
    lineHeight: 19,
  },
  taskList: {
    marginTop: 12,
    gap: 8,
  },
  settingsButton: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  pressed: {
    backgroundColor: '#f1f0eb',
    opacity: 0.75,
  },
  restSupport: {
    marginTop: 12,
    color: '#77766f',
    fontSize: 12,
    lineHeight: 18,
  },
});