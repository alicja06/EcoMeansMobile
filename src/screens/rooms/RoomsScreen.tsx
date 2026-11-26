
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ListPlus, Plus } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { ROOMS } from '@/data/rooms';
import { ROOM_ICONS } from '@/components/icons/categoryIcons';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { todayISO } from '@/lib/dates';
import { isScheduledOn, resolveCalendar } from '@/lib/schedule';
import { isDoneToday, taskCountLabel } from '@/lib/tasks';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/ui/controls';
import { TaskLibrarySheet } from '@/screens/rooms/TaskLibrarySheet';
import { fontFamilies } from '@/theme/typography';

export function RoomsScreen() {
  const { state, updateHome } = useAppStore();
  const { navigate } = useNavigation();
  const [libraryOpen, setLibraryOpen] = useState(false);

  const today = todayISO();
  const calendar = resolveCalendar(state.home);

  const visibleRooms = ROOMS.filter((room) => {
    if (
      !state.home.onboardingComplete ||
      state.home.places.length === 0
    ) {
      return true;
    }

    return (
      state.home.places.includes(room.id) ||
      state.tasks.some((task) => task.roomId === room.id)
    );
  });

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Mój dom"
        subtitle="Wybierz pomieszczenie"
        actions={
          <Pressable
            onPress={() => setLibraryOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Biblioteka czynności"
            style={({ pressed }) => [
              styles.libraryButton,
              pressed && styles.pressed,
            ]}
          >
            <ListPlus size={20} color="#ffffff" />
          </Pressable>
        }
      />

      <View style={styles.roomsGrid}>
        {visibleRooms.map((room) => {
          const Icon = ROOM_ICONS[room.id];

          const tasks = state.tasks.filter(
            (task) =>
              task.roomId === room.id &&
              task.enabled
          );

          const dueCount = tasks.filter(
            (task) =>
              isScheduledOn(task, today, calendar) &&
              !isDoneToday(task, today)
          ).length;

          return (
            <Pressable
              key={room.id}
              onPress={() =>
                navigate({
                  name: 'room',
                  roomId: room.id,
                })
              }
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.roomCard,
                pressed && styles.roomCardPressed,
              ]}
            >
              <View style={styles.roomIcon}>
                <Icon size={24} color="#3b742f" />
              </View>

              <View style={styles.roomInfo}>
                <AppText style={styles.roomName}>
                  {room.name}
                </AppText>

                <AppText style={styles.roomTaskCount}>
                  {taskCountLabel(tasks.length)}
                  {dueCount > 0 ? (
                    <AppText style={styles.dueCount}>
                      {' · '}
                      {dueCount} na dziś
                    </AppText>
                  ) : null}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.bottomSection}>
        <EmptyState
          icon={Plus}
          title="Dodawaj zadania z biblioteki"
          text="Wybierz gotowe czynności jednym kliknięciem albo dodaj własne w wybranym pomieszczeniu."
        />

        <Pressable
          onPress={() =>
            updateHome({ onboardingComplete: false })
          }
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.rebuildButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={styles.rebuildButtonText}>
            Zmień opis domu i ułóż plan od nowa
          </AppText>
        </Pressable>
      </View>

      {libraryOpen && (
        <TaskLibrarySheet
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  libraryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#3b742f',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  roomCard: {
    width: '48%',
    minHeight: 142,
    justifyContent: 'space-between',
    gap: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  roomCardPressed: {
    opacity: 0.75,
  },
  roomIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#e8f0e3',
  },
  roomInfo: {
    gap: 4,
  },
  roomName: {
    color: '#4e4d4d',
    fontSize: 15,
    fontFamily: fontFamilies.bold,
  },
  roomTaskCount: {
    color: '#77766f',
    fontSize: 12,
    fontFamily: fontFamilies.regular,
  },
  dueCount: {
    color: '#3b742f',
    fontFamily: fontFamilies.bold,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  rebuildButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebuildButtonText: {
    color: '#3b742f',
    fontSize: 13,
    fontFamily: fontFamilies.medium,
    textAlign: 'center',
  },
});
