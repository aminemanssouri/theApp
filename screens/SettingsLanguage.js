import { View, Text, StyleSheet } from 'react-native';
import React, { useMemo, useState } from 'react';
import { COLORS } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import LanguageItem from '../components/LanguageItem';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../context/LanguageContext';

// Language selection (EN / IT)
const SettingsLanguage = ({ navigation }) => {
  const { t, language, setLanguage } = useI18n();
  const [selectedItem, setSelectedItem] = useState(language);
  const { colors, dark } = useTheme();

  // Keep codes static; localize labels via i18n so they react to language changes
  const languages = useMemo(() => ([
    { code: 'en', labelKey: 'language.english' },
    { code: 'it', labelKey: 'language.italian' },
  ]), []);

  const onSelect = (code) => {
    setSelectedItem(code);
    setLanguage(code);
  };
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('profile.language_region')}/>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.black }]}>
            {t('settings.language_select') || 'Select Language'}
          </Text>
          {languages.map((lng) => (
            <LanguageItem
              key={lng.code}
              checked={selectedItem === lng.code}
              name={t(lng.labelKey) || lng.code.toUpperCase()}
              onPress={() => onSelect(lng.code)}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  title: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.black,
    marginVertical: 16
  }
})

export default SettingsLanguage