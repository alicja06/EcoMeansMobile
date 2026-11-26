
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  FLOOR_BASE_WATER_LITERS,
  FLOOR_DOSAGE_OPTIONS,
} from '@/data/calculators';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { DemoNotice } from '@/components/ui/controls';
import { fontFamilies } from '@/theme/typography';

export function CalculatorsScreen() {
  const [dosageId, setDosageId] = useState<string>(
    FLOOR_DOSAGE_OPTIONS[1].id,
  );
  const [waterInput, setWaterInput] = useState('5');

  const water = Number(waterInput.replace(',', '.'));
  const validWater =
    Number.isFinite(water) && water >= 0.1 && water <= 200;

  const dosage =
    FLOOR_DOSAGE_OPTIONS.find((option) => option.id === dosageId) ??
    FLOOR_DOSAGE_OPTIONS[1];

  const result = validWater
    ? Math.round((water / FLOOR_BASE_WATER_LITERS) * dosage.mlPerBase)
    : null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Kalkulator"
        subtitle="Dawkowanie EcoMeans Podłoga"
      />

      <View style={styles.content}>
        <AppText style={styles.sectionTitle}>Sposób mycia</AppText>

        <View style={styles.options}>
          {FLOOR_DOSAGE_OPTIONS.map((option) => {
            const active = option.id === dosageId;

            return (
              <Pressable
                key={option.id}
                onPress={() => setDosageId(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.option,
                  active ? styles.optionActive : styles.optionInactive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionText}>
                  <AppText style={styles.optionLabel}>
                    {option.label}
                  </AppText>
                  <AppText style={styles.optionDetail}>
                    {option.detail}
                  </AppText>
                </View>

                <AppText style={styles.optionDosage}>
                  {option.mlPerBase} ml / 5 l
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText style={styles.inputLabel}>Ile litrów wody?</AppText>

        <TextInput
          value={waterInput}
          onChangeText={setWaterInput}
          keyboardType="decimal-pad"
          accessibilityLabel="Ilość litrów wody"
          placeholder="Np. 5"
          placeholderTextColor="#99968e"
          style={styles.input}
        />

        {!validWater ? (
          <AppText style={styles.error}>
            Podaj liczbę litrów od 0,1 do 200.
          </AppText>
        ) : null}

        <View style={styles.resultCard}>
          <AppText style={styles.resultLabel}>
            Potrzebny koncentrat
          </AppText>

          <AppText style={styles.resultValue}>
            {result !== null ? `${result} ml` : '—'}
          </AppText>

          <AppText style={styles.resultDescription}>
            {result !== null
              ? `Na ${waterInput.replace('.', ',')} l wody przy wybranym sposobie mycia.`
              : 'Wpisz poprawną ilość wody.'}
          </AppText>
        </View>

        <View style={styles.notice}>
          <DemoNotice text="Wyniki liczone są wyłącznie na podstawie zalecanego dawkowania: 25–50 ml lub 100 ml na 5 litrów wody." />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5e6ce',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#4e4d4d',
    fontSize: 16,
    fontFamily: fontFamilies.bold,
  },
  options: {
    gap: 8,
  },
  option: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  optionActive: {
    borderColor: '#3b742f',
    backgroundColor: '#edf4e9',
  },
  optionInactive: {
    borderColor: '#dedbd3',
    backgroundColor: '#ffffff',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    color: '#4e4d4d',
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  optionDetail: {
    marginTop: 3,
    color: '#77766f',
    fontSize: 12,
    fontFamily: fontFamilies.regular,
  },
  optionDosage: {
    color: '#3b742f',
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  pressed: {
    opacity: 0.75,
  },
  inputLabel: {
    marginTop: 24,
    marginBottom: 8,
    color: '#4e4d4d',
    fontSize: 16,
    fontFamily: fontFamilies.bold,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#dedbd3',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#4e4d4d',
    fontSize: 18,
    fontFamily: fontFamilies.bold,
  },
  error: {
    marginTop: 8,
    color: '#c0392b',
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  resultCard: {
    marginTop: 24,
    borderRadius: 24,
    backgroundColor: '#3b742f',
    padding: 24,
    elevation: 3,
  },
  resultLabel: {
    color: '#e4eedf',
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  resultValue: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 36,
    fontFamily: fontFamilies.bold,
  },
  resultDescription: {
    marginTop: 8,
    color: '#e4eedf',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontFamilies.regular,
  },
  notice: {
    marginTop: 16,
  },
});
