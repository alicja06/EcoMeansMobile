import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import {
  Bell,
  ChevronRight,
  Info,
  LogOut,
  Shield,
  Trash2,
  User,
  Users,
} from 'lucide-react-native';

import { useAuth } from '@/auth/AuthContext';
import { useHousehold } from '@/auth/HouseholdContext';
import { dayPartsLabel, timeBudgetLabel } from '@/data/home';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/AppStoreContext';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PRODUCTS } from '@/data/products';
import { TIPS } from '@/data/tips';

const COLORS = {
  green: '#3b742f',
  lightGreen: '#e8f0e2',
  cream: '#f5e6ce',
  text: '#4e4d4d',
  muted: '#77766f',
  white: '#ffffff',
  border: '#e8e1d5',
  danger: '#c0392b',
  dangerLight: '#fbe9e7',
};

export function ProfileScreen() {
  const { state, updateProfile } = useAppStore();
  const { navigate, resetTo, startPlanEditing } = useNavigation();
  const { signOut } = useAuth();
  const { householdId } = useHousehold();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [nameDraft, setNameDraft] = useState(state.profile.name);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [accountAction, setAccountAction] = useState<
    'signOut' | 'deleteAccount' | null
  >(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  const favorites = PRODUCTS.filter((product) =>
    state.favoriteProductIds.includes(product.id),
  );

  const savedTips = TIPS.filter((tip) =>
    state.savedTipIds.includes(tip.id),
  );

  const { notifications } = state.profile;

  const notificationOptions = [
    ['reminders', 'Przypomnienia o zadaniach'],
    ['dailySummary', 'Podsumowanie dnia'],
    ['newTips', 'Nowe porady'],
  ] as const;

  function handleSaveName() {
    updateProfile({ name: nameDraft.trim() });
    showToast('Zapisano imię');
  }

  function closeAccount() {
    if (accountAction) return;

    setAccountOpen(false);
    setConfirmDeleteAccount(false);
    setAccountError(null);
  }

  async function handleSignOut() {
    setAccountAction('signOut');
    setAccountError(null);

    try {
      await signOut();
      setAccountOpen(false);
      setAccountAction(null);
      resetTo({ name: 'home' });
    } catch (error) {
      console.error('Nie udało się wylogować:', error);
      setAccountAction(null);
      setAccountError('Nie udało się wylogować. Spróbuj ponownie.');
    }
  }

  async function handleDeleteAccount() {
    setAccountAction('deleteAccount');
    setAccountError(null);

    try {
      const { data, error } = await supabase.functions.invoke<{
        deleted: boolean;
      }>('delete-account');

      if (error) throw error;
      if (!data?.deleted) {
        throw new Error('Serwer nie potwierdził usunięcia konta.');
      }
    } catch (error) {
      console.error('Nie udało się usunąć konta:', error);
      setAccountAction(null);
      setAccountError(
        'Nie udało się usunąć konta. Sprawdź połączenie i spróbuj ponownie.',
      );
      return;
    }

    try {
      await signOut('local');
      setAccountOpen(false);
      setAccountAction(null);
      resetTo({ name: 'home' });
    } catch (error) {
      console.error(
        'Konto usunięto, ale nie udało się wyczyścić sesji:',
        error,
      );
      setAccountAction(null);
      setAccountError(
        'Konto zostało usunięte, ale nie udało się zakończyć sesji. Uruchom ponownie aplikację.',
      );
    }
  }

  return (
    <>
      <ScreenHeader title="Profil" />

      <View style={styles.content}>
        {/* Dane użytkownika */}
        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <User size={22} color={COLORS.green} />
            </View>

            <View style={styles.userInfo}>
              <AppText style={styles.eyebrow}>Twoje imię</AppText>
              <AppText style={styles.userName} numberOfLines={1}>
                {state.profile.name || 'Nie podano'}
              </AppText>
            </View>
          </View>

          <View style={styles.nameForm}>
            <AppTextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Wpisz imię"
              placeholderTextColor={COLORS.muted}
              style={styles.nameInput}
              accessibilityLabel="Imię"
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />

            <Pressable
              onPress={handleSaveName}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.saveButtonText}>Zapisz</AppText>
            </Pressable>
          </View>
        </View>

        {/* Harmonogram */}
        <View>
          <AppText style={styles.sectionTitle}>
            Twój harmonogram sprzątania
          </AppText>

          <View style={styles.card}>
            <AppText style={styles.description}>
              {timeBudgetLabel(state.home.timeBudget)} ·{' '}
              {dayPartsLabel(state.home.dayParts)}
            </AppText>

            <AppText style={styles.description}>
              Pomieszczenia: {state.home.places.length || 'brak'} ·
              {' '}Urządzenia: {state.home.appliances.length || 'brak'}
            </AppText>

            <Pressable
              onPress={startPlanEditing}
              style={({ pressed }) => [
                styles.editPlanButton,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.editPlanText}>Edytuj plan</AppText>
            </Pressable>
          </View>
        </View>

        {/* Powiadomienia */}
        <View>
          <AppText style={styles.sectionTitle}>Powiadomienia</AppText>

          <View style={styles.card}>
            {notificationOptions.map(([key, label]) => (
              <View key={key} style={styles.notificationRow}>
                <AppText style={styles.notificationLabel}>{label}</AppText>

                <Switch
                  value={notifications[key]}
                  onValueChange={(next) =>
                    updateProfile({
                      notifications: {
                        ...notifications,
                        [key]: next,
                      },
                    })
                  }
                  trackColor={{
                    false: '#d8d4cc',
                    true: COLORS.lightGreen,
                  }}
                  thumbColor={
                    notifications[key] ? COLORS.green : '#f4f3f0'
                  }
                />
              </View>
            ))}
          </View>

          <View style={styles.notice}>
            <Info size={17} color={COLORS.green} />
            <AppText style={styles.noticeText}>
              Powiadomienia są na razie ustawieniami poglądowymi.
              Nie są wysyłane.
            </AppText>
          </View>
        </View>

        {/* Ulubione produkty */}
        <View>
          <AppText style={styles.sectionTitle}>Ulubione produkty</AppText>

          {favorites.length === 0 ? (
            <AppText style={styles.emptyText}>
              Brak ulubionych produktów.
            </AppText>
          ) : (
            <View style={styles.listCard}>
              {favorites.map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() =>
                    navigate({
                      name: 'product',
                      productId: product.id,
                    })
                  }
                  style={({ pressed }) => [
                    styles.listItem,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.listItemText}>
                    {product.name}
                  </AppText>
                  <ChevronRight size={19} color={COLORS.muted} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Zapisane porady */}
        <View>
          <AppText style={styles.sectionTitle}>Zapisane porady</AppText>

          {savedTips.length === 0 ? (
            <AppText style={styles.emptyText}>
              Nie zapisano jeszcze żadnych porad.
            </AppText>
          ) : (
            <View style={styles.listCard}>
              {savedTips.map((tip) => (
                <Pressable
                  key={tip.id}
                  onPress={() =>
                    navigate({ name: 'tip', tipId: tip.id })
                  }
                  style={({ pressed }) => [
                    styles.listItem,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.listItemText}>
                    {tip.title}
                  </AppText>
                  <ChevronRight size={19} color={COLORS.muted} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Informacje i konto */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Info size={19} color={COLORS.muted} />
            <AppText style={styles.infoText}>
              EcoMeans, prototyp 0.1
            </AppText>
          </View>

          <Pressable
            onPress={() => navigate({ name: 'privacy' })}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.menuLabel}>
              <Shield size={19} color={COLORS.muted} />
              <AppText style={styles.infoText}>
                Polityka prywatności
              </AppText>
            </View>
            <ChevronRight size={19} color={COLORS.muted} />
          </Pressable>

          {householdId ? (
            <Pressable
              onPress={() => navigate({ name: 'household' })}
              style={({ pressed }) => [
                styles.menuRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.menuLabel}>
                <Users size={19} color={COLORS.muted} />
                <AppText style={styles.infoText}>
                  Domownicy i zaproszenia
                </AppText>
              </View>
              <ChevronRight size={19} color={COLORS.muted} />
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              setConfirmDeleteAccount(false);
              setAccountError(null);
              setAccountOpen(true);
            }}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.menuLabel}>
              <Bell size={19} color={COLORS.muted} />
              <AppText style={styles.infoText}>
                Zarządzanie kontem
              </AppText>
            </View>
            <ChevronRight size={19} color={COLORS.muted} />
          </Pressable>
        </View>
      </View>

      {/* Okno zarządzania kontem */}
      <Modal
        visible={accountOpen}
        transparent
        animationType="slide"
        onRequestClose={closeAccount}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeAccount}
            disabled={accountAction !== null}
          />

          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>
                Zarządzanie kontem
              </AppText>

              <Pressable
                onPress={closeAccount}
                disabled={accountAction !== null}
                hitSlop={10}
              >
                <AppText style={styles.closeText}>Zamknij</AppText>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <AppText style={styles.modalDescription}>
                Zarządzaj dostępem do swojego konta. Usunięcie konta jest
                trwałe i nie można go cofnąć.
              </AppText>

              {accountError && (
                <AppText style={styles.accountError}>
                  {accountError}
                </AppText>
              )}

              <View style={styles.accountActions}>
                <Pressable
                  onPress={() => void handleSignOut()}
                  disabled={accountAction !== null}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: accountAction !== null,
                  }}
                  style={({ pressed }) => [
                    styles.accountButton,
                    styles.signOutButton,
                    accountAction !== null && styles.disabledButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <LogOut size={18} color={COLORS.green} />
                  <AppText style={styles.signOutButtonText}>
                    {accountAction === 'signOut'
                      ? 'Wylogowywanie...'
                      : 'Wyloguj się'}
                  </AppText>
                </Pressable>

                {confirmDeleteAccount ? (
                  <>
                    <AppText style={styles.warningText}>
                      Usuniemy konto i profil. Gospodarstwo oraz jego dane
                      pozostaną dla pozostałych członków; jeśli jesteś
                      ostatnim członkiem, usuniemy również gospodarstwo
                      i powiązane dane.
                    </AppText>

                    <Pressable
                      onPress={() => void handleDeleteAccount()}
                      disabled={accountAction !== null}
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled: accountAction !== null,
                      }}
                      style={({ pressed }) => [
                        styles.accountButton,
                        styles.deleteButtonConfirm,
                        accountAction !== null && styles.disabledButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Trash2 size={18} color={COLORS.white} />
                      <AppText style={styles.deleteButtonConfirmText}>
                        {accountAction === 'deleteAccount'
                          ? 'Usuwanie konta...'
                          : 'Usuń konto trwale'}
                      </AppText>
                    </Pressable>

                    <Pressable
                      onPress={() => setConfirmDeleteAccount(false)}
                      disabled={accountAction !== null}
                      style={({ pressed }) => [
                        styles.cancelDeleteButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText style={styles.cancelDeleteButtonText}>
                        Anuluj
                      </AppText>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    onPress={() => {
                      setConfirmDeleteAccount(true);
                      setAccountError(null);
                    }}
                    disabled={accountAction !== null}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.accountButton,
                      styles.deleteButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Trash2 size={18} color={COLORS.danger} />
                    <AppText style={styles.deleteButtonText}>
                      Usuń konto
                    </AppText>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    elevation: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'SenBold',
  },
  userName: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: 'SenBold',
    marginTop: 2,
  },
  nameForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#f7f5f0',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'Sen',
  },
  saveButton: {
    backgroundColor: COLORS.green,
    borderRadius: 16,
    paddingHorizontal: 17,
    paddingVertical: 14,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontFamily: 'SenBold',
    marginBottom: 10,
  },
  description: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  editPlanButton: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  editPlanText: {
    color: COLORS.green,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 7,
  },
  notificationLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  noticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    paddingVertical: 8,
  },
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: 16,
    elevation: 1,
  },
  listItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece5',
  },
  listItemText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  menuRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContent: {
    maxHeight: '90%',
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    gap: 16,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalBody: {
    gap: 18,
    paddingBottom: 8,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#c9c0b2',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontFamily: 'SenBold',
  },
  closeText: {
    color: COLORS.green,
    fontSize: 13,
    fontFamily: 'SenBold',
  },
  modalDescription: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  warningText: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'SenBold',
  },
  accountError: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'SenBold',
  },
  accountActions: {
    gap: 10,
  },
  accountButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  signOutButton: {
    backgroundColor: COLORS.lightGreen,
  },
  signOutButtonText: {
    color: COLORS.green,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  deleteButton: {
    backgroundColor: COLORS.dangerLight,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  deleteButtonConfirm: {
    backgroundColor: COLORS.danger,
  },
  deleteButtonConfirmText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  cancelDeleteButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDeleteButtonText: {
    color: COLORS.muted,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
