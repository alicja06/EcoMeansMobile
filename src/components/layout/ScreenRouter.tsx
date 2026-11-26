import { ScrollView, View, StyleSheet } from 'react-native';

import { useNavigation } from '@/store/NavigationContext';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { RoomsScreen } from '@/screens/rooms/RoomsScreen';
import { RoomDetailScreen } from '@/screens/rooms/RoomDetailScreen';
import { ProductsScreen } from '@/screens/products/ProductsScreen';
import { ProductDetailScreen } from '@/screens/products/ProductDetailScreen';
import { CalculatorsScreen } from '@/screens/calculators/CalculatorsScreen';
import { TipsScreen } from '@/screens/tips/TipsScreen';
import { TipDetailScreen } from '@/screens/tips/TipDetailScreen';
import { ShoppingListScreen } from '@/screens/shopping/ShoppingListScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { PrivacyScreen } from '@/screens/profile/PrivacyScreen';
import { WeekPlanScreen } from '@/screens/plan/WeekPlanScreen';
import type { Route } from '@/types';

function renderRoute(route: Route) {
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'rooms':
      return <RoomsScreen />;
    case 'room':
      return <RoomDetailScreen roomId={route.roomId} />;
    case 'products':
      return <ProductsScreen />;
    case 'product':
      return <ProductDetailScreen productId={route.productId} />;
    case 'calculators':
      return <CalculatorsScreen />;
    case 'tips':
      return <TipsScreen />;
    case 'tip':
      return <TipDetailScreen tipId={route.tipId} />;
    case 'shopping':
      return <ShoppingListScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'privacy':
      return <PrivacyScreen />;
    case 'plan':
      return <WeekPlanScreen />;
  }
}

export function ScreenRouter() {
  const { route } = useNavigation();

  return (
    <ScrollView
      key={JSON.stringify(route)}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.screen}>
        {renderRoute(route)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  screen: {
    flex: 1,
  },
});