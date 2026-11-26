import { useState, type ReactNode } from 'react';
import {
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { Check, Crown, Share2, Users } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useHousehold } from '@/auth/HouseholdContext';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@/store/NavigationContext';
import { useToast } from '@/store/ToastContext';

const COLORS = {
  green: '#3b742f',
  greenLight: '#e8f0e2',
  cream: '#f5e6ce',
  text: '#4e4d4d',
  muted: '#77766f',
  white: '#ffffff',
  border: '#e8e1d5',
  danger: '#c0392b',
  dangerLight: '#fbe9e7',
};

export function HouseholdMembersScreen() {
  const { householdId } = useHousehold();
  const {
    members,
    ownerId,
    isOwner,
    loading,
    error: membersError,
    refresh,
  } = useHouseholdMembers();
  const { goBack } = useNavigation();
  const { showToast } = useToast();

  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<
    'owner' | 'invite' | 'email' | null
  >(null);

  const ownerName =
    members.find((member) => member.userId === ownerId)?.displayName ?? null;

  async function handleSelectOwner() {
    if (!householdId || !selectedOwnerId || busyAction) return;

    setBusyAction('owner');
    setActionError(null);

    try {
      const { data, error } = await supabase.rpc('set_household_owner', {
        p_household_id: householdId,
        p_owner_user_id: selectedOwnerId,
      });

      if (error) throw error;

      await refresh();
      setSelectedOwnerId(null);

      if (data === selectedOwnerId) {
        showToast('Ustawiono właściciela gospodarstwa');
      } else {
        setActionError('Właściciel został już wybrany przez inną osobę.');
      }
    } catch (requestError) {
      console.error('Nie udało się ustawić właściciela:', requestError);
      setActionError('Nie udało się ustawić właściciela. Spróbuj ponownie.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateInviteCode() {
    if (!householdId || busyAction) return;

    setBusyAction('invite');
    setActionError(null);
    setInviteCode(null);

    try {
      const { data, error } = await supabase.rpc(
        'create_household_invite_code',
        { p_household_id: householdId },
      );

      if (error) throw error;
      if (typeof data !== 'string' || !data) {
        throw new Error('Nie otrzymano kodu zaproszenia.');
      }

      setInviteCode(data);
    } catch (requestError) {
      console.error('Nie udało się utworzyć kodu zaproszenia:', requestError);
      setActionError('Nie udało się utworzyć zaproszenia. Spróbuj ponownie.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleShareInviteCode() {
    if (!inviteCode) return;

    try {
      await Share.share(
        {
          message: `Dołącz do naszego gospodarstwa w EcoMeans. W aplikacji wybierz „Dołączam do istniejącego” i wpisz kod: ${inviteCode}. Kod jest jednorazowy i ważny 7 dni.`,
        },
        { dialogTitle: 'Zaproś domownika' },
      );
    } catch (shareError) {
      console.error('Nie udało się udostępnić kodu zaproszenia:', shareError);
      setActionError('Nie udało się otworzyć udostępniania kodu.');
    }
  }

  async function handleSendEmailInvite() {
    const email = inviteEmail.trim().toLowerCase();

    if (!householdId || !email || busyAction) return;

    setBusyAction('email');
    setActionError(null);

    try {
      const { error } = await supabase.functions.invoke(
        'send-household-invite',
        { body: { email, householdId } },
      );

      if (error) throw error;

      setInviteEmail('');
      showToast('Wysłano zaproszenie e-mailem');
    } catch (requestError) {
      console.error('Nie udało się wysłać zaproszenia e-mailem:', requestError);
      setActionError(
        'Nie udało się wysłać e-maila. Sprawdź konfigurację SMTP w Supabase. Jeśli ta osoba ma już konto EcoMeans, udostępnij jej kod.',
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <>
      <ScreenHeader title="Domownicy" onBack={goBack} />

      <View style={styles.container}>
        <View style={styles.introCard}>
          <Users size={22} color={COLORS.green} />
          <AppText style={styles.introText}>
            Domownicy widzą wspólny plan i mogą oznaczać zadania jako
            wykonane. Przypisaniami zarządza właściciel gospodarstwa.
          </AppText>
        </View>

        {membersError ? (
          <View style={styles.errorCard}>
            <AppText style={styles.errorText}>{membersError}</AppText>
            <ActionButton
              label="Spróbuj ponownie"
              onPress={() => void refresh()}
              disabled={loading}
            />
          </View>
        ) : loading ? (
          <View style={styles.card}>
            <AppText style={styles.mutedText}>Ładowanie domowników...</AppText>
          </View>
        ) : (
          <View style={styles.card}>
            <AppText style={styles.sectionTitle}>
              Domownicy ({members.length})
            </AppText>

            {members.map((member) => {
              const isSelected = selectedOwnerId === member.userId;
              const isMemberOwner = ownerId === member.userId;

              return (
                <Pressable
                  key={member.userId}
                  onPress={() => {
                    if (!ownerId) setSelectedOwnerId(member.userId);
                  }}
                  disabled={Boolean(ownerId) || busyAction !== null}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isMemberOwner || isSelected,
                    disabled: Boolean(ownerId) || busyAction !== null,
                  }}
                  style={({ pressed }) => [
                    styles.memberRow,
                    pressed && !ownerId && styles.pressed,
                  ]}
                >
                  <View style={styles.memberInfo}>
                    <AppText style={styles.memberName}>
                      {member.displayName}
                    </AppText>
                    {isMemberOwner ? (
                      <AppText style={styles.ownerLabel}>Właściciel</AppText>
                    ) : null}
                  </View>

                  {isMemberOwner ? (
                    <Crown size={18} color={COLORS.green} />
                  ) : isSelected ? (
                    <Check size={18} color={COLORS.green} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {!loading && !membersError && !ownerId ? (
          <View style={styles.card}>
            <AppText style={styles.sectionTitle}>
              Wybierzcie właściciela
            </AppText>
            <AppText style={styles.bodyText}>
              To istniejące gospodarstwo nie ma jeszcze zapisanego
              właściciela. Wybór jest jednorazowy i może go dokonać każdy
              domownik.
            </AppText>
            {selectedOwnerId ? (
              <ActionButton
                label={
                  busyAction === 'owner'
                    ? 'Zapisywanie...'
                    : 'Ustaw wybraną osobę jako właściciela'
                }
                onPress={() => void handleSelectOwner()}
                disabled={busyAction !== null}
              />
            ) : null}
          </View>
        ) : null}

        {isOwner ? (
          <View style={styles.card}>
            <AppText style={styles.sectionTitle}>Zaproszenie</AppText>
            <AppText style={styles.bodyText}>
              Utwórz jednorazowy kod dla kolejnego domownika. Kod wygaśnie po
              7 dniach.
            </AppText>

            {inviteCode ? (
              <View style={styles.inviteCodeBox}>
                <AppText style={styles.inviteCode} selectable>
                  {inviteCode}
                </AppText>
                <ActionButton
                  label="Udostępnij kod"
                  onPress={() => void handleShareInviteCode()}
                  icon={<Share2 size={17} color={COLORS.white} />}
                />
              </View>
            ) : null}

            <ActionButton
              label={
                busyAction === 'invite'
                  ? 'Tworzenie kodu...'
                  : 'Utwórz kod zaproszenia'
              }
              onPress={() => void handleCreateInviteCode()}
              disabled={busyAction !== null}
            />

            <View style={styles.inviteDivider} />
            <AppText style={styles.sectionTitle}>Lub wyślij e-mail</AppText>
            <AppText style={styles.bodyText}>
              Osoba otrzyma link, po którego otwarciu konto zostanie dołączone
              do gospodarstwa. Działa dla nowych kont EcoMeans.
            </AppText>
            <AppTextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              maxLength={254}
              editable={busyAction === null}
              placeholder="Adres e-mail domownika"
              placeholderTextColor="#999184"
              style={styles.emailInput}
            />
            <ActionButton
              label={
                busyAction === 'email'
                  ? 'Wysyłanie...'
                  : 'Wyślij zaproszenie e-mailem'
              }
              onPress={() => void handleSendEmailInvite()}
              disabled={busyAction !== null || !inviteEmail.trim()}
            />
          </View>
        ) : ownerName ? (
          <View style={styles.ownerInfoCard}>
            <Crown size={18} color={COLORS.green} />
            <AppText style={styles.ownerInfoText}>
              Właścicielem jest {ownerName}. Tylko ta osoba może zapraszać
              domowników i zmieniać przypisania zadań.
            </AppText>
          </View>
        ) : null}

        {actionError ? (
          <View style={styles.errorCard}>
            <AppText style={styles.errorText}>{actionError}</AppText>
          </View>
        ) : null}
      </View>
    </>
  );
}

function ActionButton({
  label,
  onPress,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.actionButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon}
      <AppText style={styles.actionButtonText}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 16,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.greenLight,
  },
  introText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    gap: 14,
    elevation: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontFamily: 'SenBold',
  },
  bodyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  memberRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'SenBold',
  },
  ownerLabel: {
    color: COLORS.green,
    fontSize: 12,
    fontFamily: 'SenBold',
  },
  ownerInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
  },
  ownerInfoText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  inviteCodeBox: {
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
  },
  inviteDivider: {
    height: 1,
    marginVertical: 4,
    backgroundColor: COLORS.border,
  },
  emailInput: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'Sen',
    backgroundColor: COLORS.white,
  },
  inviteCode: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: 'SenBold',
    textAlign: 'center',
  },
  actionButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: COLORS.green,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: 'SenBold',
    textAlign: 'center',
  },
  errorCard: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.dangerLight,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
});
