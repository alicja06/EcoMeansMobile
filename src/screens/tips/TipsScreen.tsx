
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Bookmark, ChevronRight } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { TIPS, TIP_CATEGORIES } from '@/data/tips';
import { TIP_CATEGORY_ICONS } from '@/components/icons/categoryIcons';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import type { TipCategoryId } from '@/types';
import { fontFamilies } from '@/theme/typography';

export function TipsScreen() {
  const { state, toggleSavedTip } = useAppStore();
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const [category, setCategory] = useState<TipCategoryId | null>(null);

  const tips = TIPS.filter(
    (tip) => !category || tip.categoryId === category
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Porady"
        subtitle="Baza wiedzy o sprzątaniu"
      />

      <View style={styles.categories}>
        {TIP_CATEGORIES.map((item) => {
          const Icon = TIP_CATEGORY_ICONS[item.id];
          const active = category === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => setCategory(active ? null : item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.categoryCard,
                active
                  ? styles.categoryCardActive
                  : styles.categoryCardInactive,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.categoryIcon}>
                <Icon size={20} color="#3b742f" />
              </View>

              <View style={styles.categoryText}>
                <AppText style={styles.categoryName}>
                  {item.name}
                </AppText>

                <AppText style={styles.categoryDescription}>
                  {item.description}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tipsList}>
        {tips.map((tip) => {
          const saved = state.savedTipIds.includes(tip.id);

          const categoryName = TIP_CATEGORIES.find(
            (item) => item.id === tip.categoryId
          )?.name;

          return (
            <View key={tip.id} style={styles.tipRow}>
              <Pressable
                onPress={() =>
                  navigate({ name: 'tip', tipId: tip.id })
                }
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.tipCard,
                  pressed && styles.tipCardPressed,
                ]}
              >
                <View style={styles.tipContent}>
                  <AppText style={styles.tipMeta}>
                    {categoryName} · {tip.readMinutes} min
                  </AppText>

                  <AppText style={styles.tipTitle}>
                    {tip.title}
                  </AppText>

                  <AppText
                    style={styles.tipSummary}
                    numberOfLines={2}
                  >
                    {tip.summary}
                  </AppText>
                </View>

                <ChevronRight
                  size={18}
                  color="#99968e"
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  toggleSavedTip(tip.id);
                  showToast(
                    saved
                      ? 'Usunięto z zapisanych'
                      : 'Zapisano poradę'
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? 'Usuń z zapisanych' : 'Zapisz poradę'
                }
                accessibilityState={{ selected: saved }}
                style={({ pressed }) => [
                  styles.bookmarkButton,
                  pressed && styles.bookmarkPressed,
                ]}
              >
                <Bookmark
                  size={20}
                  color="#3b742f"
                  fill={saved ? '#3b742f' : 'transparent'}
                />
              </Pressable>
            </View>
          );
        })}

        {tips.length === 0 && (
          <AppText style={styles.emptyText}>
            Brak porad w tej kategorii.
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  categoryCard: {
    width: '48%',
    minHeight: 142,
    padding: 16,
    borderWidth: 1,
    borderRadius: 24,
    gap: 12,
  },
  categoryCardActive: {
    borderColor: '#3b742f',
    backgroundColor: '#edf4e9',
  },
  categoryCardInactive: {
    borderColor: 'transparent',
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#e8f0e3',
  },
  categoryText: {
    flex: 1,
    gap: 4,
  },
  categoryName: {
    color: '#4e4d4d',
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  categoryDescription: {
    color: '#77766f',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fontFamilies.regular,
  },
  tipsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  tipCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  tipCardPressed: {
    opacity: 0.75,
  },
  tipContent: {
    flex: 1,
    minWidth: 0,
  },
  tipMeta: {
    color: '#3b742f',
    fontSize: 12,
    fontFamily: fontFamilies.medium,
  },
  tipTitle: {
    marginTop: 4,
    color: '#4e4d4d',
    fontSize: 15,
    fontFamily: fontFamilies.bold,
    lineHeight: 21,
  },
  tipSummary: {
    marginTop: 4,
    color: '#77766f',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fontFamilies.regular,
  },
  bookmarkButton: {
    width: 48,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  bookmarkPressed: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.75,
  },
  emptyText: {
    paddingVertical: 24,
    color: '#77766f',
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
  },
});
