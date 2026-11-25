
import { useState } from 'react';
import {
  ActivityIndicator,
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
  const { session, loading: authLoading } = useAuth();

  const {
    householdId,
    onboardingComplete,
    loading: householdLoading,
    refreshHousehold,
  } = useHousehold();

  const { isEditingPlan } = useNavigation();

  const [showWelcome, setShowWelcome] = useState(true);

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

  // Ekrany onboardingu i aplikacji głównej
  // zostaną podłączone po adaptacji do React Native.
  if (!onboardingComplete || isEditingPlan) {
    return (
      <PlaceholderScreen
        message="Przygotowujemy konfigurację Twojego domu."
      />
    );
  }

  return (
    <PlaceholderScreen
      message="Ekran główny EcoMeans zostanie podłączony w kolejnym etapie."
    />
  );
}

function PlaceholderScreen({ message }: { message: string }) {
  return (
    <SafeAreaView style={styles.placeholder}>
      <Text style={styles.logo}>EcoMeans</Text>
      <Text style={styles.message}>{message}</Text>
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
});
