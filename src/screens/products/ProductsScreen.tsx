
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Heart, ShoppingCart } from 'lucide-react-native';

import { PRODUCTS, PRODUCT_CATEGORIES } from '@/data/products';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { ProductImage } from '@/components/ui/ProductImage';
import { fontFamilies } from '@/theme/typography';
import type { ProductCategoryId } from '@/types';

type Filter = ProductCategoryId | 'all' | 'favorites';

export function ProductsScreen() {
  const { state, toggleFavorite } = useAppStore();
  const { navigate } = useNavigation();

  const [filter, setFilter] = useState<Filter>('all');

  const visible = PRODUCTS.filter((product) => {
    if (filter === 'all') return true;

    if (filter === 'favorites') {
      return state.favoriteProductIds.includes(product.id);
    }

    return product.categoryId === filter;
  });

  const chips: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'favorites', label: 'Ulubione' },
    ...PRODUCT_CATEGORIES.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Produkty"
        subtitle="Katalog EcoMeans"
        actions={
          <Pressable
            onPress={() => navigate({ name: 'shopping' })}
            accessibilityRole="button"
            accessibilityLabel="Lista zakupów"
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <ShoppingCart size={20} color="#4e4d4d" />
          </Pressable>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {chips.map((chip) => {
          const active = filter === chip.value;

          return (
            <Pressable
              key={chip.value}
              onPress={() => setFilter(chip.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.filterChip,
                active
                  ? styles.filterChipActive
                  : styles.filterChipInactive,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                style={[
                  styles.filterText,
                  active && styles.filterTextActive,
                ]}
              >
                {chip.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.productList}>
        {visible.length === 0 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyText}>
              Nie masz jeszcze ulubionych produktów. Kliknij serce
              na wybranej karcie.
            </AppText>
          </View>
        ) : null}

        {visible.map((product) => {
          const favorite = state.favoriteProductIds.includes(
            product.id,
          );

          const categoryName = PRODUCT_CATEGORIES.find(
            (category) => category.id === product.categoryId,
          )?.name;

          return (
            <View key={product.id} style={styles.productCard}>
              <Pressable
                onPress={() =>
                  navigate({
                    name: 'product',
                    productId: product.id,
                  })
                }
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.productMain,
                  pressed && styles.pressedCard,
                ]}
              >
                <ProductImage
                  categoryId={product.categoryId}
                  size="sm"
                />

                <View style={styles.productInfo}>
                  <AppText style={styles.categoryName}>
                    {categoryName}
                  </AppText>

                  <AppText style={styles.productName}>
                    {product.name}
                  </AppText>

                  <AppText
                    style={styles.productDescription}
                    numberOfLines={2}
                  >
                    {product.shortUse}
                  </AppText>
                </View>
              </Pressable>

              <Pressable
                onPress={() => toggleFavorite(product.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  favorite
                    ? `Usuń z ulubionych: ${product.name}`
                    : `Dodaj do ulubionych: ${product.name}`
                }
                accessibilityState={{ selected: favorite }}
                style={({ pressed }) => [
                  styles.favoriteButton,
                  pressed && styles.pressed,
                ]}
              >
                <Heart
                  size={19}
                  color={favorite ? '#c94b4b' : '#77766f'}
                  fill={favorite ? '#c94b4b' : 'transparent'}
                />
              </Pressable>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => navigate({ name: 'calculators' })}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.calculatorCard,
          pressed && styles.pressedCard,
        ]}
      >
        <View style={styles.calculatorText}>
          <AppText style={styles.calculatorTitle}>
            Kalkulator dawkowania
          </AppText>
          <AppText style={styles.calculatorDescription}>
            Sprawdź, ile koncentratu dodać do wody
          </AppText>
        </View>
        <AppText style={styles.calculatorArrow}>›</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5e6ce',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  pressedCard: {
    opacity: 0.8,
  },
  filters: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: '#3b742f',
  },
  filterChipInactive: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  filterText: {
    color: '#4e4d4d',
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  productList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyCard: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  emptyText: {
    color: '#77766f',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontFamilies.regular,
  },
  productCard: {
    position: 'relative',
    minHeight: 112,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 12,
    paddingRight: 52,
    elevation: 2,
  },
  productMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    color: '#99968e',
    fontSize: 10,
    fontFamily: fontFamilies.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  productName: {
    marginTop: 3,
    color: '#4e4d4d',
    fontSize: 15,
    fontFamily: fontFamilies.bold,
  },
  productDescription: {
    marginTop: 5,
    color: '#77766f',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fontFamilies.regular,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#f5f4f0',
  },
  calculatorCard: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    borderRadius: 24,
    backgroundColor: '#eee2cd',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calculatorText: {
    flex: 1,
  },
  calculatorTitle: {
    color: '#4e4d4d',
    fontSize: 15,
    fontFamily: fontFamilies.bold,
  },
  calculatorDescription: {
    marginTop: 5,
    color: '#77766f',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fontFamilies.regular,
  },
  calculatorArrow: {
    marginLeft: 12,
    color: '#3b742f',
    fontSize: 30,
    fontFamily: fontFamilies.regular,
  },
});
