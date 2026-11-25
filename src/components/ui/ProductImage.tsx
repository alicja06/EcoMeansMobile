
import { StyleSheet, Text, View } from 'react-native';
import {
  CookingPot,
  Bath,
  SprayCan,
  Utensils,
} from 'lucide-react-native';

import type { ProductCategoryId } from '@/types';

interface ProductImageProps {
  categoryId: ProductCategoryId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CATEGORY_STYLES: Record<
  ProductCategoryId,
  {
    backgroundColor: string;
    color: string;
    label: string;
    Icon: typeof CookingPot;
  }
> = {
  kitchen: {
    backgroundColor: '#e6eddf',
    color: '#3b742f',
    label: 'Kuchnia',
    Icon: CookingPot,
  },
  bathroom: {
    backgroundColor: '#e4eddf',
    color: '#3b742f',
    label: 'Łazienka',
    Icon: Bath,
  },
  floors: {
    backgroundColor: '#f1e5d1',
    color: '#806a43',
    label: 'Podłogi',
    Icon: SprayCan,
  },
  dishes: {
    backgroundColor: '#e9e8e3',
    color: '#4e4d4d',
    label: 'Naczynia',
    Icon: Utensils,
  },
};

export function ProductImage({
  categoryId,
  size = 'md',
}: ProductImageProps) {
  const category = CATEGORY_STYLES[categoryId] ?? CATEGORY_STYLES.kitchen;
  const Icon = category.Icon;

  const dimensions =
    size === 'sm'
      ? { width: 80, height: 80, iconSize: 28 }
      : size === 'lg'
        ? { width: '100%' as const, height: 256, iconSize: 76 }
        : { width: '100%' as const, height: 160, iconSize: 52 };

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: category.backgroundColor,
        },
      ]}
    >
      <Icon size={dimensions.iconSize} color={category.color} />

      {size === 'lg' && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{category.label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  label: {
    color: '#4e4d4d',
    fontSize: 12,
    fontWeight: '600',
  },
});
