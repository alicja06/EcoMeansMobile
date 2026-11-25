import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type {
  CleaningTask,
  CustomFrequencyRule,
  Frequency,
  RoomId,
} from '@/types';

import { ROOMS } from '@/data/rooms';
import { FREQUENCY_OPTIONS, frequencyLabel } from '@/lib/tasks';
import { useAppStore } from '@/store/AppStoreContext';
import { useToast } from '@/store/ToastContext';
import { todayISO } from '@/lib/dates';
import { Sheet } from '@/components/ui/Sheet';

const COLORS = {
  green: '#3b742f',
  greenLight: '#edf4e9',
  greenBorder: '#b8d4ad',
  text: '#4e4d4d',
  textDark: '#343b32',
  muted: '#777a72',
  border: '#e4e2dc',
  white: '#ffffff',
  background: '#f5e6ce',
  danger: '#b42318',
  dangerLight: '#fdf0ed',
};

const WEEKDAYS = [
  { value: 0, label: 'Nd', full: 'Niedziela' },
  { value: 1, label: 'Pn', full: 'Poniedziałek' },
  { value: 2, label: 'Wt', full: 'Wtorek' },
  { value: 3, label: 'Śr', full: 'Środa' },
  { value: 4, label: 'Cz', full: 'Czwartek' },
  { value: 5, label: 'Pt', full: 'Piątek' },
  { value: 6, label: 'Sb', full: 'Sobota' },
] as const;

const ORDINAL_OPTIONS = [
  { value: 1, label: 'Pierwszy' },
  { value: 2, label: 'Drugi' },
  { value: 3, label: 'Trzeci' },
  { value: 4, label: 'Czwarty' },
  { value: -1, label: 'Ostatni' },
] as const;

function getInitialCustomRule(task: CleaningTask): CustomFrequencyRule {
  if (task.customRule) {
    return task.customRule;
  }

  return {
    unit: 'days',
    interval: task.customDays ?? 7,
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChoiceButton({
  label,
  selected,
  onPress,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.choice,
        compact && styles.choiceCompact,
        selected ? styles.choiceSelected : styles.choiceInactive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.choiceText,
          compact && styles.choiceTextCompact,
          selected && styles.choiceTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function TaskSettingsSheet({
  task,
  onClose,
}: {
  task: CleaningTask;
  onClose: () => void;
}) {
  const { updateTask, skipTask, postponeTask, deleteTask } = useAppStore();
  const { showToast } = useToast();

  const [title, setTitle] = useState(task.title);
  const [roomId, setRoomId] = useState<RoomId>(task.roomId);
  const [minutes, setMinutes] = useState(String(task.minutes));
  const [frequency, setFrequency] = useState<Frequency>(task.frequency);
  const [customRuleDraft, setCustomRuleDraft] = useState<CustomFrequencyRule>(
    getInitialCustomRule(task),
  );
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [error, setError] = useState<string | null>(null);

  const updateCustomInterval = (value: number) => {
    setCustomRuleDraft((current) => ({
      ...current,
      interval: value,
    }));
  };

  const toggleCustomWeekday = (weekday: number) => {
    setCustomRuleDraft((current) => {
      if (current.unit !== 'weeks') return current;

      const selected = current.weekdays.includes(weekday);

      return {
        ...current,
        weekdays: selected
          ? current.weekdays.filter((day) => day !== weekday)
          : [...current.weekdays, weekday].sort((a, b) => a - b),
      };
    });
  };

  const changeCustomUnit = (unit: CustomFrequencyRule['unit']) => {
    setError(null);

    setCustomRuleDraft((current) => {
      if (current.unit === unit) return current;

      if (unit === 'days') {
        return {
          unit: 'days',
          interval: current.interval,
        };
      }

      if (unit === 'weeks') {
        return {
          unit: 'weeks',
          interval: current.interval,
          weekdays: [1],
        };
      }

      return {
        unit: 'months',
        interval: current.interval,
        monthlyPattern: {
          type: 'dayOfMonth',
          day: 1,
        },
      };
    });
  };

  const saveDetails = () => {
    const trimmed = title.trim();
    const parsedMinutes = Number(minutes);

    if (!trimmed) {
      setError('Podaj nazwę czynności.');
      return false;
    }

    if (
      !Number.isInteger(parsedMinutes) ||
      parsedMinutes < 1 ||
      parsedMinutes > 240
    ) {
      setError('Czas podaj w minutach, od 1 do 240.');
      return false;
    }

    let nextCustomDays: number | null = null;
    let nextCustomRule: CustomFrequencyRule | null = null;

    if (frequency === 'custom') {
      const interval = customRuleDraft.interval;

      if (!Number.isInteger(interval) || interval < 1) {
        setError('Podaj prawidłowy odstęp między powtórzeniami.');
        return false;
      }

      if (customRuleDraft.unit === 'days') {
        if (interval > 365) {
          setError('Odstęp w dniach może wynosić od 1 do 365.');
          return false;
        }

        nextCustomDays = interval;
        nextCustomRule = customRuleDraft;
      }

      if (customRuleDraft.unit === 'weeks') {
        if (interval > 52) {
          setError('Odstęp w tygodniach może wynosić od 1 do 52.');
          return false;
        }

        if (customRuleDraft.weekdays.length === 0) {
          setError('Wybierz przynajmniej jeden dzień tygodnia.');
          return false;
        }

        nextCustomRule = customRuleDraft;
      }

      if (customRuleDraft.unit === 'months') {
        if (interval > 24) {
          setError('Odstęp w miesiącach może wynosić od 1 do 24.');
          return false;
        }

        const pattern = customRuleDraft.monthlyPattern;

        if (
          pattern.type === 'dayOfMonth' &&
          (!Number.isInteger(pattern.day) ||
            pattern.day < 1 ||
            pattern.day > 31)
        ) {
          setError('Dzień miesiąca musi być liczbą od 1 do 31.');
          return false;
        }

        nextCustomRule = customRuleDraft;
      }
    }

    const previousRule = task.customRule ?? null;

    const ruleChanged =
      JSON.stringify(previousRule) !== JSON.stringify(nextCustomRule);

    const frequencyChanged =
      frequency !== task.frequency ||
      nextCustomDays !== task.customDays ||
      ruleChanged;

    updateTask(task.id, {
      title: trimmed,
      roomId,
      minutes: parsedMinutes,
      frequency,
      customDays: nextCustomDays,
      customRule: nextCustomRule,
      scheduleNote: frequencyChanged ? null : task.scheduleNote,
      ...(dueDate && dueDate !== task.dueDate ? { dueDate } : {}),
    });

    return true;
  };

  const handleSave = () => {
    if (!saveDetails()) return;

    showToast('Zapisano ustawienia');
    onClose();
  };

  const handlePostpone = () => {
    postponeTask(task.id);
    showToast('Przeniesione na jutro');
    onClose();
  };

  const handleSkip = () => {
    skipTask(task.id);
    showToast('Pominięte tym razem');
    onClose();
  };

  const handleToggleEnabled = () => {
    updateTask(task.id, { enabled: !task.enabled });
    showToast(task.enabled ? 'Czynność wyłączona' : 'Czynność włączona');
    onClose();
  };

  const handleDelete = () => {
    deleteTask(task.id);
    showToast('Usunięto czynność');
    onClose();
  };

  return (
    <Sheet
      title="Ustawienia czynności"
      onClose={onClose}
      footer={
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveButtonText}>Zapisz zmiany</Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        <Text style={styles.description}>
          Możesz przesunąć termin, odłożyć czynność, pominąć ją tym razem albo
          zmienić częstotliwość. Brak wykonania niczego nie psuje.
        </Text>

        <Text style={styles.currentFrequency}>
          Teraz:{' '}
          {frequencyLabel(
            task.frequency,
            task.customDays,
            task.scheduleNote,
            task.customRule,
          )}
        </Text>

        <Field label="Nazwa">
          <TextInput
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            style={styles.input}
            placeholder="Nazwa czynności"
            placeholderTextColor={COLORS.muted}
          />
        </Field>

        <Field label="Pomieszczenie">
          <View style={styles.choiceWrap}>
            {ROOMS.map((room) => (
              <ChoiceButton
                key={room.id}
                label={room.name}
                selected={roomId === room.id}
                onPress={() => setRoomId(room.id)}
                compact
              />
            ))}
          </View>
        </Field>

        <Field label="Szacowany czas (minuty)">
          <TextInput
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
            maxLength={3}
            style={styles.input}
            placeholder="Liczba minut"
            placeholderTextColor={COLORS.muted}
          />
        </Field>

        <Field label="Termin (RRRR-MM-DD)">
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={styles.input}
            placeholder="2026-12-31"
            placeholderTextColor={COLORS.muted}
          />
          <Text style={styles.helperText}>
            Wpisz datę w formacie rok-miesiąc-dzień. Najwcześniejszy termin:{' '}
            {todayISO()}.
          </Text>
        </Field>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Częstotliwość</Text>

          <View style={styles.frequencyGrid}>
            {FREQUENCY_OPTIONS.map((option) => (
              <View key={option.value} style={styles.frequencyItem}>
                <ChoiceButton
                  label={option.label}
                  selected={option.value === frequency}
                  onPress={() => {
                    setFrequency(option.value);
                    setError(null);
                  }}
                />
              </View>
            ))}
          </View>

          {frequency === 'custom' && (
            <View style={styles.customBox}>
              <View>
                <Text style={styles.customTitle}>
                  Ustaw własną częstotliwość
                </Text>
                <Text style={styles.helperText}>
                  Wybierz odstęp i określ, kiedy czynność ma się powtarzać.
                </Text>
              </View>

              <View style={styles.unitRow}>
                <View style={styles.unitItem}>
                  <ChoiceButton
                    label="Dni"
                    selected={customRuleDraft.unit === 'days'}
                    onPress={() => changeCustomUnit('days')}
                    compact
                  />
                </View>
                <View style={styles.unitItem}>
                  <ChoiceButton
                    label="Tygodnie"
                    selected={customRuleDraft.unit === 'weeks'}
                    onPress={() => changeCustomUnit('weeks')}
                    compact
                  />
                </View>
                <View style={styles.unitItem}>
                  <ChoiceButton
                    label="Miesiące"
                    selected={customRuleDraft.unit === 'months'}
                    onPress={() => changeCustomUnit('months')}
                    compact
                  />
                </View>
              </View>

              <Field label="Powtarzaj co">
                <View style={styles.intervalRow}>
                  <TextInput
                    value={String(customRuleDraft.interval)}
                    onChangeText={(value) =>
                      updateCustomInterval(value === '' ? 0 : Number(value))
                    }
                    keyboardType="number-pad"
                    style={[styles.input, styles.intervalInput]}
                  />
                  <Text style={styles.intervalUnit}>
                    {customRuleDraft.unit === 'days'
                      ? 'dni'
                      : customRuleDraft.unit === 'weeks'
                        ? 'tygodni'
                        : 'miesięcy'}
                  </Text>
                </View>
              </Field>

              {customRuleDraft.unit === 'weeks' && (
                <View style={styles.section}>
                  <Text style={styles.fieldLabel}>
                    W które dni tygodnia?
                  </Text>

                  <View style={styles.weekdayRow}>
                    {WEEKDAYS.map((day) => {
                      const active = customRuleDraft.weekdays.includes(
                        day.value,
                      );

                      return (
                        <View key={day.value} style={styles.weekdayItem}>
                          <ChoiceButton
                            label={day.label}
                            selected={active}
                            onPress={() => toggleCustomWeekday(day.value)}
                            compact
                          />
                        </View>
                      );
                    })}
                  </View>

                  <Text style={styles.helperText}>
                    Możesz zaznaczyć kilka dni.
                  </Text>
                </View>
              )}

              {customRuleDraft.unit === 'months' && (
                <View style={styles.section}>
                  <Text style={styles.fieldLabel}>Kiedy w miesiącu?</Text>

                  <View style={styles.patternRow}>
                    <View style={styles.patternItem}>
                      <ChoiceButton
                        label="Dzień miesiąca"
                        selected={
                          customRuleDraft.monthlyPattern.type === 'dayOfMonth'
                        }
                        onPress={() =>
                          setCustomRuleDraft((current) => ({
                            unit: 'months',
                            interval: current.interval,
                            monthlyPattern: {
                              type: 'dayOfMonth',
                              day:
                                current.unit === 'months' &&
                                current.monthlyPattern.type === 'dayOfMonth'
                                  ? current.monthlyPattern.day
                                  : 1,
                            },
                          }))
                        }
                        compact
                      />
                    </View>

                    <View style={styles.patternItem}>
                      <ChoiceButton
                        label="Dzień tygodnia"
                        selected={
                          customRuleDraft.monthlyPattern.type ===
                          'weekdayOrdinal'
                        }
                        onPress={() =>
                          setCustomRuleDraft((current) => ({
                            unit: 'months',
                            interval: current.interval,
                            monthlyPattern: {
                              type: 'weekdayOrdinal',
                              ordinal: 1,
                              weekday: 1,
                            },
                          }))
                        }
                        compact
                      />
                    </View>
                  </View>

                  {customRuleDraft.monthlyPattern.type === 'dayOfMonth' ? (
                    <View style={styles.inlineField}>
                      <Text style={styles.inlineLabel}>Dnia</Text>
                      <TextInput
                        value={String(customRuleDraft.monthlyPattern.day)}
                        onChangeText={(value) => {
                          const day = value === '' ? 0 : Number(value);

                          setCustomRuleDraft((current) => {
                            if (
                              current.unit !== 'months' ||
                              current.monthlyPattern.type !== 'dayOfMonth'
                            ) {
                              return current;
                            }

                            return {
                              ...current,
                              monthlyPattern: {
                                type: 'dayOfMonth',
                                day,
                              },
                            };
                          });
                        }}
                        keyboardType="number-pad"
                        style={[styles.input, styles.dayInput]}
                      />
                      <Text style={styles.inlineLabel}>
                        każdego miesiąca
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.selectFields}>
                      <Field label="Który tydzień?">
                        <View style={styles.choiceWrap}>
                          {ORDINAL_OPTIONS.map((option) => (
                            <ChoiceButton
                              key={option.value}
                              label={option.label}
                              selected={
                                customRuleDraft.monthlyPattern.type ===
                                  'weekdayOrdinal' &&
                                customRuleDraft.monthlyPattern.ordinal ===
                                  option.value
                              }
                              onPress={() => {
                                setCustomRuleDraft((current) => {
                                  if (
                                    current.unit !== 'months' ||
                                    current.monthlyPattern.type !==
                                      'weekdayOrdinal'
                                  ) {
                                    return current;
                                  }

                                  return {
                                    ...current,
                                    monthlyPattern: {
                                      ...current.monthlyPattern,
                                      ordinal: option.value,
                                    },
                                  };
                                });
                              }}
                              compact
                            />
                          ))}
                        </View>
                      </Field>

                      <Field label="Dzień tygodnia">
                        <View style={styles.choiceWrap}>
                          {WEEKDAYS.map((day) => (
                            <ChoiceButton
                              key={day.value}
                              label={day.full}
                              selected={
                                customRuleDraft.monthlyPattern.type ===
                                  'weekdayOrdinal' &&
                                customRuleDraft.monthlyPattern.weekday ===
                                  day.value
                              }
                              onPress={() => {
                                setCustomRuleDraft((current) => {
                                  if (
                                    current.unit !== 'months' ||
                                    current.monthlyPattern.type !==
                                      'weekdayOrdinal'
                                  ) {
                                    return current;
                                  }

                                  return {
                                    ...current,
                                    monthlyPattern: {
                                      ...current.monthlyPattern,
                                      weekday: day.value,
                                    },
                                  };
                                });
                              }}
                              compact
                            />
                          ))}
                        </View>
                      </Field>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Zrób później, jutro"
            onPress={handlePostpone}
          />
          <ActionButton
            label="Pomiń tym razem"
            onPress={handleSkip}
          />
          <ActionButton
            label={task.enabled ? 'Wyłącz na razie' : 'Włącz z powrotem'}
            onPress={handleToggleEnabled}
          />
          <ActionButton
            label="Usuń czynność"
            onPress={handleDelete}
            danger
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

function ActionButton({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        danger && styles.dangerButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, danger && styles.dangerText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingBottom: 8,
  },
  description: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
  },
  currentFrequency: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 11,
    color: COLORS.textDark,
    fontSize: 15,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceCompact: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  choiceSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenLight,
  },
  choiceInactive: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  choiceText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  choiceTextCompact: {
    fontSize: 12,
  },
  choiceTextSelected: {
    color: COLORS.green,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
  section: {
    gap: 12,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyItem: {
    width: '48%',
    flexGrow: 1,
  },
  customBox: {
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    borderRadius: 18,
    backgroundColor: '#f7faf4',
    padding: 14,
  },
  customTitle: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '700',
  },
  unitRow: {
    flexDirection: 'row',
    gap: 7,
  },
  unitItem: {
    flex: 1,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  intervalInput: {
    width: 90,
    textAlign: 'center',
  },
  intervalUnit: {
    color: COLORS.text,
    fontSize: 14,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 5,
  },
  weekdayItem: {
    flex: 1,
  },
  patternRow: {
    flexDirection: 'row',
    gap: 8,
  },
  patternItem: {
    flex: 1,
  },
  inlineField: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  inlineLabel: {
    color: COLORS.text,
    fontSize: 13,
  },
  dayInput: {
    width: 72,
    textAlign: 'center',
  },
  selectFields: {
    gap: 16,
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#efeee9',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  actionText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: COLORS.dangerLight,
  },
  dangerText: {
    color: COLORS.danger,
  },
  errorBox: {
    borderRadius: 14,
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  saveButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.green,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
