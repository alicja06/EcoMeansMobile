
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import { View, StyleSheet } from 'react-native';
import { CircleCheck } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { fontFamilies } from '@/theme/typography';

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastState {
  id: number;
  message: string;
}

const TOAST_DURATION_MS = 2400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const counter = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    counter.current += 1;
    const id = counter.current;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ id, message });

    timeoutRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
      timeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <View pointerEvents="none" style={styles.container}>
          <View style={styles.toast}>
            <CircleCheck size={20} color="#73a62d" />
            <AppText style={styles.message}>{toast.message}</AppText>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error('useToast musi być użyty wewnątrz ToastProvider.');
  }

  return value;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 32,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4e4d4d',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 8,
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: fontFamilies.medium,
  },
});
