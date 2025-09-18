import { View, StyleSheet, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ScrollView } from 'react-native-virtualized-view';
import Header from '../components/Header';
import GlobalSettingsItem from '../components/GlobalSettingsItem';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { t } from '../context/LanguageContext';
import { 
  getNotificationSettings, 
  updateNotificationSettings,
  getDefaultNotificationSettings 
} from '../lib/services/notification';

const SettingsNotifications = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(getDefaultNotificationSettings());

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const userSettings = await getNotificationSettings(user.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert(t('common.error'), t('settings.notifications.failed_load'));
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    if (!user?.id) return;
    
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await updateNotificationSettings(user.id, newSettings);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert(t('common.error'), t('settings.notifications.failed_update'));
      // Revert the change
      setSettings(settings);
    }
  };

  const toggleGeneralNotifications = () => {
    updateSetting('general_enabled', !settings.general_enabled);
  };

  const toggleSound = () => {
    updateSetting('sound_enabled', !settings.sound_enabled);
  };

  const toggleVibrate = () => {
    updateSetting('vibrate_enabled', !settings.vibrate_enabled);
  };

  const toggleSpecialOffers = () => {
    updateSetting('special_offers_enabled', !settings.special_offers_enabled);
  };

  const toggleDiscountEnabled = () => {
    updateSetting('promo_discount_enabled', !settings.promo_discount_enabled);
  };

  const togglePayments = () => {
    updateSetting('payment_enabled', !settings.payment_enabled);
  };

  const toggleCashback = () => {
    updateSetting('cashback_enabled', !settings.cashback_enabled);
  };

  const toggleAppUpdates = () => {
    updateSetting('app_updates_enabled', !settings.app_updates_enabled);
  };

  const toggleNewServiceAvailable = () => {
    updateSetting('new_service_enabled', !settings.new_service_enabled);
  };

  const toggleNewTipsAvailable = () => {
    updateSetting('new_tips_enabled', !settings.new_tips_enabled);
  };

  const toggleMessageNotifications = () => {
    updateSetting('message_notifications', !settings.message_notifications);
  };

  const toggleBookingNotifications = () => {
    updateSetting('booking_notifications', !settings.booking_notifications);
  };

  const toggleSystemNotifications = () => {
    updateSetting('system_notifications', !settings.system_notifications);
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar hidden/>
        <Header title={t('settings.notifications.title')}/>
        <ScrollView
          style={styles.settingsContainer}
          showsVerticalScrollIndicator={false}>
          
          {/* General Settings */}
          <GlobalSettingsItem
            title={t('settings.notifications.general_notifications')}
            subtitle={t('settings.notifications.general_notifications_sub')}
            isNotificationEnabled={settings.general_enabled}
            toggleNotificationEnabled={toggleGeneralNotifications}
            disabled={loading}
          />
          
          <GlobalSettingsItem
            title={t('settings.notifications.sound')}
            subtitle={t('settings.notifications.sound_sub')}
            isNotificationEnabled={settings.sound_enabled}
            toggleNotificationEnabled={toggleSound}
            disabled={loading || !settings.general_enabled}
          />
          
          <GlobalSettingsItem
            title={t('settings.notifications.vibrate')}
            subtitle={t('settings.notifications.vibrate_sub')}
            isNotificationEnabled={settings.vibrate_enabled}
            toggleNotificationEnabled={toggleVibrate}
            disabled={loading || !settings.general_enabled}
          />

          {/* Message Notifications */}
          <GlobalSettingsItem
            title={t('settings.notifications.message_notifications')}
            subtitle={t('settings.notifications.message_notifications_sub')}
            isNotificationEnabled={settings.message_notifications}
            toggleNotificationEnabled={toggleMessageNotifications}
            disabled={loading || !settings.general_enabled}
          />

          {/* Booking Notifications */}
          <GlobalSettingsItem
            title={t('settings.notifications.booking_notifications')}
            subtitle={t('settings.notifications.booking_notifications_sub')}
            isNotificationEnabled={settings.booking_notifications}
            toggleNotificationEnabled={toggleBookingNotifications}
            disabled={loading || !settings.general_enabled}
          />

          {/* Payment Notifications */}
          <GlobalSettingsItem
            title={t('settings.notifications.payment_notifications')}
            subtitle={t('settings.notifications.payment_notifications_sub')}
            isNotificationEnabled={settings.payment_enabled}
            toggleNotificationEnabled={togglePayments}
            disabled={loading || !settings.general_enabled}
          />

          {/* Promotional Notifications */}
          <GlobalSettingsItem
            title={t('settings.notifications.promo_discount')}
            subtitle={t('settings.notifications.promo_discount_sub')}
            isNotificationEnabled={settings.promo_discount_enabled}
            toggleNotificationEnabled={toggleDiscountEnabled}
            disabled={loading || !settings.general_enabled}
          />

          <GlobalSettingsItem
            title={t('settings.notifications.special_offers')}
            subtitle={t('settings.notifications.special_offers_sub')}
            isNotificationEnabled={settings.special_offers_enabled}
            toggleNotificationEnabled={toggleSpecialOffers}
            disabled={loading || !settings.general_enabled}
          />

          <GlobalSettingsItem
            title={t('settings.notifications.cashback')}
            subtitle={t('settings.notifications.cashback_sub')}
            isNotificationEnabled={settings.cashback_enabled}
            toggleNotificationEnabled={toggleCashback}
            disabled={loading || !settings.general_enabled}
          />

          {/* System Notifications */}
          <GlobalSettingsItem
            title={t('settings.notifications.system_notifications')}
            subtitle={t('settings.notifications.system_notifications_sub')}
            isNotificationEnabled={settings.system_notifications}
            toggleNotificationEnabled={toggleSystemNotifications}
            disabled={loading || !settings.general_enabled}
          />

          <GlobalSettingsItem
            title={t('settings.notifications.app_updates')}
            subtitle={t('settings.notifications.app_updates_sub')}
            isNotificationEnabled={settings.app_updates_enabled}
            toggleNotificationEnabled={toggleAppUpdates}
            disabled={loading || !settings.general_enabled || !settings.system_notifications}
          />

          <GlobalSettingsItem
            title={t('settings.notifications.new_service')}
            subtitle={t('settings.notifications.new_service_sub')}
            isNotificationEnabled={settings.new_service_enabled}
            toggleNotificationEnabled={toggleNewServiceAvailable}
            disabled={loading || !settings.general_enabled}
          />

          <GlobalSettingsItem
            title={t('settings.notifications.new_tips')}
            subtitle={t('settings.notifications.new_tips_sub')}
            isNotificationEnabled={settings.new_tips_enabled}
            toggleNotificationEnabled={toggleNewTipsAvailable}
            disabled={loading || !settings.general_enabled}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

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
  settingsContainer: {
    marginVertical: 16
  }
})

export default SettingsNotifications