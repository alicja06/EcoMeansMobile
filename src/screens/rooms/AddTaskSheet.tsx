
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import type { Frequency, RoomId } from '@/types';
import { TASK_SUGGESTIONS } from '@/data/initialState';
import { FREQUENCY_OPTIONS } from '@/lib/tasks';
import { todayISO } from '@/lib/dates';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/AppText';

interface AddTaskSheetProps {
  roomId: RoomId;
  onClose: () => void;
}

export function AddTaskSheet({ roomId, onClose }: AddTaskSheetProps) {
  const { state, addTask } = useAppStore();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [customInput, setCustomInput] = useState('7');
  const [minutes, setMinutes] = useState('15');
  const [error, setError] = useState<string | null>(null);

  const roomTitles = state.tasks
    .filter((task) => task.roomId === roomId)
    .map((task) => task.title.toLowerCase());

  const suggestions = TASK_SUGGESTIONS.filter(
    (suggestion) => !roomTitles.includes(suggestion.toLowerCase()),
  );

  const trimmed = title.trim();

  const handleSubmit = () => {
    if (!trimmed) {
      setError('Podaj nazwę zadania.');
      return;
    }

    if (roomTitles.includes(trimmed.toLowerCase())) {
      setError('Takie zadanie już jest w tym pomieszczeniu.');
      return;
    }

    let customDays: number | null = null;

    if (frequency === 'custom') {
      const days = Number(customInput);

      if (!Number.isInteger(days) || days < 1 || days > 365) {
        setError('Podaj liczbę dni od 1 do 365.');
        return;
      }

      customDays = days;
    }

    const parsedMinutes = Number(minutes);

    if (
      !Number.isInteger(parsedMinutes) ||
      parsedMinutes < 1 ||
      parsedMinutes > 240
    ) {
      setError('Czas podaj w minutach, od 1 do 240.');
      return;
    }

    addTask({
      roomId,
      title: trimmed,
      frequency,
      customDays,
      startDate: todayISO(),
      minutes: parsedMinutes,
    });

    showToast(`Dodano: ${trimmed}`);
    onClose();
  };

  const updateTitle = (value: string) => {
    setTitle(value);
    setError(null);
  };

  const updateMinutes = (value: string) => {
    setMinutes(value);
    setError(null);
  };

  return (
    <Sheet
      title="Nowe zadanie"
      onClose={onClose}
      footer={
        <Pressable
          onPress={handleSubmit}
          disabled={!trimmed}
          accessibilityRole="button"
          accessibilityLabel="Dodaj zadanie"
          style={({ pressed }) => [
            styles.submitButton,
            !trimmed && styles.submitButtonDisabled,
            pressed && trimmed && styles.pressed,
          ]}
        >
          <AppText style={styles.submitButtonText}>
            Dodaj zadanie
          </AppText>
        </Pressable>
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.field}>
          <AppText style={styles.label}>
            Nazwa zadania
          </AppText>

          <TextInput
            value={title}
            onChangeText={updateTitle}
            maxLength={80}
            placeholder="Np. Wyczyścić filtr okapu"
            placeholderTextColor="#99968F"
            style={styles.input}
            accessibilityLabel="Nazwa zadania"
          />
        </View>

        {suggestions.length > 0 && (
          <View style={styles.field}>
            <AppText style={styles.label}>
              Podpowiedzi
            </AppText>

            <View style={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => updateTitle(suggestion)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.suggestionText}>
                    {suggestion}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.field}>
          <AppText style={styles.label}>
            Szacowany czas (minuty)
          </AppText>

          <TextInput
            value={minutes}
            onChangeText={updateMinutes}
            keyboardType="number-pad"
            maxLength={3}
            placeholder="15"
            placeholderTextColor="#99968F"
            style={styles.input}
            accessibilityLabel="Szacowany czas w minutach"
          />
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>
            Jak często?
          </AppText>

          <View style={styles.frequencyOptions}>
            {FREQUENCY_OPTIONS.map((option) => {
              const active = option.value === frequency;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setFrequency(option.value);
                    setError(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.frequencyOption,
                    active
                      ? styles.frequencyOptionActive
                      : styles.frequencyOptionInactive,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText

                    style={[
                      styles.frequencyText,
                      active && styles.frequencyTextActive,
                    ]}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {frequency === 'custom' && (
            <View style={styles.customFrequency}>
              <AppText style={styles.customLabel}>
                Co
              </AppText>

              <TextInput
                value={customInput}
                onChangeText={(value) => {
                  setCustomInput(value);
                  setError(null);
                }}
                keyboardType="number-pad"
                maxLength={3}
                style={styles.customInput}
                accessibilityLabel="Liczba dni między zadaniami"
              />

              <AppText style={styles.customLabel}>
                dni
              </AppText>
            </View>
          )}
        </View>

        {error && (
          <View
            style={styles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <AppText style={styles.errorText}>
              {error}
            </AppText>
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
    paddingBottom: 12,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#4e4d4d',
    fontSize: 14,
  },
  input: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#dedbd4',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#4e4d4d',
    fontFamily: 'Sen',
    fontSize: 14,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestion: {
    borderRadius: 24,
    backgroundColor: '#f0f0f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionText: {
    color: '#4e4d4d',
    fontSize: 12,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    width: '48%',
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  frequencyOptionActive: {
    borderColor: '#3b742f',
    backgroundColor: '#f0f6ed',
  },
  frequencyOptionInactive: {
    borderColor: '#dedbd4',
    backgroundColor: '#ffffff',
  },
  frequencyText: {
    color: '#4e4d4d',
    fontSize: 13,
  },
  frequencyTextActive: {
    color: '#3b742f',
  },
  customFrequency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  customLabel: {
    color: '#4e4d4d',
    fontSize: 14,
  },
  customInput: {
    width: 96,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#dedbd4',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    textAlign: 'center',
    color: '#4e4d4d',
    fontFamily: 'Sen',
    fontSize: 14,
  },
  error: {
    borderRadius: 16,
    backgroundColor: '#fcebea',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: '#a8322b',
    fontSize: 13,
  },
  submitButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#3b742f',
    paddingVertical: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#c9c9c9',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
  },
});
