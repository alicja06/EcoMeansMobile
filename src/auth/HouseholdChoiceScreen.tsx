
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/lib/supabase';

interface HouseholdChoiceScreenProps {
  onHouseholdCreated: (householdId: string) => void;
  onHouseholdJoined: (householdId: string) => void;
}

export function HouseholdChoiceScreen({
  onHouseholdCreated,
  onHouseholdJoined,
}: HouseholdChoiceScreenProps) {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [householdName, setHouseholdName] = useState('Moje gospodarstwo');
  const [invitationToken, setInvitationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('create_household', {
        household_name: householdName.trim() || 'Moje gospodarstwo',
      });

      if (error) throw error;

      if (!data) {
        throw new Error('Nie udało się utworzyć gospodarstwa.');
      }

      onHouseholdCreated(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się utworzyć gospodarstwa.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        'accept_household_invitation',
        {
          invitation_token: invitationToken.trim(),
        },
      );

      if (error) throw error;

      if (!data) {
        throw new Error(
          'Zaproszenie nie zwróciło identyfikatora gospodarstwa.',
        );
      }

      onHouseholdJoined(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się dołączyć do gospodarstwa.',
      );
    } finally {
      setLoading(false);
    }
  }

  function goToChoice() {
    setMode('choice');
    setError('');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Image
                source={require('../../assets/images/logo-ecomeans-zielone.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="EcoMeans"
              />

              <AppText style={styles.heading}>
                Zacznijmy od Twojego domu
              </AppText>

              <AppText style={styles.subtitle}>
                Wybierz, jak chcesz korzystać z EcoMeans.
              </AppText>
            </View>

            {mode === 'choice' && (
              <View style={styles.options}>
                <Pressable
                  onPress={() => {
                    setMode('create');
                    setError('');
                  }}
                  style={({ pressed }) => [
                    styles.createOption,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.optionEmoji}>🏡</AppText>

                  <AppText style={styles.createTitle}>
                    Tworzę własny plan
                  </AppText>

                  <AppText style={styles.createDescription}>
                    Utwórz gospodarstwo i przygotuj plan sprzątania swojego
                    domu.
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMode('join');
                    setError('');
                  }}
                  style={({ pressed }) => [
                    styles.joinOption,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.optionEmoji}>🤝</AppText>

                  <AppText style={styles.joinTitle}>
                    Dołączam do istniejącego
                  </AppText>

                  <AppText style={styles.joinDescription}>
                    Masz zaproszenie? Dołącz do gospodarstwa i wspólnego planu.
                  </AppText>
                </Pressable>
              </View>
            )}

            {mode === 'create' && (
              <View style={styles.form}>
                <AppText style={styles.formHeading}>
                  Twój dom, Twój plan
                </AppText>

                <AppText style={styles.formDescription}>
                  Nadaj nazwę swojemu gospodarstwu. Później przejdziesz do
                  konfiguracji domu i planu sprzątania.
                </AppText>

                <View style={styles.field}>
                  <AppText style={styles.label}>
                    Nazwa gospodarstwa
                  </AppText>

                  <TextInput
                    value={householdName}
                    onChangeText={setHouseholdName}
                    maxLength={80}
                    editable={!loading}
                    placeholder="np. Nasz dom"
                    placeholderTextColor="#999184"
                    style={styles.input}
                  />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <AppText style={styles.errorText}>{error}</AppText>
                  </View>
                ) : null}

                <Pressable
                  onPress={handleCreate}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !loading && styles.pressedButton,
                    loading && styles.disabledButton,
                  ]}
                >
                  <AppText style={styles.submitButtonText}>
                    {loading ? 'Tworzenie...' : 'Utwórz gospodarstwo'}
                  </AppText>
                </Pressable>

                <Pressable onPress={goToChoice} style={styles.backButton}>
                  <AppText style={styles.backText}>
                    ← Wróć do wyboru
                  </AppText>
                </Pressable>
              </View>
            )}

            {mode === 'join' && (
              <View style={styles.form}>
                <AppText style={styles.formHeading}>
                  Dołącz do domu
                </AppText>

                <AppText style={styles.formDescription}>
                  Wklej kod zaproszenia otrzymany od osoby, która utworzyła
                  gospodarstwo.
                </AppText>

                <View style={styles.field}>
                  <AppText style={styles.label}>
                    Kod zaproszenia
                  </AppText>

                  <TextInput
                    value={invitationToken}
                    onChangeText={setInvitationToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    placeholder="Wklej kod zaproszenia"
                    placeholderTextColor="#999184"
                    style={styles.input}
                  />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <AppText style={styles.errorText}>{error}</AppText>
                  </View>
                ) : null}

                <Pressable
                  onPress={handleJoin}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !loading && styles.pressedButton,
                    loading && styles.disabledButton,
                  ]}
                >
                  <AppText style={styles.submitButtonText}>
                    {loading ? 'Dołączanie...' : 'Dołącz do gospodarstwa'}
                  </AppText>
                </Pressable>

                <Pressable onPress={goToChoice} style={styles.backButton}>
                  <AppText style={styles.backText}>
                    ← Wróć do wyboru
                  </AppText>
                </Pressable>
              </View>
            )}

            <AppText style={styles.footer}>
              Wspólny dom, wspólny plan, mniej codziennego chaosu.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5e6ce',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 160,
    height: 90,
    marginBottom: 20,
  },
  heading: {
    color: '#3b742f',
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#4e4d4d',
    fontSize: 15,
    textAlign: 'center',
  },
  options: {
    gap: 16,
  },
  createOption: {
    backgroundColor: '#3b742f',
    borderRadius: 24,
    padding: 24,
  },
  joinOption: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 2,
    borderColor: 'rgba(59,116,47,0.3)',
    borderRadius: 24,
    padding: 24,
  },
  optionEmoji: {
    fontSize: 27,
    marginBottom: 12,
  },
  createTitle: {
    color: '#ffffff',
    fontSize: 20,
  },
  createDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
  joinTitle: {
    color: '#3b742f',
    fontSize: 20,
  },
  joinDescription: {
    color: '#4e4d4d',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
  form: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 24,
    padding: 22,
    gap: 18,
  },
  formHeading: {
    color: '#3b742f',
    fontSize: 27,
  },
  formDescription: {
    color: '#4e4d4d',
    fontSize: 14,
    lineHeight: 21,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#4e4d4d',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9d0bd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: '#4e4d4d',
    fontSize: 15,
    fontFamily: 'Sen',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#3b742f',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
  },
  pressedButton: {
    backgroundColor: '#315f27',
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.6,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backText: {
    color: '#3b742f',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    color: '#4e4d4d',
    opacity: 0.65,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
  },
});
