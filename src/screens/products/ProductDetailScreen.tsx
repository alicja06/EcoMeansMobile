
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Heart, ShoppingCart } from 'lucide-react-native';

import {
  findProduct,
  findProductCategory,
} from '@/data/products';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { DemoNotice } from '@/components/ui/controls';
import { ProductImage } from '@/components/ui/ProductImage';
import { Sheet } from '@/components/ui/Sheet';
import { fontFamilies } from '@/theme/typography';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <View>{children}</View>
    </View>
  );
}

export function ProductDetailScreen({
  productId,
}: {
  productId: string;
}) {
  const {
    state,
    toggleFavorite,
    addShoppingItem,
  } = useAppStore();

  const { goBack, navigate } = useNavigation();
  const { showToast } = useToast();

  const [storeInfo, setStoreInfo] = useState(false);

  const product = findProduct(productId);

  if (!product) {
    return (
      <ScreenHeader
        title="Nie znaleziono produktu"
        onBack={goBack}
      />
    );
  }

  const favorite = state.favoriteProductIds.includes(product.id);

  const inList = state.shoppingItems.some(
    (item) =>
      item.productId === product.id && !item.bought,
  );

  const category = findProductCategory(product.categoryId);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={product.name}
        subtitle={category?.name}
        onBack={goBack}
        actions={
          <Pressable
            onPress={() => toggleFavorite(product.id)}
            accessibilityRole="button"
            accessibilityLabel={
              favorite
                ? 'Usuń z ulubionych'
                : 'Dodaj do ulubionych'
            }
            accessibilityState={{ selected: favorite }}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Heart
              size={20}
              color={favorite ? '#c94b4b' : '#4e4d4d'}
              fill={favorite ? '#c94b4b' : 'transparent'}
            />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProductImage
          categoryId={product.categoryId}
          size="lg"
        />

        <View style={styles.notice}>
          <DemoNotice
            text="Opisy i wskazówki poniżej są przykładowe, do czasu zatwierdzenia kart produktów."
          />
        </View>

        <Section title="Opis">
          <AppText style={styles.bodyText}>
            {product.description}
          </AppText>
        </Section>

        <Section title="Przeznaczenie">
          <AppText style={styles.bodyText}>
            {product.purpose}
          </AppText>
        </Section>

        <Section title="Sposób użycia">
          <View style={styles.list}>
            {product.usageSteps.map((step, index) => (
              <View key={`${index}-${step}`} style={styles.listRow}>
                <AppText style={styles.listNumber}>
                  {index + 1}.
                </AppText>
                <AppText style={styles.bodyText}>{step}</AppText>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Dawkowanie">
          <AppText style={styles.bodyText}>
            {product.dosage}
          </AppText>

          {product.categoryId === 'floors' ? (
            <Pressable
              onPress={() => navigate({ name: 'calculators' })}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.calculatorLink,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.calculatorLinkText}>
                Oblicz ilość w kalkulatorze
              </AppText>
            </Pressable>
          ) : null}
        </Section>

        <Section title="Skład i oznaczenia">
          <AppText style={styles.bodyText}>
            {product.composition}
          </AppText>
        </Section>

        <Section title="Wskazówki">
          <View style={styles.list}>
            {product.tips.map((tip, index) => (
              <View key={`${index}-${tip}`} style={styles.listRow}>
                <AppText style={styles.bullet}>•</AppText>
                <AppText style={styles.bodyText}>{tip}</AppText>
              </View>
            ))}
          </View>
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => {
            if (inList) {
              navigate({ name: 'shopping' });
              return;
            }

            addShoppingItem(product.name, product.id);
            showToast('Dodano do listy zakupów');
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed,
          ]}
        >
          <ShoppingCart size={18} color="#ffffff" />
          <AppText style={styles.addButtonText}>
            {inList
              ? 'Jest na liście zakupów'
              : 'Dodaj do listy zakupów'}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => setStoreInfo(true)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.storeButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={styles.storeButtonText}>Sklep</AppText>
        </Pressable>
      </View>

      {storeInfo ? (
        <Sheet
          title="Sklep EcoMeans"
          onClose={() => setStoreInfo(false)}
        >
          <AppText style={styles.sheetText}>
            Link do sklepu z kartą produktu pojawi się po
            podłączeniu sklepu EcoMeans. Na tym etapie prototypu
            możesz dodać produkt do listy zakupów.
          </AppText>
        </Sheet>
      ) : null}
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  notice: {
    marginTop: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    color: '#4e4d4d',
    fontSize: 16,
    fontFamily: fontFamilies.bold,
  },
  bodyText: {
    color: '#77766f',
    fontSize: 13,
    lineHeight: 21,
    flexShrink: 1,
    fontFamily: fontFamilies.regular,
  },
  list: {
    gap: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  listNumber: {
    color: '#3b742f',
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  bullet: {
    color: '#3b742f',
    fontSize: 17,
    lineHeight: 21,
    fontFamily: fontFamilies.regular,
  },
  calculatorLink: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 6,
  },
  calculatorLinkText: {
    color: '#3b742f',
    fontSize: 13,
    fontFamily: fontFamilies.bold,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dedbd3',
    backgroundColor: '#ffffff',
  },
  addButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#3b742f',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
  },
  storeButton: {
    minHeight: 50,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dedbd3',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  storeButtonText: {
    color: '#4e4d4d',
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  sheetText: {
    color: '#77766f',
    fontSize: 13,
    lineHeight: 21,
    fontFamily: fontFamilies.regular,
  },
});
