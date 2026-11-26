import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  Home,
  LayoutGrid,
  Leaf,
  User,
  type LucideIcon,
} from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { useNavigation } from '@/store/NavigationContext';
import type { Route } from '@/types';

type TabRoute = Extract<
  Route,
  { name: 'home' | 'rooms' | 'products' | 'tips' | 'profile' }
>;

interface TabItem {
  route: TabRoute;
  label: string;
  icon: LucideIcon;
}

const COLORS = {
  green: '#3b742f',
  lightGreen: '#e8f0e2',
  muted: '#77766f',
  white: '#ffffff',
  border: '#e8e1d5',
};

const TABS: TabItem[] = [
  { route: { name: 'home' }, label: 'Start', icon: Home },
  { route: { name: 'rooms' }, label: 'Mój dom', icon: LayoutGrid },
  { route: { name: 'products' }, label: 'Produkty', icon: Leaf },
  { route: { name: 'tips' }, label: 'Porady', icon: BookOpen },
  { route: { name: 'profile' }, label: 'Profil', icon: User },
];

const TAB_ROUTE_NAMES: Route['name'][] = TABS.map(
  (tab) => tab.route.name,
);

export function BottomNav() {
  const { route, resetTo } = useNavigation();
  const insets = useSafeAreaInsets();

  if (!TAB_ROUTE_NAMES.includes(route.name)) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      {TABS.map((tab) => {
        const active = route.name === tab.route.name;
        const Icon = tab.icon;

        return (
          <Pressable
            key={tab.route.name}
            onPress={() => resetTo(tab.route)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={({ pressed }) => [
              styles.tab,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                active && styles.activeIconContainer,
              ]}
            >
              <Icon
                size={20}
                color={active ? COLORS.green : COLORS.muted}
                strokeWidth={active ? 2.4 : 2}
              />
            </View>

            <AppText
              style={[
                styles.label,
                active && styles.activeLabel,
              ]}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingHorizontal: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 3,
    borderRadius: 16,
  },
  iconContainer: {
    width: 56,
    height: 32,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: COLORS.lightGreen,
  },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  activeLabel: {
    color: COLORS.green,
  },
  pressed: {
    opacity: 0.7,
  },
});