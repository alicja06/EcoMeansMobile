import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from '@/components/ui/AppText';

import { AuthScreen } from '@/auth/AuthScreen';
import { HouseholdChoiceScreen } from '@/auth/HouseholdChoiceScreen';
import { useAuth } from '@/auth/AuthContext';
import { useHousehold } from '@/auth/HouseholdContext';

import { WelcomeScreen } from '@/screens/welcome/WelcomeScreen';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';

import { ScreenRouter } from '@/components/layout/ScreenRouter';
import { BottomNav } from '@/components/layout/BottomNav';
import { useNavigation } from '@/store/NavigationContext';

export default function HomeScreen() {
  const {
    session,
    loading: authLoading,
  } = useAuth();

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
        <AppText style={styles.loadingText}>
          Ładowanie EcoMeans...
        </AppText>
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
    return <OnboardingScreen />;
  }

  return (
    <View style={styles.app}>
      <View style={styles.content}>
        <ScreenRouter />
      </View>

      <BottomNav />
    </View>
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
  app: {
    flex: 1,
    backgroundColor: '#f5e6ce',
  },
  content: {
    flex: 1,
  },
});