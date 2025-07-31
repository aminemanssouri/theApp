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
      Alert.alert('Error', 'Failed to load notification settings');
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
      Alert.alert('Error', 'Failed to update notification setting');
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
        <Header title="Notifications"/>
        <ScrollView
          style={styles.settingsContainer}
          showsVerticalScrollIndicator={false}>
          
          {/* General Settings */}
          <GlobalSettingsItem
            title="General Notifications"
            subtitle="Enable all notifications"
            isNotificationEnabled={settings.general_enabled}
            toggleNotificationEnabled={toggleGeneralNotifications}
            disabled={loading}
          />
          
          <GlobalSettingsItem
            title="Sound"
            subtitle="Play sound for notifications"
            isNotificationEnabled={settings.sound_enabled}
            toggleNotificationEnabled={toggleSound}
            disabled={loading || !settings.general_enabled}
          />
          
          <GlobalSettingsItem
            title="Vibrate"
            subtitle="Vibrate for notifications"
            isNotificationEnabled={settings.vibrate_enabled}
            toggleNotificationEnabled={toggleVibrate}
            disabled={loading || !settings.general_enabled}
          />

          {/* Message Notifications */}
          <GlobalSettingsItem
            title="Message Notifications"
            subtitle="New messages from providers"
            isNotificationEnabled={settings.message_notifications}
            toggleNotificationEnabled={toggleMessageNotifications}
            disabled={loading || !settings.general_enabled}
          />

          {/* Booking Notifications */}
          <GlobalSettingsItem
            title="Booking Notifications"
            subtitle="Booking updates and reminders"
            isNotificationEnabled={settings.booking_notifications}
            toggleNotificationEnabled={toggleBookingNotifications}
            disabled={loading || !settings.general_enabled}
          />

          {/* Payment Notifications */}
          <GlobalSettingsItem
            title="Payment Notifications"
            subtitle="Payment confirmations and updates"
            isNotificationEnabled={settings.payment_enabled}
            toggleNotificationEnabled={togglePayments}
            disabled={loading || !settings.general_enabled}
          />

          {/* Promotional Notifications */}
          <GlobalSettingsItem
            title="Promo & Discount"
            subtitle="Special offers and discounts"
            isNotificationEnabled={settings.promo_discount_enabled}
            toggleNotificationEnabled={toggleDiscountEnabled}
            disabled={loading || !settings.general_enabled}
          />

          <GlobalSettingsItem
            title="Special Offers"
            subtitle="Exclusive deals and promotions"
            isNotificationEnabled={settings.special_offers_enabled}
            toggleNotificationEnabled={toggleSpecialOffers}
            disabled={loading || !settings.general_enabled}
          />

          <GlobalSettingsItem
            title="Cashback"
            subtitle="Cashback rewards and updates"
            isNotificationEnabled={settings.cashback_enabled}
            toggleNotificationEnabled={toggleCashback}
            disabled={loading || !settings.general_enabled}
          />

          {/* System Notifications */}
          <GlobalSettingsItem
            title="System Notifications"
            subtitle="App updates and system messages"
            isNotificationEnabled={settings.system_notifications}
            toggleNotificationEnabled={toggleSystemNotifications}
            disabled={loading || !settings.general_enabled}
          />

          <GlobalSettingsItem
            title="App Updates"
            subtitle="New app versions and features"
            isNotificationEnabled={settings.app_updates_enabled}
            toggleNotificationEnabled={toggleAppUpdates}
            disabled={loading || !settings.general_enabled || !settings.system_notifications}
          />

          <GlobalSettingsItem
            title="New Service Available"
            subtitle="New services in your area"
            isNotificationEnabled={settings.new_service_enabled}
            toggleNotificationEnabled={toggleNewServiceAvailable}
            disabled={loading || !settings.general_enabled}
          />

          <GlobalSettingsItem
            title="New Tips Available"
            subtitle="Helpful tips and guides"
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