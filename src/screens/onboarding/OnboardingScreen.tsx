
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  ApplianceId,
  CleaningTask,
  CustomAppliance,
  CustomFrequencyRule,
  CustomRoom,
  DayPart,
  HomeProfile,
  HouseholdSize,
  RoomId,
  TimeBudget,
} from '@/types';

import {
  APPLIANCE_OPTIONS,
  DAY_PART_OPTIONS,
  HOUSEHOLD_OPTIONS,
  TIME_BUDGET_OPTIONS,
} from '@/data/home';
import { ROOMS } from '@/data/rooms';
import { useAppStore } from '@/store/AppStoreContext';
import { todayISO, formatShortDate } from '@/lib/dates';
import { createId } from '@/lib/ids';
import {
  buildSuggestedTasks,
  generateEditedPlan,
  getTaskPreviewGroup,
} from '@/lib/schedule';
import { useNavigation } from '@/store/NavigationContext';
import { useHousehold } from '@/auth/HouseholdContext';

const STAGES = [1, 1, 2, 3, 4];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Codziennie' },
  { value: '2days', label: 'Co 2 dni' },
  { value: '3days', label: 'Co 3 dni' },
  { value: 'weekly', label: 'Co tydzień' },
  { value: 'biweekly', label: 'Co 2 tygodnie' },
  { value: 'monthly', label: 'Co miesiąc' },
  { value: 'quarterly', label: 'Co 3 miesiące' },
  { value: 'custom', label: 'Niestandardowa' },
];

const WEEKDAYS = [
  { id: 1, label: 'Pn' },
  { id: 2, label: 'Wt' },
  { id: 3, label: 'Śr' },
  { id: 4, label: 'Cz' },
  { id: 5, label: 'Pt' },
  { id: 6, label: 'Sb' },
  { id: 0, label: 'Nd' },
];

const FULL_WEEKDAYS = [
  'niedziela',
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota',
];

function getFrequencyValue(task: CleaningTask): string {
  if (task.frequency === 'custom') {
    if (task.customRule) return 'custom-current';
    if (task.customDays === 2) return '2days';
    if (task.customDays === 3) return '3days';
  }

  return task.frequency;
}

function getPlural(
  value: number,
  singular: string,
  plural: string,
  genitive: string,
) {
  if (value === 1) return singular;

  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;

  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    !(lastTwoDigits >= 12 && lastTwoDigits <= 14)
  ) {
    return plural;
  }

  return genitive;
}

function getCustomFrequencyLabel(rule: CustomFrequencyRule): string {
  if (rule.unit === 'days') {
    return `Co ${rule.interval} ${getPlural(
      rule.interval,
      'dzień',
      'dni',
      'dni',
    )}`;
  }

  if (rule.unit === 'weeks') {
    const selectedDays = [1, 2, 3, 4, 5, 6, 0]
      .filter((day) => rule.weekdays.includes(day))
      .map((day) => FULL_WEEKDAYS[day]);

    return `Co ${rule.interval} ${getPlural(
      rule.interval,
      'tydzień',
      'tygodnie',
      'tygodni',
    )}: ${selectedDays.join(', ')}`;
  }

  const monthInterval = `Co ${rule.interval} ${getPlural(
    rule.interval,
    'miesiąc',
    'miesiące',
    'miesięcy',
  )}`;

  if (rule.monthlyPattern.type === 'dayOfMonth') {
    return `${monthInterval} – ${rule.monthlyPattern.day}. dzień miesiąca`;
  }

  const ordinals: Record<number, string> = {
    1: 'pierwszy',
    2: 'drugi',
    3: 'trzeci',
    4: 'czwarty',
    [-1]: 'ostatni',
  };

  return `${monthInterval} – ${ordinals[rule.monthlyPattern.ordinal]} ${FULL_WEEKDAYS[rule.monthlyPattern.weekday]}`;
}

function ChoiceButton({
  selected,
  label,
  detail,
  onPress,
}: {
  selected: boolean;
  label: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      {detail ? <Text style={styles.choiceDetail}>{detail}</Text> : null}
      {selected ? <Text style={styles.choiceCheck}>✓</Text> : null}
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.secondaryButton,
        compact && styles.compactButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          secondary && styles.secondaryButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

export function OnboardingScreen() {
  const { state, acceptPlan } = useAppStore();
  const { isEditingPlan, finishPlanEditing } = useNavigation();
  const { refreshHousehold } = useHousehold();

  const [step, setStep] = useState(0);

  const [draft, setDraft] = useState<HomeProfile>(() => {
    const home = state.home;
    const places = home.places.filter(
      (id) => id !== 'toilet' && id !== 'other',
    );

    if (home.places.includes('toilet') && !places.includes('bathroom')) {
      places.push('bathroom');
    }

    return {
      ...home,
      places,
      customRooms: home.customRooms ?? [],
      customAppliances: home.customAppliances ?? [],
    };
  });

  const [excluded, setExcluded] = useState<string[]>(
    isEditingPlan ? state.excludedLibraryTaskIds ?? [] : [],
  );

  const [suggestedTasks, setSuggestedTasks] = useState<CleaningTask[]>(
    isEditingPlan
      ? state.tasks.filter((task) => task.libraryId !== null)
      : [],
  );

  const [customTasks, setCustomTasks] = useState<CleaningTask[]>(
    isEditingPlan
      ? state.tasks.filter(
          (task) => task.libraryId === null && task.source === 'plan',
        )
      : [],
  );

  const [removedTasks, setRemovedTasks] = useState<CleaningTask[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<CleaningTask[]>([]);
  const [generationMessage, setGenerationMessage] = useState(0);

  const [customFrequencyTask, setCustomFrequencyTask] =
    useState<CleaningTask | null>(null);

  const [customRuleDraft, setCustomRuleDraft] =
    useState<CustomFrequencyRule>({
      unit: 'days',
      interval: 1,
    });

  const [customTitle, setCustomTitle] = useState('');
  const [addingToRoom, setAddingToRoom] = useState<RoomId | null>(null);
  const [customRoomName, setCustomRoomName] = useState('');
  const [customApplianceName, setCustomApplianceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const today = todayISO();

  useEffect(() => {
    if (step !== 6) return;

    const first = setTimeout(() => setGenerationMessage(1), 900);
    const second = setTimeout(() => setGenerationMessage(2), 1800);
    const finish = setTimeout(() => setStep(7), 2800);

    return () => {
      clearTimeout(first);
      clearTimeout(second);
      clearTimeout(finish);
    };
  }, [step]);

  const previewTasks = useMemo(
    () => [...suggestedTasks, ...customTasks],
    [suggestedTasks, customTasks],
  );

  const selectableRooms = useMemo(
    () => [
      ...ROOMS.filter(
        (room) => room.id !== 'toilet' && room.id !== 'other',
      ),
      ...(draft.customRooms ?? []),
    ],
    [draft.customRooms],
  );

  const getRoomName = (roomId: RoomId): string => {
    if (roomId === 'toilet') return 'Łazienka';

    return (
      selectableRooms.find((room) => room.id === roomId)?.name ?? 'Dom'
    );
  };

  const customApplianceTaskIds = new Set(
    (draft.customAppliances ?? []).map(
      (appliance) => `custom-appliance-${appliance.id}`,
    ),
  );

  const selectedRoomIds = new Set(draft.places);

  const roomGroups = selectableRooms
    .filter((room) => selectedRoomIds.has(room.id))
    .map((room) => ({
      id: room.id,
      name: room.name,
      tasks: previewTasks.filter((task) => {
        const taskRoomId =
          task.roomId === 'toilet' ? 'bathroom' : task.roomId;

        return (
          taskRoomId === room.id &&
          !customApplianceTaskIds.has(task.id)
        );
      }),
    }));

  const applianceTasks = previewTasks.filter((task) =>
    customApplianceTaskIds.has(task.id),
  );

  const remainingTasks = previewTasks.filter((task) => {
    if (customApplianceTaskIds.has(task.id)) return false;

    const taskRoomId =
      task.roomId === 'toilet' ? 'bathroom' : task.roomId;

    return !selectedRoomIds.has(taskRoomId);
  });

  const patch = (partial: Partial<HomeProfile>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const toggleList = <T extends string>(
    key: 'places' | 'appliances' | 'dayParts',
    id: T,
  ) => {
    setDraft((current) => {
      const list = current[key] as T[];
      const next = list.includes(id)
        ? list.filter((item) => item !== id)
        : [...list, id];

      return { ...current, [key]: next };
    });
  };

  const togglePlace = (id: RoomId) => toggleList('places', id);
  const toggleAppliance = (id: ApplianceId) =>
    toggleList('appliances', id);
  const toggleDayPart = (id: DayPart) => toggleList('dayParts', id);

  const addCustomRoom = () => {
    const name = customRoomName.trim();

    if (!name) return;

    const exists = selectableRooms.some(
      (room) => room.name.toLowerCase() === name.toLowerCase(),
    );

    if (exists) return;

    const room: CustomRoom = {
      id: `custom:${createId()}`,
      name,
    };

    setDraft((current) => ({
      ...current,
      customRooms: [...(current.customRooms ?? []), room],
      places: [...current.places, room.id],
    }));

    setCustomRoomName('');
  };

  const addCustomAppliance = () => {
    const name = customApplianceName.trim();

    if (!name) return;

    const exists = (draft.customAppliances ?? []).some(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (exists) return;

    const appliance: CustomAppliance = {
      id: createId(),
      name,
    };

    setDraft((current) => ({
      ...current,
      customAppliances: [
        ...(current.customAppliances ?? []),
        appliance,
      ],
    }));

    setCustomApplianceName('');
  };

  const removeCustomAppliance = (applianceId: string) => {
    setDraft((current) => ({
      ...current,
      customAppliances: (current.customAppliances ?? []).filter(
        (item) => item.id !== applianceId,
      ),
    }));

    const taskId = `custom-appliance-${applianceId}`;

    setCustomTasks((current) =>
      current.filter((task) => task.id !== taskId),
    );

    setRemovedTasks((current) =>
      current.filter((task) => task.id !== taskId),
    );
  };

  const canContinue =
    (step === 0 && draft.household !== null) ||
    (step === 1 && draft.smallChildren !== null) ||
    (step === 2 && draft.places.length > 0) ||
    (step === 3 && draft.timeBudget !== null) ||
    (step === 4 && draft.dayParts.length > 0) ||
    step === 5;

  const addCustom = (roomId: RoomId) => {
    const title = customTitle.trim();

    if (!title) return;

    setCustomTasks((current) => [
      ...current,
      {
        id: createId(),
        roomId,
        title,
        frequency: 'weekly',
        customDays: null,
        dueDate: today,
        lastDoneDate: null,
        previousDueDate: null,
        minutes: 15,
        enabled: true,
        libraryId: null,
        scheduleNote: null,
        source: 'plan',
      },
    ]);

    setCustomTitle('');
    setAddingToRoom(null);
  };

  const updateTask = (
    taskId: string,
    changes: Partial<CleaningTask>,
  ) => {
    setSuggestedTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, ...changes } : task,
      ),
    );

    setCustomTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, ...changes } : task,
      ),
    );
  };

  const openCustomFrequency = (task: CleaningTask) => {
    setCustomFrequencyTask(task);

    setCustomRuleDraft(
      task.customRule ?? {
        unit: 'days',
        interval: 1,
      },
    );
  };

  const changeFrequency = (task: CleaningTask, value: string) => {
    if (value === 'custom') {
      openCustomFrequency(task);
      return;
    }

    if (value === '2days' || value === '3days') {
      updateTask(task.id, {
        frequency: 'custom',
        customDays: Number(value.replace('days', '')),
        customRule: null,
      });
      return;
    }

    updateTask(task.id, {
      frequency: value as CleaningTask['frequency'],
      customDays: null,
      customRule: null,
    });
  };

  const removeTask = (task: CleaningTask) => {
    setRemovedTasks((current) => [
      ...current.filter((item) => item.id !== task.id),
      task,
    ]);

    if (task.libraryId) {
      setExcluded((current) =>
        current.includes(task.libraryId!)
          ? current
          : [...current, task.libraryId!],
      );
    }

    setSuggestedTasks((current) =>
      current.filter((item) => item.id !== task.id),
    );

    setCustomTasks((current) =>
      current.filter((item) => item.id !== task.id),
    );
  };

  const toggleCustomWeekday = (day: number) => {
    setCustomRuleDraft((current) => {
      if (current.unit !== 'weeks') return current;

      const weekdays = current.weekdays.includes(day)
        ? current.weekdays.filter((item) => item !== day)
        : [...current.weekdays, day].sort((a, b) => a - b);

      return { ...current, weekdays };
    });
  };

  const saveCustomFrequency = () => {
    if (!customFrequencyTask) return;

    const interval = Math.max(
      1,
      Math.min(365, Math.floor(Number(customRuleDraft.interval) || 1)),
    );

    updateTask(customFrequencyTask.id, {
      frequency: 'custom',
      customDays: null,
      customRule: {
        ...customRuleDraft,
        interval,
      },
    });

    setCustomFrequencyTask(null);
  };

  const handleGeneratePlan = () => {
    const generated = generateEditedPlan(previewTasks, draft, today);

    setPlannedTasks(generated);
    setGenerationMessage(0);
    setStep(6);
  };

  const handleAcceptPlan = async () => {
    if (saving) return;

    setSaving(true);
    setSaveError('');

    try {
      const saved = await acceptPlan(plannedTasks, draft, excluded);

      if (!saved) {
        setSaving(false);
        return;
      }

      await refreshHousehold();
      finishPlanEditing();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Nie udało się zapisać planu. Spróbuj ponownie.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 4) {
      const allExcluded = Array.from(
        new Set([
          ...(state.excludedLibraryTaskIds ?? []),
          ...excluded,
        ]),
      );

      const freshSuggestions = buildSuggestedTasks(
        draft,
        today,
        allExcluded,
      );

      setSuggestedTasks((current) => {
        const currentByLibraryId = new Map(
          current
            .filter((task) => task.libraryId)
            .map((task) => [task.libraryId!, task]),
        );

        return freshSuggestions.map((suggestion) => {
          const existing = currentByLibraryId.get(
            suggestion.libraryId!,
          );

          if (!existing) return suggestion;

          return {
            ...suggestion,
            ...existing,
            roomId: suggestion.roomId,
          };
        });
      });

      const applianceRoom =
        draft.places.find((id) => id === 'utility') ??
        draft.places[0] ??
        'other';

      const activeApplianceTasks = (
        draft.customAppliances ?? []
      ).map(
        (appliance): CleaningTask => ({
          id: `custom-appliance-${appliance.id}`,
          roomId: applianceRoom,
          title: `Czyszczenie: ${appliance.name}`,
          frequency: 'quarterly',
          customDays: null,
          dueDate: today,
          lastDoneDate: null,
          previousDueDate: null,
          minutes: 15,
          enabled: true,
          libraryId: null,
          scheduleNote:
            'Przykładowa częstotliwość. Dostosuj ją do instrukcji producenta urządzenia.',
          source: 'plan',
        }),
      );

      const activeIds = new Set(
        activeApplianceTasks.map((task) => task.id),
      );

      const removedIds = new Set(
        removedTasks.map((task) => task.id),
      );

      setCustomTasks((current) => {
        const existingIds = new Set(
          current.map((task) => task.id),
        );

        const retained = current
          .filter(
            (task) =>
              !task.id.startsWith('custom-appliance-') ||
              activeIds.has(task.id),
          )
          .map((task) =>
            task.id.startsWith('custom-appliance-')
              ? { ...task, roomId: applianceRoom }
              : task,
          );

        const missing = activeApplianceTasks.filter(
          (task) =>
            !existingIds.has(task.id) &&
            !removedIds.has(task.id),
        );

        return [...retained, ...missing];
      });
    }

    setStep((current) => current + 1);
  };

  const renderTaskCard = (task: CleaningTask) => (
    <View key={task.id} style={styles.taskCard}>
      <View style={styles.taskTitleRow}>
        <TextInput
          value={task.title}
          onChangeText={(value) =>
            updateTask(task.id, { title: value })
          }
          accessibilityLabel="Nazwa czynności"
          style={styles.taskTitleInput}
          placeholder="Nazwa czynności"
        />

        <Pressable
          onPress={() => removeTask(task)}
          style={styles.removeButton}
        >
          <Text style={styles.removeButtonText}>Usuń</Text>
        </Pressable>
      </View>

      <FieldLabel>Jak często?</FieldLabel>

      <View style={styles.frequencyList}>
        {FREQUENCY_OPTIONS.map((option) => {
          const selected =
            getFrequencyValue(task) === option.value ||
            (option.value === 'custom' &&
              task.frequency === 'custom' &&
              task.customRule !== null &&
              task.customRule !== undefined);

          return (
            <Pressable
              key={option.value}
              onPress={() => changeFrequency(task, option.value)}
              style={[
                styles.frequencyOption,
                selected && styles.frequencyOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.frequencyText,
                  selected && styles.frequencyTextSelected,
                ]}
              >
                {option.value === 'custom' &&
                task.frequency === 'custom' &&
                task.customRule
                  ? getCustomFrequencyLabel(task.customRule)
                  : option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {task.frequency === 'custom' && task.customRule ? (
        <ActionButton
          label="Edytuj częstotliwość"
          onPress={() => openCustomFrequency(task)}
          secondary
          compact
        />
      ) : null}
    </View>
  );

  const renderSectionTitle = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderHeading = (title: string, description: string) => (
    <View style={styles.headingBlock}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <View>
          {renderHeading(
            'Kto mieszka w domu?',
            'Od tego zależy, jak gęsto ułożę codzienne czynności. To punkt startowy, nie ocena.',
          )}

          <View style={styles.options}>
            {HOUSEHOLD_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.id}
                selected={draft.household === option.id}
                label={option.label}
                onPress={() =>
                  patch({
                    household: option.id as HouseholdSize,
                    smallChildren:
                      option.id === 'family' &&
                      draft.smallChildren === null
                        ? true
                        : draft.smallChildren,
                  })
                }
              />
            ))}
          </View>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View>
          {renderHeading(
            'Jeszcze kilka rzeczy o domu',
            'Małe dzieci, zwierzęta i szczególne potrzeby zmieniają częstotliwość, ale nie dokładają obowiązków na siłę.',
          )}

          {renderSectionTitle('Czy w domu są małe dzieci?')}

          <View style={styles.twoColumns}>
            <ChoiceButton
              selected={draft.smallChildren === true}
              label="Tak"
              onPress={() => patch({ smallChildren: true })}
            />
            <ChoiceButton
              selected={draft.smallChildren === false}
              label="Nie"
              onPress={() => patch({ smallChildren: false })}
            />
          </View>

          {renderSectionTitle('Czy mieszkają z Tobą zwierzęta?')}

          <TextInput
            value={draft.pets}
            onChangeText={(value) => patch({ pets: value })}
            placeholder="Np. pies, kot. Zostaw puste, jeśli nie."
            placeholderTextColor="#99958c"
            style={styles.textInput}
          />

          {renderSectionTitle(
            'Szczególne potrzeby dotyczące czystości',
          )}

          <TextInput
            value={draft.specialNeeds}
            onChangeText={(value) => patch({ specialNeeds: value })}
            placeholder="Opcjonalnie. Np. alergia, ktoś pracuje w domu, dużo gotowania."
            placeholderTextColor="#99958c"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.textInput, styles.multilineInput]}
          />
        </View>
      );
    }

    if (step === 2) {
      return (
        <View>
          {renderHeading(
            'Jak wygląda Twój dom?',
            'Zaznacz pomieszczenia i sprzęty, które naprawdę masz. Później możesz zmienić ten wybór, dodać własne pomieszczenia lub usunąć niepotrzebne.',
          )}

          {renderSectionTitle('Pomieszczenia')}

          <View style={styles.options}>
            {selectableRooms.map((room) => (
              <ChoiceButton
                key={room.id}
                selected={draft.places.includes(room.id)}
                label={room.name}
                onPress={() => togglePlace(room.id)}
              />
            ))}
          </View>

          <View style={styles.addRow}>
            <TextInput
              value={customRoomName}
              onChangeText={setCustomRoomName}
              placeholder="Nazwa pomieszczenia"
              placeholderTextColor="#99958c"
              style={styles.addInput}
              onSubmitEditing={addCustomRoom}
              returnKeyType="done"
            />
            <ActionButton
              label="+ Dodaj"
              onPress={addCustomRoom}
              secondary
              compact
              disabled={!customRoomName.trim()}
            />
          </View>

          {renderSectionTitle(
            'Urządzenia do okresowego czyszczenia',
          )}

          <View style={styles.options}>
            {APPLIANCE_OPTIONS.map((item) => (
              <ChoiceButton
                key={item.id}
                selected={draft.appliances.includes(item.id)}
                label={item.label}
                onPress={() => toggleAppliance(item.id)}
              />
            ))}

            {(draft.customAppliances ?? []).map((item) => (
              <View key={item.id} style={styles.customApplianceRow}>
                <Text style={styles.customApplianceName}>
                  {item.name}
                </Text>
                <Pressable
                  onPress={() => removeCustomAppliance(item.id)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Usuń</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.addRow}>
            <TextInput
              value={customApplianceName}
              onChangeText={setCustomApplianceName}
              placeholder="Nazwa urządzenia"
              placeholderTextColor="#99958c"
              style={styles.addInput}
              onSubmitEditing={addCustomAppliance}
              returnKeyType="done"
            />
            <ActionButton
              label="+ Dodaj"
              onPress={addCustomAppliance}
              secondary
              compact
              disabled={!customApplianceName.trim()}
            />
          </View>
        </View>
      );
    }

    if (step === 3) {
      return (
        <View>
          {renderHeading(
            'Ile czasu możesz przeznaczyć?',
            'Chodzi o realną dostępność, nie o idealny grafik. Plan zmieści się w tym czasie.',
          )}

          <View style={styles.options}>
            {TIME_BUDGET_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.id}
                selected={draft.timeBudget === option.id}
                label={option.label}
                detail={option.detail}
                onPress={() =>
                  patch({ timeBudget: option.id as TimeBudget })
                }
              />
            ))}
          </View>
        </View>
      );
    }

    if (step === 4) {
      return (
        <View>
          {renderHeading(
            'Kiedy możesz sprzątać?',
            'Wybierz pory dnia, które zwykle najbardziej Ci odpowiadają. Poszczególnym czynnościom przypiszesz konkretne dni i terminy w ustawieniach harmonogramu.',
          )}

          {renderSectionTitle('Pory dnia')}

          <View style={styles.options}>
            {DAY_PART_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.id}
                selected={draft.dayParts.includes(option.id)}
                label={option.label}
                onPress={() => toggleDayPart(option.id)}
              />
            ))}
          </View>
        </View>
      );
    }

    if (step === 5) {
      return (
        <View>
          {renderHeading(
            'Jakie czynności uwzględnić w planie?',
            'Przygotowałam listę na podstawie informacji o Twoim domu. Sprawdź propozycje, zmień nazwy lub częstotliwość i usuń czynności, których nie potrzebujesz.',
          )}

          <View style={styles.taskGroups}>
            {roomGroups.map((room) => (
              <View key={room.id}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{room.name}</Text>
                  <ActionButton
                    label="+ Dodaj czynność"
                    onPress={() => {
                      setCustomTitle('');
                      setAddingToRoom(room.id);
                    }}
                    secondary
                    compact
                  />
                </View>

                {room.tasks.length === 0 ? (
                  <Text style={styles.emptyMessage}>
                    Brak czynności w tym pomieszczeniu. Możesz dodać własną.
                  </Text>
                ) : (
                  <View style={styles.options}>
                    {room.tasks.map(renderTaskCard)}
                  </View>
                )}
              </View>
            ))}

            {applianceTasks.length > 0 ? (
              <View>
                {renderSectionTitle(
                  'Urządzenia do okresowego czyszczenia',
                )}
                <View style={styles.options}>
                  {applianceTasks.map(renderTaskCard)}
                </View>
              </View>
            ) : null}

            {remainingTasks.length > 0 ? (
              <View>
                {renderSectionTitle('Pozostałe czynności')}
                <View style={styles.options}>
                  {remainingTasks.map((task) => (
                    <View key={task.id}>
                      <Text style={styles.taskRoomLabel}>
                        {getRoomName(task.roomId)}
                      </Text>
                      {renderTaskCard(task)}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {removedTasks.length > 0 ? (
            <View style={styles.removedSection}>
              {renderSectionTitle('Usunięte czynności')}

              {removedTasks.map((task) => (
                <View key={task.id} style={styles.removedRow}>
                  <Text style={styles.removedTaskName}>
                    {task.title}
                  </Text>

                  <Pressable
                    onPress={() => {
                      if (task.libraryId) {
                        setExcluded((current) =>
                          current.filter(
                            (id) => id !== task.libraryId,
                          ),
                        );

                        setSuggestedTasks((current) => [
                          ...current,
                          task,
                        ]);
                      } else {
                        setCustomTasks((current) => [
                          ...current,
                          task,
                        ]);
                      }

                      setRemovedTasks((current) =>
                        current.filter(
                          (item) => item.id !== task.id,
                        ),
                      );
                    }}
                  >
                    <Text style={styles.restoreText}>Przywróć</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.helperText}>
            Po sprawdzeniu listy przejdziesz do układania harmonogramu.
          </Text>
        </View>
      );
    }

    if (step === 6) {
      return (
        <View style={styles.generation}>
          <ActivityIndicator size="large" color="#3b742f" />

          <Text style={styles.generationTitle}>
            Przygotowujemy Twój plan
          </Text>

          <Text style={styles.generationText}>
            {generationMessage === 0 &&
              'Analizujemy wybrane czynności i częstotliwość sprzątania…'}
            {generationMessage === 1 &&
              'Dopasowujemy zadania do dostępnego czasu…'}
            {generationMessage === 2 &&
              'Układamy harmonogram według Twoich preferencji…'}
          </Text>

          <View style={styles.progressDots}>
            {[0, 1, 2].map((item) => (
              <View
                key={item}
                style={[
                  styles.progressDot,
                  generationMessage >= item &&
                    styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      );
    }

    if (step === 7) {
      const groups = [
        {
          id: 'daily',
          label: 'Codzienne',
          color: '#e5f3e5',
          textColor: '#285c2b',
        },
        {
          id: 'regular',
          label: 'Regularne',
          color: '#e7effb',
          textColor: '#28517c',
        },
        {
          id: 'periodic',
          label: 'Okresowe',
          color: '#fff1d9',
          textColor: '#875b16',
        },
      ] as const;

      return (
        <View>
          {renderHeading(
            'Twój plan sprzątania',
            'Tak może wyglądać Twój harmonogram. Sprawdź podział czynności. Jeśli chcesz coś zmienić, wróć do listy i wygeneruj plan ponownie.',
          )}

          {groups.map((group) => {
            const tasks = plannedTasks.filter(
              (task) => getTaskPreviewGroup(task) === group.id,
            );

            return (
              <View key={group.id} style={styles.previewGroup}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.label}</Text>

                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: group.color },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBadgeText,
                        { color: group.textColor },
                      ]}
                    >
                      {tasks.length}{' '}
                      {tasks.length === 1 ? 'czynność' : 'czynności'}
                    </Text>
                  </View>
                </View>

                {tasks.length === 0 ? (
                  <Text style={styles.emptyMessage}>
                    Brak czynności w tej grupie.
                  </Text>
                ) : (
                  <View style={styles.options}>
                    {tasks.map((task) => (
                      <View key={task.id} style={styles.previewTask}>
                        <Text style={styles.previewTaskTitle}>
                          {task.title}
                        </Text>
                        <Text style={styles.previewTaskMeta}>
                          {getRoomName(task.roomId)} ·{' '}
                          {formatShortDate(task.dueDate)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {plannedTasks.length === 0 ? (
            <Text style={styles.emptyMessage}>
              Nie ma jeszcze żadnych czynności do zaplanowania. Wróć do listy
              i dodaj przynajmniej jedną.
            </Text>
          ) : null}
        </View>
      );
    }

    return null;
  };

  const renderCustomFrequencyModal = () => (
    <Modal
      visible={customFrequencyTask !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setCustomFrequencyTask(null)}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Niestandardowa częstotliwość
            </Text>
            <Pressable
              onPress={() => setCustomFrequencyTask(null)}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.description}>
            Ustaw, jak często czynność ma się powtarzać.
          </Text>

          <FieldLabel>Powtarzaj co</FieldLabel>

          <TextInput
            value={String(customRuleDraft.interval)}
            onChangeText={(value) => {
              const interval = Math.max(
                1,
                Math.min(365, Number(value) || 1),
              );

              setCustomRuleDraft((current) => ({
                ...current,
                interval,
              }));
            }}
            keyboardType="number-pad"
            style={styles.textInput}
          />

          <FieldLabel>Jednostka</FieldLabel>

          <View style={styles.segmentRow}>
            {[
              { id: 'days', label: 'Dni' },
              { id: 'weeks', label: 'Tygodnie' },
              { id: 'months', label: 'Miesiące' },
            ].map((unit) => (
              <Pressable
                key={unit.id}
                onPress={() => {
                  const interval = customRuleDraft.interval;

                  if (unit.id === 'days') {
                    setCustomRuleDraft({ unit: 'days', interval });
                  } else if (unit.id === 'weeks') {
                    setCustomRuleDraft({
                      unit: 'weeks',
                      interval,
                      weekdays: [1],
                    });
                  } else {
                    setCustomRuleDraft({
                      unit: 'months',
                      interval,
                      monthlyPattern: {
                        type: 'dayOfMonth',
                        day: 1,
                      },
                    });
                  }
                }}
                style={[
                  styles.segment,
                  customRuleDraft.unit === unit.id &&
                    styles.segmentSelected,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    customRuleDraft.unit === unit.id &&
                      styles.segmentTextSelected,
                  ]}
                >
                  {unit.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {customRuleDraft.unit === 'days' ? (
            <Text style={styles.infoBox}>
              Czynność będzie powtarzać się co {customRuleDraft.interval}{' '}
              {customRuleDraft.interval === 1 ? 'dzień' : 'dni'}.
            </Text>
          ) : null}

          {customRuleDraft.unit === 'weeks' ? (
            <View style={styles.modalSection}>
              <FieldLabel>Powtarzaj w dniach:</FieldLabel>

              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day) => {
                  const selected =
                    customRuleDraft.unit === 'weeks' &&
                    customRuleDraft.weekdays.includes(day.id);

                  return (
                    <Pressable
                      key={day.id}
                      onPress={() => toggleCustomWeekday(day.id)}
                      style={[
                        styles.weekdayButton,
                        selected && styles.weekdayButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          selected && styles.weekdayTextSelected,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {customRuleDraft.weekdays.length === 0 ? (
                <Text style={styles.errorText}>
                  Wybierz przynajmniej jeden dzień tygodnia.
                </Text>
              ) : null}
            </View>
          ) : null}

          {customRuleDraft.unit === 'months' ? (
            <View style={styles.modalSection}>
              <FieldLabel>Sposób powtarzania</FieldLabel>

              <View style={styles.options}>
                <ChoiceButton
                  selected={
                    customRuleDraft.monthlyPattern.type === 'dayOfMonth'
                  }
                  label="W konkretnym dniu miesiąca"
                  onPress={() =>
                    setCustomRuleDraft((current) => {
                      if (current.unit !== 'months') return current;

                      return {
                        ...current,
                        monthlyPattern: {
                          type: 'dayOfMonth',
                          day: 1,
                        },
                      };
                    })
                  }
                />

                <ChoiceButton
                  selected={
                    customRuleDraft.monthlyPattern.type ===
                    'weekdayOrdinal'
                  }
                  label="W określony dzień tygodnia"
                  onPress={() =>
                    setCustomRuleDraft((current) => {
                      if (current.unit !== 'months') return current;

                      return {
                        ...current,
                        monthlyPattern: {
                          type: 'weekdayOrdinal',
                          ordinal: 1,
                          weekday: 1,
                        },
                      };
                    })
                  }
                />
              </View>

              {customRuleDraft.monthlyPattern.type === 'dayOfMonth' ? (
                <>
                  <FieldLabel>Dzień miesiąca</FieldLabel>
                  <View style={styles.options}>
                    {Array.from(
                      { length: 31 },
                      (_, index) => index + 1,
                    ).map((day) => (
                      <ChoiceButton
                        key={day}
                        selected={
                          customRuleDraft.unit === 'months' &&
                          customRuleDraft.monthlyPattern.type ===
                            'dayOfMonth' &&
                          customRuleDraft.monthlyPattern.day === day
                        }
                        label={`${day}. dzień miesiąca`}
                        onPress={() =>
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
                          })
                        }
                      />
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <FieldLabel>Który tydzień?</FieldLabel>
                  <View style={styles.options}>
                    {[
                      { value: 1, label: 'Pierwszy' },
                      { value: 2, label: 'Drugi' },
                      { value: 3, label: 'Trzeci' },
                      { value: 4, label: 'Czwarty' },
                      { value: -1, label: 'Ostatni' },
                    ].map((item) => (
                      <ChoiceButton
                        key={item.value}
                        selected={
                          customRuleDraft.unit === 'months' &&
                          customRuleDraft.monthlyPattern.type ===
                            'weekdayOrdinal' &&
                          customRuleDraft.monthlyPattern.ordinal ===
                            item.value
                        }
                        label={item.label}
                        onPress={() =>
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
                                ordinal: item.value as
                                  | 1
                                  | 2
                                  | 3
                                  | 4
                                  | -1,
                              },
                            };
                          })
                        }
                      />
                    ))}
                  </View>

                  <FieldLabel>Dzień tygodnia</FieldLabel>
                  <View style={styles.options}>
                    {FULL_WEEKDAYS.map((day, index) => (
                      <ChoiceButton
                        key={index}
                        selected={
                          customRuleDraft.unit === 'months' &&
                          customRuleDraft.monthlyPattern.type ===
                            'weekdayOrdinal' &&
                          customRuleDraft.monthlyPattern.weekday === index
                        }
                        label={day}
                        onPress={() =>
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
                                weekday: index,
                              },
                            };
                          })
                        }
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <ActionButton
              label="Anuluj"
              onPress={() => setCustomFrequencyTask(null)}
              secondary
            />
            <ActionButton
              label="Zapisz częstotliwość"
              onPress={saveCustomFrequency}
              disabled={
                customRuleDraft.unit === 'weeks' &&
                customRuleDraft.weekdays.length === 0
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAddTaskModal = () => (
    <Modal
      visible={addingToRoom !== null}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setAddingToRoom(null);
        setCustomTitle('');
      }}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dodaj czynność</Text>
            <Pressable
              onPress={() => {
                setAddingToRoom(null);
                setCustomTitle('');
              }}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.description}>
            Pomieszczenie:{' '}
            <Text style={styles.boldText}>
              {addingToRoom ? getRoomName(addingToRoom) : ''}
            </Text>
          </Text>

          <FieldLabel>Nazwa czynności</FieldLabel>
          <TextInput
            value={customTitle}
            onChangeText={setCustomTitle}
            placeholder="Np. czyszczenie drzwi"
            placeholderTextColor="#99958c"
            style={styles.textInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              if (addingToRoom) addCustom(addingToRoom);
            }}
          />

          <View style={styles.modalActions}>
            <ActionButton
              label="Anuluj"
              onPress={() => {
                setAddingToRoom(null);
                setCustomTitle('');
              }}
              secondary
            />
            <ActionButton
              label="Dodaj"
              disabled={!customTitle.trim()}
              onPress={() => {
                if (addingToRoom) addCustom(addingToRoom);
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step < 5 ? (
            <>
              <Text style={styles.stageLabel}>
                Etap {STAGES[step]} z 5
              </Text>

              <View style={styles.progressBar}>
                {[1, 2, 3, 4, 5].map((stage) => (
                  <View
                    key={stage}
                    style={[
                      styles.progressSegment,
                      stage <= STAGES[step] &&
                        styles.progressSegmentActive,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.stageLabel}>Twój plan</Text>
          )}

          {renderStepContent()}
        </ScrollView>

        {step !== 6 ? (
          <View style={styles.footer}>
            {saveError ? (
              <Text style={styles.errorText}>{saveError}</Text>
            ) : null}

            <View style={styles.footerButtons}>
              {step > 0 ? (
                <ActionButton
                  label="Wstecz"
                  secondary
                  onPress={() => {
                    setSaveError('');
                    setStep(step === 7 ? 5 : step - 1);
                  }}
                />
              ) : null}

              {step < 5 ? (
                <View style={styles.footerPrimary}>
                  <ActionButton
                    label="Dalej"
                    disabled={!canContinue}
                    onPress={handleNext}
                  />
                </View>
              ) : step === 5 ? (
                <View style={styles.footerPrimary}>
                  <ActionButton
                    label="Ułóż mój harmonogram"
                    onPress={handleGeneratePlan}
                  />
                </View>
              ) : step === 7 ? (
                <View style={styles.footerPrimary}>
                  <ActionButton
                    label={saving ? 'Zapisywanie…' : 'Zatwierdź plan'}
                    onPress={handleAcceptPlan}
                    disabled={saving}
                  />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      {renderAddTaskModal()}
      {renderCustomFrequencyModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5e6ce',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5e6ce',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  stageLabel: {
    color: '#3b742f',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SenBold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
  },
  progressSegment: {
    height: 6,
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#d8d0c1',
  },
  progressSegmentActive: {
    backgroundColor: '#3b742f',
  },
  headingBlock: {
    marginTop: 22,
    marginBottom: 20,
  },
  heading: {
    color: '#4e4d4d',
    fontSize: 26,
    lineHeight: 33,
    fontFamily: 'SenBold',
    fontWeight: '700',
  },
  description: {
    color: '#68645e',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Sen',
    marginTop: 8,
  },
  sectionTitle: {
    color: '#4e4d4d',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'SenBold',
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 10,
  },
  options: {
    gap: 9,
  },
  choice: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ded8ce',
    backgroundColor: '#fffdf9',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  choiceSelected: {
    borderColor: '#3b742f',
    backgroundColor: '#edf4e8',
  },
  choiceLabel: {
    color: '#4e4d4d',
    fontSize: 14,
    fontFamily: 'SenBold',
    fontWeight: '700',
    paddingRight: 24,
  },
  choiceDetail: {
    color: '#77736c',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Sen',
    marginTop: 4,
  },
  choiceCheck: {
    position: 'absolute',
    right: 14,
    top: 13,
    color: '#3b742f',
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#ded8ce',
    borderRadius: 14,
    backgroundColor: '#fffdf9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#4e4d4d',
    fontSize: 14,
    fontFamily: 'Sen',
  },
  multilineInput: {
    minHeight: 100,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#ded8ce',
    borderRadius: 13,
    backgroundColor: '#fffdf9',
    paddingHorizontal: 12,
    color: '#4e4d4d',
    fontSize: 13,
    fontFamily: 'Sen',
  },
  actionButton: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#3b742f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'SenBold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#e9f1e4',
  },
  secondaryButtonText: {
    color: '#3b742f',
  },
  compactButton: {
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  disabledButton: {
    backgroundColor: '#b9b6ae',
    opacity: 0.65,
  },
  customApplianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c9ddbd',
    backgroundColor: '#edf4e8',
    padding: 12,
  },
  customApplianceName: {
    flex: 1,
    color: '#4e4d4d',
    fontFamily: 'SenBold',
    fontSize: 14,
  },
  taskGroups: {
    marginTop: 26,
    gap: 25,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  groupTitle: {
    flex: 1,
    color: '#4e4d4d',
    fontSize: 18,
    fontFamily: 'SenBold',
    fontWeight: '700',
  },
  taskCard: {
    borderWidth: 1,
    borderColor: '#ded8ce',
    borderRadius: 16,
    backgroundColor: '#fffdf9',
    padding: 12,
    gap: 10,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTitleInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: '#ded8ce',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: '#4e4d4d',
    fontFamily: 'SenBold',
    fontSize: 13,
  },
  removeButton: {
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#817b72',
    fontFamily: 'SenBold',
    fontSize: 12,
  },
  fieldLabel: {
    color: '#68645e',
    fontFamily: 'SenBold',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 7,
  },
  frequencyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  frequencyOption: {
    borderWidth: 1,
    borderColor: '#ded8ce',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  frequencyOptionSelected: {
    borderColor: '#3b742f',
    backgroundColor: '#edf4e8',
  },
  frequencyText: {
    color: '#68645e',
    fontSize: 11,
    fontFamily: 'Sen',
  },
  frequencyTextSelected: {
    color: '#3b742f',
    fontFamily: 'SenBold',
    fontWeight: '700',
  },
  taskRoomLabel: {
    color: '#817b72',
    fontFamily: 'Sen',
    fontSize: 11,
    marginBottom: 5,
  },
  emptyMessage: {
    color: '#817b72',
    backgroundColor: '#f0ede6',
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Sen',
  },
  removedSection: {
    marginTop: 28,
  },
  removedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#eae6de',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 7,
  },
  removedTaskName: {
    flex: 1,
    color: '#68645e',
    fontSize: 13,
    fontFamily: 'Sen',
  },
  restoreText: {
    color: '#3b742f',
    fontFamily: 'SenBold',
    fontSize: 12,
  },
  helperText: {
    color: '#817b72',
    fontFamily: 'Sen',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 24,
  },
  generation: {
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  generationTitle: {
    color: '#4e4d4d',
    fontFamily: 'SenBold',
    fontSize: 21,
    textAlign: 'center',
    marginTop: 25,
  },
  generationText: {
    color: '#817b72',
    fontFamily: 'Sen',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 12,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 28,
  },
  progressDot: {
    width: 9,
    height: 9,
    borderRadius: 10,
    backgroundColor: '#d8d0c1',
  },
  progressDotActive: {
    backgroundColor: '#3b742f',
  },
  previewGroup: {
    marginTop: 25,
  },
  countBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  countBadgeText: {
    fontFamily: 'SenBold',
    fontSize: 11,
  },
  previewTask: {
    borderWidth: 1,
    borderColor: '#ded8ce',
    backgroundColor: '#fffdf9',
    borderRadius: 14,
    padding: 13,
  },
  previewTaskTitle: {
    color: '#4e4d4d',
    fontSize: 13,
    fontFamily: 'SenBold',
  },
  previewTaskMeta: {
    color: '#817b72',
    fontSize: 11,
    fontFamily: 'Sen',
    marginTop: 5,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#ded8ce',
    backgroundColor: '#fffdf9',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  footerPrimary: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#fffdf9',
    borderRadius: 22,
    padding: 19,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    flex: 1,
    color: '#4e4d4d',
    fontSize: 19,
    fontFamily: 'SenBold',
  },
  modalClose: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f0ede6',
  },
  modalCloseText: {
    color: '#68645e',
    fontSize: 24,
  },
  modalSection: {
    marginTop: 18,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 7,
  },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ded8ce',
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },
  segmentSelected: {
    borderColor: '#3b742f',
    backgroundColor: '#edf4e8',
  },
  segmentText: {
    color: '#68645e',
    fontSize: 11,
    fontFamily: 'Sen',
  },
  segmentTextSelected: {
    color: '#3b742f',
    fontFamily: 'SenBold',
  },
  infoBox: {
    color: '#68645e',
    backgroundColor: '#f0ede6',
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    fontFamily: 'Sen',
    fontSize: 13,
    lineHeight: 19,
  },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  weekdayButton: {
    borderWidth: 1,
    borderColor: '#ded8ce',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  weekdayButtonSelected: {
    borderColor: '#3b742f',
    backgroundColor: '#edf4e8',
  },
  weekdayText: {
    color: '#68645e',
    fontFamily: 'Sen',
    fontSize: 12,
  },
  weekdayTextSelected: {
    color: '#3b742f',
    fontFamily: 'SenBold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 9,
    marginTop: 22,
  },
  errorText: {
    color: '#b42318',
    fontSize: 12,
    fontFamily: 'Sen',
    marginBottom: 8,
  },
  boldText: {
    color: '#4e4d4d',
    fontFamily: 'SenBold',
  },
});
