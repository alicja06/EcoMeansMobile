
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CleaningTask } from '@/types';
import { Check } from 'lucide-react-native';
import { findRoom } from '@/data/rooms';
import { dueLabel } from '@/lib/tasks';

interface TaskRowProps {
  task: CleaningTask;
  today: string;
  done: boolean;
  onToggle?: () => void;
  trailing?: ReactNode;
  whenLabel?: string;
}

export function TaskRow({
  task,
  today,
  done,
  onToggle,
  trailing,
  whenLabel,
}: TaskRowProps) {
  const room = findRoom(task.roomId);
  const when = whenLabel ?? dueLabel(task.dueDate, today);

  const details = [
    room?.name,
    task.minutes ? `ok. ${task.minutes} min` : null,
    when,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={[
        styles.container,
        !task.enabled && styles.disabled,
      ]}
    >
      <Pressable
        onPress={onToggle}
        disabled={!onToggle}
        accessibilityRole="button"
        accessibilityLabel={
          done
            ? `Cofnij: ${task.title}`
            : `Oznacz jako wykonane: ${task.title}`
        }
        accessibilityState={{
          disabled: !onToggle,
          checked: done,
        }}
        style={({ pressed }) => [
          styles.checkButton,
          done ? styles.checkButtonDone : styles.checkButtonOpen,
          pressed && styles.pressed,
        ]}
      >
        {done ? (
          <Check size={16} color="#ffffff" strokeWidth={3} />
        ) : null}
      </Pressable>

      <View style={styles.textContainer}>
        <Text
          numberOfLines={1}
          style={[
            styles.taskTitle,
            done && styles.taskTitleDone,
          ]}
        >
          {task.title}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.details}
        >
          {details}
        </Text>
      </View>

      {trailing ? (
        <View style={styles.trailing}>
          {trailing}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 15,
    shadowColor: '#4e4d4d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  disabled: {
    opacity: 0.6,
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonDone: {
    borderColor: '#3b742f',
    backgroundColor: '#3b742f',
  },
  checkButtonOpen: {
    borderColor: '#c5c5c5',
    backgroundColor: '#ffffff',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    color: '#4e4d4d',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Sen',
  },
  taskTitleDone: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  details: {
    marginTop: 4,
    color: '#88847e',
    fontSize: 12,
    fontFamily: 'Sen',
  },
  trailing: {
    flexShrink: 0,
  },
});
