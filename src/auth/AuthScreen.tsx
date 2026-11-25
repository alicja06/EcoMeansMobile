
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

interface AuthScreenProps {
  onAuthenticated: () => void;
  onBack: () => void;
}

export function AuthScreen({ onAuthenticated, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Wypełnij adres e-mail i hasło.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          onAuthenticated();
        } else {
          setMessage(
            'Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail i potwierdź adres.',
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        onAuthenticated();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Wystąpił błąd. Spróbuj ponownie.',
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError('');
    setMessage('');
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
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>← Wróć</Text>
            </Pressable>

            <View style={styles.header}>
              <Image
                source={require('../../assets/images/logo-ecomeans-zielone.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="EcoMeans"
              />

              <Text style={styles.heading}>
                {mode === 'login' ? 'Witaj ponownie!' : 'Dołącz do EcoMeans'}
              </Text>

              <Text style={styles.subtitle}>
                {mode === 'login'
                  ? 'Zaloguj się do swojego domu.'
                  : 'Utwórz konto i zadbaj o dom po swojemu.'}
              </Text>
            </View>

            <View style={styles.tabs}>
              <Pressable
                onPress={() => changeMode('login')}
                style={[
                  styles.tab,
                  mode === 'login' && styles.activeTab,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === 'login' && styles.activeTabText,
                  ]}
                >
                  Logowanie
                </Text>
              </Pressable>

              <Pressable
                onPress={() => changeMode('register')}
                style={[
                  styles.tab,
                  mode === 'register' && styles.activeTab,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === 'register' && styles.activeTabText,
                  ]}
                >
                  Rejestracja
                </Text>
              </Pressable>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Adres e-mail</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!loading}
                  placeholder="np. imie@email.com"
                  placeholderTextColor="#999184"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Hasło</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  textContentType={
                    mode === 'login' ? 'password' : 'newPassword'
                  }
                  editable={!loading}
                  placeholder="Minimum 6 znaków"
                  placeholderTextColor="#999184"
                  style={styles.input}
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {message ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{message}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && !loading && styles.submitButtonPressed,
                  loading && styles.disabledButton,
                ]}
              >
                <Text style={styles.submitButtonText}>
                  {loading
                    ? 'Chwileczkę...'
                    : mode === 'login'
                      ? 'Zaloguj się'
                      : 'Utwórz konto'}
                </Text>
              </Pressable>
            </View>
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
    paddingVertical: 28,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 30,
    paddingVertical: 8,
  },
  backText: {
    color: '#3b742f',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sen',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 176,
    height: 90,
    marginBottom: 20,
  },
  heading: {
    color: '#3b742f',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Sen',
  },
  subtitle: {
    color: '#4e4d4d',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Sen',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#3b742f',
  },
  tabText: {
    color: '#4e4d4d',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Sen',
  },
  activeTabText: {
    color: '#ffffff',
  },
  form: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 24,
    padding: 22,
    gap: 18,
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
  messageBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
  },
  messageText: {
    color: '#166534',
    fontSize: 13,
    fontFamily: 'Sen',
  },
  submitButton: {
    backgroundColor: '#3b742f',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    backgroundColor: '#315f27',
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Sen',
  },
});
