import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import React, { useState, useCallback } from 'react';

import { ScrollView } from 'react-native-virtualized-view';
import { COLORS, SIZES } from "../constants";
import { SafeAreaView } from 'react-native-safe-area-context';
import ReasonItem from '../components/ReasonItem';
import Button from '../components/Button';
import Header from '../components/Header';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { cancelBooking } from '../lib/services/booking';
import { t } from '../context/LanguageContext';

const CancelBooking = ({ navigation, route }) => {
  const { colors, dark } = useTheme();
  const { user } = useAuth();
  const bookingId = route?.params?.bookingId;
  const [comment, setComment] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /***
   * Render content
   */
  const renderContent = () => {
    const handleCheckboxPress = (itemTitle) => {
      if (selectedItem === itemTitle) {
        setSelectedItem(null);
      } else {
        setSelectedItem(itemTitle);
      }
    };

    const handleCommentChange = (text) => {
      setComment(text);
    };

    return (
      <View style={{ marginVertical: 12 }}>
        <Text style={[styles.inputLabel, {
          color: dark ? COLORS.grayscale100 : COLORS.greyscale900
        }]}>{t('booking.cancel.reason_prompt')}</Text>
        <View style={{ marginVertical: 16 }}>
          <ReasonItem
            checked={selectedItem === t('booking.cancel.reasons.schedule_change')}
            onPress={() => handleCheckboxPress(t('booking.cancel.reasons.schedule_change'))}
            title={t('booking.cancel.reasons.schedule_change')}
          />
          <ReasonItem
            checked={selectedItem === t('booking.cancel.reasons.weather_conditions')}
            onPress={() => handleCheckboxPress(t('booking.cancel.reasons.weather_conditions'))}
            title={t('booking.cancel.reasons.weather_conditions')}
          />
          <ReasonItem
            checked={selectedItem === t('booking.cancel.reasons.unexpected_work')}
            onPress={() => handleCheckboxPress(t('booking.cancel.reasons.unexpected_work'))}
            title={t('booking.cancel.reasons.unexpected_work')}
          />
          <ReasonItem
            checked={selectedItem === t('booking.cancel.reasons.childcare_issue')}
            onPress={() => handleCheckboxPress(t('booking.cancel.reasons.childcare_issue'))}
            title={t('booking.cancel.reasons.childcare_issue')}
          />
          <ReasonItem
            checked={selectedItem === t('booking.cancel.reasons.travel_delays')}
            onPress={() => handleCheckboxPress(t('booking.cancel.reasons.travel_delays'))}
            title={t('booking.cancel.reasons.travel_delays')}
          />
          <ReasonItem
            checked={selectedItem === t('booking.cancel.reasons.others')}
            onPress={() => handleCheckboxPress(t('booking.cancel.reasons.others'))}
            title={t('booking.cancel.reasons.others')}
          />
        </View>
        <Text style={[styles.inputLabel, {
          color: dark ? COLORS.grayscale100 : COLORS.greyscale900
        }]}>{t('booking.cancel.add_detailed_reason')}</Text>
        <TextInput
          style={[styles.input, {
            color: dark ? COLORS.secondaryWhite : COLORS.greyscale900,
            borderColor: dark ? COLORS.grayscale100 : COLORS.greyscale900
          }]}
          placeholder={t('booking.cancel.reason_placeholder')}
          placeholderTextColor={dark ? COLORS.secondaryWhite : COLORS.greyscale900}
          multiline={true}
          numberOfLines={4} // Set the number of lines you want to display initially
          value={comment}
          onChangeText={handleCommentChange}
        />
      </View>
    )
  }

  /**
      * Render submit buttons
      */
  const handleSubmit = useCallback(async () => {
    if (!bookingId || !user?.id) {
      Alert.alert(t('booking.actions.cancel_booking'), t('booking.cancel.missing_info'));
      return;
    }
    const reason = selectedItem === t('booking.cancel.reasons.others') ? comment : (selectedItem || comment || '');
    try {
      setSubmitting(true);
      const res = await cancelBooking(bookingId, user.id, reason);
      if (res?.success === false) {
        Alert.alert(t('booking.alerts.cancel_failed_title'), res?.message || t('booking.alerts.cancel_failed_generic'));
      } else {
        // Show refund information if available
        let message = t('booking.alerts.cancel_success_msg');
        if (res?.refund) {
          message = t('booking.alerts.cancel_with_refund', {
            refundAmount: res.refund.refundAmount?.toFixed(2),
            cancellationFee: res.refund.cancellationFee?.toFixed(2)
          });
        }
        Alert.alert(t('booking.alerts.cancel_success_title'), message);
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert(t('booking.alerts.cancel_failed_title'), e?.message || t('booking.alerts.cancel_failed_generic'));
    } finally {
      setSubmitting(false);
    }
  }, [bookingId, user?.id, selectedItem, comment, navigation]);

  const renderSubmitButton = () => {
    return (
      <View style={[styles.btnContainer, {
        backgroundColor: colors.background
      }]}>
        <Button
          title={t('common.submit')}
          filled
          style={styles.submitBtn}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('booking.actions.cancel_booking')} />
        <ScrollView
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </View>
      {renderSubmitButton()}
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
    padding: 12
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
     
    marginBottom: 12,
    alignItems: "center"
  },
  headerIcon: {
    height: 50,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: COLORS.gray
  },
  arrowLeft: {
    height: 24,
    width: 24,
    tintColor: COLORS.black
  },
  moreIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black
  },
  input: {
    borderColor: "gray",
    borderWidth: .3,
    borderRadius: 5,
    width: "100%",
    padding: 10,
    paddingBottom: 10,
    fontSize: 12,
    height: 150,
    textAlignVertical: "top"
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.black,
    marginBottom: 6,
    marginTop: 16
  },
  btnContainer: {
    position: "absolute",
    bottom: 22,
    height: 72,
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    alignItems: "center"
  },
  btn: {
    height: 48,
    width: SIZES.width - 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8
  },
  submitBtn: {
    width: SIZES.width - 32,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "medium",
    color: COLORS.white
  },
})

export default CancelBooking