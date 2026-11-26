
import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DemoNotice } from '@/components/ui/controls';
import { AppText } from '@/components/ui/AppText';
import { useNavigation } from '@/store/NavigationContext';

export function PrivacyScreen() {
  const { goBack } = useNavigation();

  return (
    <>
      <ScreenHeader
        title="Polityka prywatności"
        onBack={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DemoNotice text="Poniższy tekst jest szkicem. Ostateczna polityka prywatności zostanie przygotowana przed publikacją." />

        <View style={styles.paragraphs}>
          <AppText style={styles.text}>
            Dane prototypu, takie jak zadania, lista zakupów i ustawienia, są
            zapisywane wyłącznie w pamięci tej przeglądarki.
          </AppText>

          <AppText style={styles.text}>
            Aplikacja nie zakłada kont użytkowników i nie wysyła danych do
            zewnętrznych usług na tym etapie.
          </AppText>

          <AppText style={styles.text}>
            Możesz w każdej chwili zresetować dane prototypu w sekcji Profil.
          </AppText>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  paragraphs: {
    gap: 16,
  },
  text: {
    color: '#60646C',
    fontSize: 14,
    lineHeight: 22,
  },
});
