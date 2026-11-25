import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { AuthProvider } from '@/auth/AuthContext';
import { HouseholdProvider } from '@/auth/HouseholdContext';
import { AppStoreProvider } from '@/store/AppStoreContext';
import { NavigationProvider } from '@/store/NavigationContext';
import { ToastProvider } from '@/store/ToastContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CaveatBrush: require('../../assets/fonts/CaveatBrush-Regular.ttf'),
    Sen: require('../../assets/fonts/Sen-Regular.ttf'),
    SenMedium: require('../../assets/fonts/Sen-Medium.ttf'),
    SenBold: require('../../assets/fonts/Sen-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <HouseholdProvider>
        <AppStoreProvider>
          <NavigationProvider>
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </ToastProvider>
          </NavigationProvider>
        </AppStoreProvider>
      </HouseholdProvider>
    </AuthProvider>
  );
}
