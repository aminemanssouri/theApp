import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const SettingsPrivacyPolicy = () => {
    const { colors, dark } = useTheme();

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title={t('privacy.title')}/>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View>
                        <Text style={[styles.settingsTitle, { color: dark ? COLORS.white : COLORS.black }]}>{t('privacy.sec1_title')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec1_p1')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec1_p2')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec1_p3')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec1_p4')}</Text>
                    </View>
                    <View>
                        <Text style={[styles.settingsTitle, { color: dark ? COLORS.white : COLORS.black }]}>{t('privacy.sec2_title')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec2_p1')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec2_p2')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec2_p3')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec2_p4')}</Text>
                    </View>
                    <View>
                        <Text style={[styles.settingsTitle, { color: dark ? COLORS.white : COLORS.black }]}>{t('privacy.sec3_title')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec3_p1')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec3_p2')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec3_p3')}</Text>
                        <Text style={[styles.body, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>{t('privacy.sec3_p4')}</Text>
                    </View>
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
    settingsTitle: {
        fontSize: 18,
        fontFamily: "bold",
        color: COLORS.black,
        marginVertical: 26
    },
    body: {
        fontSize: 14,
        fontFamily: "regular",
        color: COLORS.black,
        marginTop: 4
    }
})

export default SettingsPrivacyPolicy