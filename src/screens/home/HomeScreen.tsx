import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarDays,
  ChevronRight,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react-native';

import type { CleaningTask } from '@/types';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { formatFullDate, todayISO } from '@/lib/dates';
import { isDoneToday } from '@/lib/tasks';
import { isScheduledOn, resolveCalendar } from '@/lib/schedule';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskSettingsSheet } from '@/components/tasks/TaskSettingsSheet';
import { ProductImage } from '@/components/ui/ProductImage';
import { PRODUCTS } from '@/data/products';
import { TIPS } from '@/data/tips';

const COLORS = {
  background: '#f5e6ce',
  green: '#3b742f',
  greenLight: '#73a62d',
  dark: '#4e4d4d',
  muted: '#77766f',
  white: '#ffffff',
  lightGreen: '#e8f0e2',
  border: '#e8e1d5',
};

export function HomeScreen() {
  const { state, toggleTaskDone } = useAppStore();
  const { navigate } = useNavigation();
  const { showToast } = useToast();

  const [selected, setSelected] = useState<CleaningTask | null>(null);

  const today = todayISO();
  const dayIndex = Number(today.replace(/-/g, ''));
  const tip = TIPS[dayIndex % TIPS.length];
  const product = PRODUCTS[dayIndex % PRODUCTS.length];

  const calendar = resolveCalendar(state.home);

  const todayTasks = state.tasks
    .filter(
      (task) =>
        task.enabled &&
        (isScheduledOn(task, today, calendar) || isDoneToday(task, today)),
    )
    .sort(
      (a, b) =>
        Number(isDoneToday(a, today)) - Number(isDoneToday(b, today)),
    );

  const carried = state.tasks.filter(
    (task) =>
      task.enabled &&
      task.dueDate < today &&
      !isScheduledOn(task, today, calendar) &&
      !isDoneToday(task, today),
  );

  const doneCount = todayTasks.filter((task) =>
    isDoneToday(task, today),
  ).length;

  const name = state.profile.name.trim();

  const openShopping = state.shoppingItems.filter(
    (item) => !item.bought,
  ).length;

  const handleToggle = (taskId: string, done: boolean) => {
    toggleTaskDone(taskId);
    showToast(done ? 'Cofnięto zadanie' : 'Zadanie wykonane. Świetnie!');
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.date}>{formatFullDate(today)}</Text>
            <Text style={styles.greeting}>
              {name ? `Dzień dobry, ${name}` : 'Dzień dobry'}
            </Text>
          </View>

          <Pressable
            onPress={() => navigate({ name: 'shopping' })}
            accessibilityRole="button"
            accessibilityLabel="Lista zakupów"
            style={({ pressed }) => [
              styles.shoppingIconButton,
              pressed && styles.pressed,
            ]}
          >
            <ShoppingCart size={21} color={COLORS.dark} />

            {openShopping > 0 && (
              <View style={styles.shoppingBadge}>
                <Text style={styles.shoppingBadgeText}>
                  {openShopping}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.todayCard}>
          <View style={styles.todayLabel}>
            <Sparkles size={17} color="#e8efdf" />
            <Text style={styles.todayLabelText}>Na dziś</Text>
          </View>

          <Text style={styles.todayHeadline}>
            {todayTasks.length === 0
              ? 'Brak zadań na dziś'
              : doneCount === todayTasks.length
                ? 'Wszystko gotowe'
                : `Zostało ${todayTasks.length - doneCount} z ${todayTasks.length}`}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    todayTasks.length === 0
                      ? '0%'
                      : `${(doneCount / todayTasks.length) * 100}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.doneLabel}>
            Wykonane: {doneCount}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zadania na dziś</Text>

          {todayTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Nic do zrobienia. Możesz odpocząć albo dodać nowe zadanie
                w sekcji Mój dom.
              </Text>
            </View>
          ) : (
            <View style={styles.taskList}>
              {todayTasks.map((task) => {
                const done = isDoneToday(task, today);

                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    today={today}
                    done={done}
                    whenLabel={done ? 'Zrobione' : 'Na dziś'}
                    onToggle={() => handleToggle(task.id, done)}
                    trailing={
                      <Pressable
                        onPress={() => setSelected(task)}
                        accessibilityRole="button"
                        accessibilityLabel={`Ustawienia: ${task.title}`}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.settingsButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <SlidersHorizontal
                          size={17}
                          color={COLORS.muted}
                        />
                      </Pressable>
                    }
                  />
                );
              })}
            </View>
          )}
        </View>

        {carried.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Z poprzednich dni
            </Text>

            <Text style={styles.carriedDescription}>
              Nic się nie dzieje, jeśli zostawisz je na później.
              Możesz je przesunąć, pominąć albo zmienić częstotliwość.
            </Text>

            <View style={styles.taskList}>
              {carried.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  done={false}
                  whenLabel="Kiedy pasuje"
                  onToggle={() => handleToggle(task.id, false)}
                  trailing={
                    <Pressable
                      onPress={() => setSelected(task)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ustawienia: ${task.title}`}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.settingsButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <SlidersHorizontal
                        size={17}
                        color={COLORS.muted}
                      />
                    </Pressable>
                  }
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.quickActions}>
          <Pressable
            onPress={() => navigate({ name: 'plan' })}
            style={({ pressed }) => [
              styles.quickAction,
              pressed && styles.pressed,
            ]}
          >
            <CalendarDays size={22} color={COLORS.green} />
            <Text style={styles.quickActionText}>
              Harmonogram sprzątania
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigate({ name: 'shopping' })}
            style={({ pressed }) => [
              styles.quickAction,
              pressed && styles.pressed,
            ]}
          >
            <ShoppingCart size={22} color={COLORS.green} />
            <Text style={styles.quickActionText}>
              Lista zakupów
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Porada dnia</Text>

          <Pressable
            onPress={() => navigate({ name: 'tip', tipId: tip.id })}
            style={({ pressed }) => [
              styles.recommendationCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>
                {tip.title}
              </Text>
              <Text style={styles.recommendationDescription}>
                {tip.summary}
              </Text>
            </View>

            <ChevronRight size={21} color={COLORS.green} />
          </Pressable>
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Polecany produkt</Text>

          <Pressable
            onPress={() =>
              navigate({ name: 'product', productId: product.id })
            }
            style={({ pressed }) => [
              styles.productCard,
              pressed && styles.pressed,
            ]}
          >
            <ProductImage
              categoryId={product.categoryId}
              size="sm"
            />

            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {product.name}
              </Text>
              <Text style={styles.productDescription}>
                {product.shortUse}
              </Text>
              <Text style={styles.productLink}>
                Zobacz kartę produktu
              </Text>
            </View>

            <ChevronRight size={20} color={COLORS.green} />
          </Pressable>
        </View>
      </ScrollView>

      {selected && (
        <TaskSettingsSheet
          task={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 22,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  date: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  greeting: {
    marginTop: 3,
    color: COLORS.dark,
    fontSize: 24,
    fontWeight: '700',
  },
  shoppingIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  shoppingBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: COLORS.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  shoppingBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  todayCard: {
    borderRadius: 25,
    backgroundColor: COLORS.green,
    padding: 20,
    elevation: 3,
  },
  todayLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayLabelText: {
    color: '#e8efdf',
    fontSize: 14,
    fontWeight: '700',
  },
  todayHeadline: {
    marginTop: 12,
    color: COLORS.white,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700',
  },
  progressTrack: {
    height: 9,
    marginTop: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  doneLabel: {
    marginTop: 9,
    color: '#e8efdf',
    fontSize: 12,
  },
  section: {
    marginTop: 27,
  },
  sectionTitle: {
    marginBottom: 12,
    color: COLORS.dark,
    fontSize: 19,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 19,
    backgroundColor: COLORS.white,
    padding: 18,
    elevation: 1,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  taskList: {
    gap: 11,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carriedDescription: {
    marginTop: -5,
    marginBottom: 13,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 11,
    marginTop: 27,
  },
  quickAction: {
    flex: 1,
    minHeight: 105,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderRadius: 19,
    backgroundColor: COLORS.white,
    padding: 15,
    elevation: 1,
  },
  quickActionText: {
    color: COLORS.dark,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    padding: 17,
    elevation: 1,
  },
  recommendationContent: {
    flex: 1,
    gap: 6,
  },
  recommendationTitle: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: '700',
  },
  recommendationDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    padding: 12,
    elevation: 1,
  },
  productInfo: {
    flex: 1,
    gap: 5,
  },
  productName: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '700',
  },
  productDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  productLink: {
    marginTop: 3,
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
  },
  lastSection: {
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.78,
  },
});
