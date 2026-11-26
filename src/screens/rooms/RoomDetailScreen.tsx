
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  ListPlus,
  Plus,
  SlidersHorizontal,
} from 'lucide-react-native';

import type { CleaningTask, RoomId } from '@/types';
import { findRoom } from '@/data/rooms';
import { ROOM_ICONS } from '@/components/icons/categoryIcons';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { useNavigation } from '@/store/NavigationContext';
import { todayISO } from '@/lib/dates';
import { compareByDueDate, isDoneToday } from '@/lib/tasks';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/controls';
import { TaskRow } from '@/components/tasks/TaskRow';
import { AddTaskSheet } from '@/screens/rooms/AddTaskSheet';
import { TaskSettingsSheet } from '@/components/tasks/TaskSettingsSheet';
import {
  getHouseholdMemberLabel,
  useHouseholdMembers,
} from '@/hooks/useHouseholdMembers';
import { fontFamilies } from '@/theme/typography';

export function RoomDetailScreen({
  roomId,
}: {
  roomId: RoomId;
}) {
  const { state, toggleTaskDone } = useAppStore();
  const { goBack } = useNavigation();
  const { showToast } = useToast();
  const { members } = useHouseholdMembers();

  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<CleaningTask | null>(null);

  const today = todayISO();
  const room = findRoom(roomId);

  if (!room) {
    return (
      <>
        <ScreenHeader
          title="Pomieszczenie"
          onBack={goBack}
        />

        <View style={styles.emptyRoom}>
          <EmptyState
            icon={ListPlus}
            title="Nie znaleziono pomieszczenia"
            text="Wróć do listy i wybierz pomieszczenie ponownie."
          />
        </View>
      </>
    );
  }

  const Icon = ROOM_ICONS[roomId];

  const tasks = state.tasks
    .filter((task) => task.roomId === roomId && task.enabled)
    .sort(compareByDueDate);

  const paused = state.tasks.filter(
    (task) => task.roomId === roomId && !task.enabled,
  );

  const doneCount = tasks.filter(
    (task) => isDoneToday(task, today),
  ).length;

  return (
    <>
      <ScreenHeader
        title={room.name}
        subtitle={`${doneCount} z ${tasks.length} zrobione dziś`}
        onBack={goBack}
      />

      <View style={styles.container}>
        <View style={styles.infoCard}>
          <View style={styles.roomIcon}>
            <Icon size={24} color="#3b742f" />
          </View>

          <View style={styles.infoText}>
            <AppText style={styles.infoTitle}>
              Zadania w pomieszczeniu
            </AppText>

            <AppText style={styles.infoDescription}>
              Zaznacz, gdy coś zrobisz. Brak wykonania nikogo nie karze.
            </AppText>
          </View>
        </View>

        <Pressable
          onPress={() => setAdding(true)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed,
          ]}
        >
          <Plus size={18} color="#ffffff" />

          <AppText style={styles.addButtonText}>
            Dodaj zadanie
          </AppText>
        </Pressable>

        {tasks.length === 0 ? (
          <EmptyState
            icon={ListPlus}
            title="Brak zadań w tym pomieszczeniu"
            text="Dodaj własne zadanie albo wybierz gotowe z biblioteki na ekranie Mój dom."
          />
        ) : (
          <View style={styles.taskList}>
            {tasks.map((task) => {
              const done = isDoneToday(task, today);

              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  assignedToLabel={getHouseholdMemberLabel(
                    members,
                    task.assignedTo,
                  )}
                  today={today}
                  done={done}
                  onToggle={() => {
                    toggleTaskDone(task.id);

                    showToast(
                      done
                        ? 'Cofnięto zaznaczenie'
                        : 'Zrobione. Dobra robota!',
                    );
                  }}
                  trailing={
                    <Pressable
                      onPress={() => setSelected(task)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ustawienia: ${task.title}`}
                      style={({ pressed }) => [
                        styles.settingsButton,
                        pressed && styles.settingsButtonPressed,
                      ]}
                    >
                      <SlidersHorizontal
                        size={16}
                        color="#77766f"
                      />
                    </Pressable>
                  }
                />
              );
            })}
          </View>
        )}

        {paused.length > 0 ? (
          <View style={styles.pausedSection}>
            <AppText style={styles.pausedTitle}>
              Wyłączone
            </AppText>

            <View style={styles.pausedList}>
              {paused.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => setSelected(task)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.pausedTask,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.pausedTaskText}>
                    {task.title}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {adding ? (
        <AddTaskSheet
          roomId={roomId}
          onClose={() => setAdding(false)}
        />
      ) : null}

      {selected ? (
        <TaskSettingsSheet
          task={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  emptyRoom: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  container: {
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  roomIcon: {
    width: 48,
    height: 48,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#eaf2e5',
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  infoTitle: {
    color: '#4e4d4d',
    fontSize: 15,
    fontFamily: fontFamilies.bold,
  },
  infoDescription: {
    color: '#77766f',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fontFamilies.regular,
  },
  addButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#3b742f',
    elevation: 2,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  taskList: {
    gap: 12,
  },
  settingsButton: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  settingsButtonPressed: {
    backgroundColor: '#eeece7',
  },
  pausedSection: {
    gap: 10,
  },
  pausedTitle: {
    color: '#4e4d4d',
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  pausedList: {
    gap: 8,
  },
  pausedTask: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  pausedTaskText: {
    color: '#77766f',
    fontSize: 14,
    fontFamily: fontFamilies.medium,
  },
  pressed: {
    opacity: 0.75,
  },
});
