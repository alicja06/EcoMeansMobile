import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { AppText } from '@/components/ui/AppText';
import {
  Bell,
  ChevronRight,
  Info,
  Shield,
  Trash2,
  User,
} from 'lucide-react-native';

import { dayPartsLabel, timeBudgetLabel } from '@/data/home';
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
  const { state, updateProfile, resetState } = useAppStore();
  const { navigate, startPlanEditing } = useNavigation();
  const { showToast } = useToast();

  const [nameDraft, setNameDraft] = useState(state.profile.name);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

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

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }

    resetState();
    setConfirmReset(false);
    setAccountOpen(false);
    setNameDraft('');
    showToast('Dane prototypu zostały zresetowane');
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
            <TextInput
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

          <Pressable
            onPress={() => {
              setConfirmReset(false);
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
        onRequestClose={() => {
          setAccountOpen(false);
          setConfirmReset(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setAccountOpen(false);
              setConfirmReset(false);
            }}
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>
                Zarządzanie kontem
              </AppText>

              <Pressable
                onPress={() => {
                  setAccountOpen(false);
                  setConfirmReset(false);
                }}
                hitSlop={10}
              >
                <AppText style={styles.closeText}>Zamknij</AppText>
              </Pressable>
            </View>

            <AppText style={styles.modalDescription}>
              Konta użytkowników pojawią się w kolejnym etapie.
              Dane prototypu są obecnie powiązane z Twoim kontem
              i gospodarstwem domowym.
            </AppText>

            {confirmReset && (
              <AppText style={styles.warningText}>
                Czy na pewno chcesz zresetować dane prototypu?
                Tej operacji nie można cofnąć.
              </AppText>
            )}

            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [
                styles.resetButton,
                confirmReset && styles.resetButtonConfirm,
                pressed && styles.pressed,
              ]}
            >
              <Trash2 size={19} color={COLORS.danger} />

              <AppText style={styles.resetButtonText}>
                {confirmReset
                  ? 'Kliknij ponownie, aby potwierdzić'
                  : 'Resetuj dane prototypu'}
              </AppText>
            </Pressable>
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
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 18,
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
  resetButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 16,
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 12,
  },
  resetButtonConfirm: {
    backgroundColor: '#f5d2ce',
  },
  resetButtonText: {
    color: COLORS.danger,
    fontSize: 13,
    fontFamily: 'SenBold',
  },
});
