
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthScreen } from '@/auth/AuthScreen';
import { HouseholdChoiceScreen } from '@/auth/HouseholdChoiceScreen';
import { useAuth } from '@/auth/AuthContext';
import { useHousehold } from '@/auth/HouseholdContext';
import { WelcomeScreen } from '@/screens/welcome/WelcomeScreen';
import { useNavigation } from '@/store/NavigationContext';

export default function HomeScreen() {
  const {
    session,
    loading: authLoading,
    signOut,
  } = useAuth();

  const {
    householdId,
    onboardingComplete,
    loading: householdLoading,
    refreshHousehold,
  } = useHousehold();

  const { isEditingPlan } = useNavigation();

  const [showWelcome, setShowWelcome] = useState(true);
  const [logoutError, setLogoutError] = useState('');

  async function handleSignOut() {
    setLogoutError('');

    try {
      await signOut();
      setShowWelcome(true);
    } catch (err) {
      setLogoutError(
        err instanceof Error
          ? err.message
          : 'Nie udało się wylogować. Spróbuj ponownie.',
      );
    }
  }

  if (authLoading || (session && householdLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b742f" />
        <Text style={styles.loadingText}>Ładowanie EcoMeans...</Text>
      </View>
    );
  }

  if (!session) {
    if (showWelcome) {
      return (
        <WelcomeScreen onStart={() => setShowWelcome(false)} />
      );
    }

    return (
      <AuthScreen
        onAuthenticated={() => setShowWelcome(false)}
        onBack={() => setShowWelcome(true)}
      />
    );
  }

  if (!householdId) {
    return (
      <HouseholdChoiceScreen
        onHouseholdCreated={async () => {
          await refreshHousehold();
        }}
        onHouseholdJoined={async () => {
          await refreshHousehold();
        }}
      />
    );
  }

  if (!onboardingComplete || isEditingPlan) {
    return (
      <PlaceholderScreen
        message="Przygotowujemy konfigurację Twojego domu."
        onSignOut={handleSignOut}
        error={logoutError}
      />
    );
  }

  return (
    <PlaceholderScreen
      message="Ekran główny EcoMeans zostanie podłączony w kolejnym etapie."
      onSignOut={handleSignOut}
      error={logoutError}
    />
  );
}

function PlaceholderScreen({
  message,
  onSignOut,
  error,
}: {
  message: string;
  onSignOut: () => void;
  error: string;
}) {
  return (
    <SafeAreaView style={styles.placeholder}>
      <Text style={styles.logo}>EcoMeans</Text>

      <Text style={styles.message}>{message}</Text>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <Pressable
        onPress={onSignOut}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
      >
        <Text style={styles.backButtonText}>
          Wróć do ekranu startowego
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5e6ce',
    gap: 14,
  },
  loadingText: {
    color: '#4e4d4d',
    fontSize: 16,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#f5e6ce',
  },
  logo: {
    color: '#3b742f',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 18,
  },
  message: {
    color: '#4e4d4d',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  backButton: {
    marginTop: 32,
    backgroundColor: '#3b742f',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonPressed: {
    backgroundColor: '#315f27',
    transform: [{ scale: 0.98 }],
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Sen',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
});
