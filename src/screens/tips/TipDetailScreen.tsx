import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Bookmark, Check } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { findTip, findTipCategory } from '@/data/tips';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { fontFamilies } from '@/theme/typography';

export function TipDetailScreen({ tipId }: { tipId: string }) {
  const { state, toggleSavedTip } = useAppStore();
  const { goBack } = useNavigation();
  const { showToast } = useToast();

  const tip = findTip(tipId);

  if (!tip) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Nie znaleziono porady"
          onBack={goBack}
        />
      </View>
    );
  }

  const saved = state.savedTipIds.includes(tip.id);
  const category = findTipCategory(tip.categoryId);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={category?.name ?? 'Porada'}
        onBack={goBack}
        actions={
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
              pressed && styles.pressed,
            ]}
          >
            <Bookmark
              size={20}
              color="#3b742f"
              fill={saved ? '#3b742f' : 'transparent'}
            />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.readTime}>
          {tip.readMinutes} min czytania
        </AppText>

        <AppText style={styles.title}>
          {tip.title}
        </AppText>

        <AppText style={styles.intro}>
          {tip.intro}
        </AppText>

        <View style={styles.points}>
          {tip.points.map((point) => (
            <View key={point} style={styles.pointCard}>
              <View style={styles.checkCircle}>
                <Check
                  size={14}
                  color="#3b742f"
                  strokeWidth={3}
                />
              </View>

              <AppText style={styles.pointText}>
                {point}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  bookmarkButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pressed: {
    opacity: 0.65,
  },
  readTime: {
    color: '#3b742f',
    fontSize: 12,
    fontFamily: fontFamilies.medium,
  },
  title: {
    marginTop: 8,
    color: '#4e4d4d',
    fontSize: 25,
    fontFamily: fontFamilies.bold,
    lineHeight: 32,
  },
  intro: {
    marginTop: 16,
    color: '#77766f',
    fontSize: 15,
    fontFamily: fontFamilies.regular,
    lineHeight: 24,
  },
  points: {
    marginTop: 24,
    gap: 12,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  checkCircle: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#edf4e9',
  },
  pointText: {
    flex: 1,
    color: '#4e4d4d',
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    lineHeight: 21,
  },
});
