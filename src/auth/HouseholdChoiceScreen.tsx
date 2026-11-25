
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

              <Text style={styles.heading}>
                Zacznijmy od Twojego domu
              </Text>

              <Text style={styles.subtitle}>
                Wybierz, jak chcesz korzystać z EcoMeans.
              </Text>
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
                  <Text style={styles.optionEmoji}>🏡</Text>
                  <Text style={styles.createTitle}>
                    Tworzę własny plan
                  </Text>
                  <Text style={styles.createDescription}>
                    Utwórz gospodarstwo i przygotuj plan sprzątania swojego
                    domu.
                  </Text>
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
                  <Text style={styles.optionEmoji}>🤝</Text>
                  <Text style={styles.joinTitle}>
                    Dołączam do istniejącego
                  </Text>
                  <Text style={styles.joinDescription}>
                    Masz zaproszenie? Dołącz do gospodarstwa i wspólnego planu.
                  </Text>
                </Pressable>
              </View>
            )}

            {mode === 'create' && (
              <View style={styles.form}>
                <Text style={styles.formHeading}>
                  Twój dom, Twój plan
                </Text>

                <Text style={styles.formDescription}>
                  Nadaj nazwę swojemu gospodarstwu. Później przejdziesz do
                  konfiguracji domu i planu sprzątania.
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Nazwa gospodarstwa</Text>
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
                    <Text style={styles.errorText}>{error}</Text>
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
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Tworzenie...' : 'Utwórz gospodarstwo'}
                  </Text>
                </Pressable>

                <Pressable onPress={goToChoice} style={styles.backButton}>
                  <Text style={styles.backText}>← Wróć do wyboru</Text>
                </Pressable>
              </View>
            )}

            {mode === 'join' && (
              <View style={styles.form}>
                <Text style={styles.formHeading}>Dołącz do domu</Text>

                <Text style={styles.formDescription}>
                  Wklej kod zaproszenia otrzymany od osoby, która utworzyła
                  gospodarstwo.
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Kod zaproszenia</Text>
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
                    <Text style={styles.errorText}>{error}</Text>
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
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Dołączanie...' : 'Dołącz do gospodarstwa'}
                  </Text>
                </Pressable>

                <Pressable onPress={goToChoice} style={styles.backButton}>
                  <Text style={styles.backText}>← Wróć do wyboru</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.footer}>
              Wspólny dom, wspólny plan, mniej codziennego chaosu.
            </Text>
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
    fontFamily: 'Sen',
  },
  subtitle: {
    color: '#4e4d4d',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Sen',
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
    fontWeight: '700',
    fontFamily: 'Sen',
  },
  createDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    fontFamily: 'Sen',
  },
  joinTitle: {
    color: '#3b742f',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Sen',
  },
  joinDescription: {
    color: '#4e4d4d',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    fontFamily: 'Sen',
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
    fontFamily: 'Sen',
  },
  formDescription: {
    color: '#4e4d4d',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Sen',
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#4e4d4d',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sen',
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
    fontFamily: 'Sen',
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
    fontWeight: '700',
    fontFamily: 'Sen',
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
    fontWeight: '600',
    fontFamily: 'Sen',
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
    fontFamily: 'Sen',
  },
});
