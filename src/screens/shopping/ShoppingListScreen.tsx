
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Check,
  Plus,
  ShoppingBasket,
  Trash2,
} from 'lucide-react-native';

import { PRODUCTS } from '@/data/products';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';

export function ShoppingListScreen() {
  const {
    state,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    clearBoughtShoppingItems,
  } = useAppStore();

  const { goBack, navigate } = useNavigation();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);

  const toBuy = state.shoppingItems.filter((item) => !item.bought);
  const bought = state.shoppingItems.filter((item) => item.bought);

  const submit = () => {
    const trimmed = name.trim();

    if (!trimmed) return;

    addShoppingItem(trimmed, null);
    setName('');
    showToast('Dodano do listy');
  };

  const renderItem = (
    id: string,
    label: string,
    isBought: boolean,
    productId: string | null,
  ) => (
    <View key={id} style={styles.shoppingItem}>
      <Pressable
        onPress={() => toggleShoppingItem(id)}
        accessibilityRole="checkbox"
        accessibilityLabel={
          isBought
            ? `Oznacz jako do kupienia: ${label}`
            : `Oznacz jako kupione: ${label}`
        }
        accessibilityState={{ checked: isBought }}
        style={({ pressed }) => [
          styles.checkButton,
          isBought
            ? styles.checkButtonActive
            : styles.checkButtonInactive,
          pressed && styles.pressed,
        ]}
      >
        {isBought && (
          <Check size={15} color="#ffffff" strokeWidth={3} />
        )}
      </Pressable>

      <View style={styles.itemContent}>
        <Pressable
          disabled={!productId}
          onPress={() => {
            if (productId) {
              navigate({ name: 'product', productId });
            }
          }}
          accessibilityRole={productId ? 'link' : undefined}
          accessibilityLabel={productId ? `Zobacz produkt: ${label}` : label}
          style={styles.itemTitleButton}
        >
          <AppText

            style={[
              styles.itemTitle,
              isBought && styles.itemTitleBought,
            ]}
          >
            {label}
          </AppText>
        </Pressable>

        {productId && (
          <AppText style={styles.productBrand}>
            EcoMeans
          </AppText>
        )}
      </View>

      <Pressable
        onPress={() => removeShoppingItem(id)}
        accessibilityRole="button"
        accessibilityLabel={`Usuń: ${label}`}
        hitSlop={8}
        style={({ pressed }) => [
          styles.removeButton,
          pressed && styles.pressed,
        ]}
      >
        <Trash2 size={18} color="#99968F" />
      </Pressable>
    </View>
  );

  return (
    <>
      <ScreenHeader
        title="Lista zakupów"
        subtitle={`Do kupienia: ${toBuy.length}`}
        onBack={goBack}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.addRow}>
          <AppTextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={submit}
            returnKeyType="done"
            placeholder="Dodaj własną pozycję"
            placeholderTextColor="#99968F"
            accessibilityLabel="Nazwa produktu"
            style={styles.nameInput}
          />

          <Pressable
            onPress={submit}
            disabled={!name.trim()}
            accessibilityRole="button"
            accessibilityLabel="Dodaj pozycję"
            style={({ pressed }) => [
              styles.addButton,
              !name.trim() && styles.addButtonDisabled,
              pressed && name.trim() && styles.pressed,
            ]}
          >
            <Plus size={20} color="#ffffff" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setCatalogOpen(true)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.catalogButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={styles.catalogButtonText}>
            Dodaj produkt z katalogu EcoMeans
          </AppText>
        </Pressable>

        {state.shoppingItems.length === 0 ? (
          <View style={styles.emptyState}>
            <EmptyState
              icon={ShoppingBasket}
              title="Lista jest pusta"
              text="Dodaj własną pozycję albo produkt z katalogu EcoMeans."
            />
          </View>
        ) : (
          <>
            <AppText style={styles.sectionTitle}>
              Do kupienia
            </AppText>

            <View style={styles.itemList}>
              {toBuy.map((item) =>
                renderItem(
                  item.id,
                  item.name,
                  false,
                  item.productId,
                ),
              )}

              {toBuy.length === 0 && (
                <AppText style={styles.emptyListText}>
                  Wszystko kupione.
                </AppText>
              )}
            </View>

            {bought.length > 0 && (
              <>
                <View style={styles.boughtHeader}>
                  <AppText style={styles.sectionTitle}>
                    Kupione
                  </AppText>

                  <Pressable
                    onPress={() => {
                      clearBoughtShoppingItems();
                      showToast('Usunięto kupione pozycje');
                    }}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.clearButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText style={styles.clearButtonText}>
                      Wyczyść kupione
                    </AppText>
                  </Pressable>
                </View>

                <View style={styles.itemList}>
                  {bought.map((item) =>
                    renderItem(
                      item.id,
                      item.name,
                      true,
                      item.productId,
                    ),
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {catalogOpen && (
        <Sheet
          title="Katalog EcoMeans"
          onClose={() => setCatalogOpen(false)}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.catalogList}>
              {PRODUCTS.map((product) => {
                const onList = state.shoppingItems.some(
                  (item) =>
                    item.productId === product.id && !item.bought,
                );

                return (
                  <View key={product.id} style={styles.catalogItem}>
                    <View style={styles.catalogProductName}>
                      <AppText style={styles.catalogProductText}>
                        {product.name}
                      </AppText>
                    </View>

                    <Pressable
                      disabled={onList}
                      onPress={() => {
                        addShoppingItem(product.name, product.id);
                        showToast('Dodano do listy');
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: onList }}
                      style={({ pressed }) => [
                        styles.catalogAddButton,
                        onList && styles.catalogAddButtonDisabled,
                        pressed && !onList && styles.pressed,
                      ]}
                    >
                      <AppText

                        style={[
                          styles.catalogAddButtonText,
                          onList && styles.catalogAddButtonTextDisabled,
                        ]}
                      >
                        {onList ? 'Na liście' : 'Dodaj'}
                      </AppText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </Sheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5e6ce',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
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
  addButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#3b742f',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  catalogButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#c9dcbf',
    borderRadius: 16,
    backgroundColor: '#edf4e9',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  catalogButtonText: {
    color: '#3b742f',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    marginTop: 24,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    color: '#4e4d4d',
    fontSize: 14,
  },
  itemList: {
    gap: 10,
  },
  shoppingItem: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 14,
    elevation: 1,
  },
  checkButton: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 14,
  },
  checkButtonActive: {
    borderColor: '#3b742f',
    backgroundColor: '#3b742f',
  },
  checkButtonInactive: {
    borderColor: '#b8b6af',
    backgroundColor: '#ffffff',
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitleButton: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  itemTitle: {
    color: '#4e4d4d',
    fontSize: 14,
  },
  itemTitleBought: {
    color: '#99968F',
    textDecorationLine: 'line-through',
  },
  productBrand: {
    marginTop: 2,
    color: '#3b742f',
    fontSize: 12,
  },
  removeButton: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  emptyListText: {
    color: '#77766f',
    fontSize: 13,
    paddingVertical: 8,
  },
  boughtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  clearButtonText: {
    color: '#3b742f',
    fontSize: 13,
  },
  catalogList: {
    gap: 10,
    paddingBottom: 16,
  },
  catalogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 14,
    elevation: 1,
  },
  catalogProductName: {
    flex: 1,
    minWidth: 0,
  },
  catalogProductText: {
    color: '#4e4d4d',
    fontSize: 14,
  },
  catalogAddButton: {
    flexShrink: 0,
    borderRadius: 24,
    backgroundColor: '#3b742f',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  catalogAddButtonDisabled: {
    backgroundColor: '#e0e1e6',
  },
  catalogAddButtonText: {
    color: '#ffffff',
    fontSize: 13,
  },
  catalogAddButtonTextDisabled: {
    color: '#77766f',
  },
  pressed: {
    opacity: 0.7,
  },
});
