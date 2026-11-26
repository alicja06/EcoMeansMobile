import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check } from 'lucide-react-native';

import { findRoom } from '@/data/rooms';
import { TASK_LIBRARY } from '@/data/taskLibrary';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { todayISO } from '@/lib/dates';
import { frequencyLabel } from '@/lib/tasks';
import { Sheet } from '@/components/ui/Sheet';
import { DemoNotice } from '@/components/ui/controls';

export function TaskLibrarySheet({
  onClose,
}: {
  onClose: () => void;
}) {
  const { state, addTask } = useAppStore();
  const { showToast } = useToast();
  const today = todayISO();

  const isAdded = (
    libraryId: string,
    roomId: string,
    title: string,
  ) =>
    state.tasks.some(
      (task) =>
        task.libraryId === libraryId ||
        (task.roomId === roomId && task.title === title),
    );

  const groups = [
    {
      id: 'kitchen',
      name: 'Kuchnia',
      tasks: TASK_LIBRARY.filter((item) => item.id.startsWith('k-')),
    },
    {
      id: 'bathroom',
      name: 'Łazienka',
      tasks: TASK_LIBRARY.filter((item) => item.id.startsWith('b-')),
    },
    {
      id: 'appliances',
      name: 'Sprzęty AGD',
      tasks: TASK_LIBRARY.filter((item) => item.id.startsWith('a-')),
    },
    {
      id: 'other',
      name: 'Pozostałe pomieszczenia',
      tasks: TASK_LIBRARY.filter((item) => item.id.startsWith('o-')),
    },
  ];

  return (
    <Sheet
      title="Biblioteka czynności"
      onClose={onClose}
    >
      <View style={styles.container}>
        <DemoNotice text="Częstotliwości i czasy są przykładowymi wartościami startowymi. Możesz je zmienić po dodaniu zadania." />

        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.groupTitle}>
              {group.name}
            </Text>

            <View style={styles.taskList}>
              {group.tasks.map((item) => {
                const added = isAdded(
                  item.id,
                  item.roomId,
                  item.title,
                );

                return (
                  <View
                    key={item.id}
                    style={styles.taskCard}
                  >
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>
                        {item.title}
                      </Text>

                      <Text style={styles.taskDetails}>
                        {frequencyLabel(
                          item.frequency,
                          item.customDays,
                          item.scheduleNote,
                        )}
                        {' · '}ok. {item.minutes} min
                        {' · '}
                        {findRoom(item.roomId)?.name}
                      </Text>
                    </View>

                    <Pressable
                      disabled={added}
                      onPress={() => {
                        addTask({
                          roomId: item.roomId,
                          title: item.title,
                          frequency: item.frequency,
                          customDays: item.customDays,
                          startDate: today,
                          minutes: item.minutes,
                          libraryId: item.id,
                          scheduleNote: item.scheduleNote,
                        });

                        showToast(`Dodano: ${item.title}`);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: added }}
                      style={({ pressed }) => [
                        styles.addButton,
                        added
                          ? styles.addButtonAdded
                          : styles.addButtonActive,
                        pressed && !added && styles.pressed,
                      ]}
                    >
                      {added ? (
                        <Check
                          size={14}
                          color="#3b742f"
                          strokeWidth={3}
                        />
                      ) : null}

                      <Text
                        style={[
                          styles.addButtonText,
                          added
                            ? styles.addButtonTextAdded
                            : styles.addButtonTextActive,
                        ]}
                      >
                        {added ? 'Dodane' : 'Dodaj'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    paddingBottom: 12,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: '#4e4d4d',
    fontSize: 14,
    fontWeight: '700',
  },
  taskList: {
    gap: 8,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  taskInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  taskTitle: {
    color: '#4e4d4d',
    fontSize: 14,
    fontWeight: '600',
  },
  taskDetails: {
    color: '#77766f',
    fontSize: 12,
    lineHeight: 17,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  addButtonActive: {
    backgroundColor: '#3b742f',
  },
  addButtonAdded: {
    backgroundColor: '#edf5e9',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addButtonTextActive: {
    color: '#ffffff',
  },
  addButtonTextAdded: {
    color: '#3b742f',
  },
  pressed: {
    opacity: 0.75,
  },
});