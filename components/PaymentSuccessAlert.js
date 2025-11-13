import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { COLORS, SIZES } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { FontAwesome } from '@expo/vector-icons';
import { t } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const PaymentSuccessAlert = ({ visible, onClose, amount, serviceName, workerName }) => {
  const { dark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Bounce animation for icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.7],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <FontAwesome 
              name="times" 
              size={24} 
              color={dark ? COLORS.grayscale400 : COLORS.greyscale900} 
            />
          </TouchableOpacity>

          {/* Success Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ translateY: bounceAnim }],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <FontAwesome name="check" size={48} color={COLORS.primary} />
            </View>
          </Animated.View>

          {/* Success Message */}
          <Text style={[
            styles.title,
            { color: dark ? COLORS.white : COLORS.greyscale900 }
          ]}>
            {t('payment.success')}
          </Text>
          <Text style={[
            styles.description,
            { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }
          ]}>
            {t('payment.booking_confirmed')}
          </Text>

          {/* Payment Details */}
          <View style={[
            styles.detailsContainer,
            { backgroundColor: dark ? COLORS.dark3 : COLORS.secondaryWhite }
          ]}>
            {serviceName && (
              <View style={styles.detailRow}>
                <Text style={[
                  styles.detailLabel,
                  { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }
                ]}>
                  {t('common.service')}
                </Text>
                <Text style={[
                  styles.detailValue,
                  { color: dark ? COLORS.white : COLORS.greyscale900 }
                ]}>
                  {serviceName}
                </Text>
              </View>
            )}
            {workerName && (
              <View style={styles.detailRow}>
                <Text style={[
                  styles.detailLabel,
                  { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }
                ]}>
                  {t('chat.service_provider')}
                </Text>
                <Text style={[
                  styles.detailValue,
                  { color: dark ? COLORS.white : COLORS.greyscale900 }
                ]}>
                  {workerName}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={[
                styles.detailLabel,
                { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }
              ]}>
                {t('common.amount')}
              </Text>
              <Text style={[
                styles.detailValue,
                { 
                  color: COLORS.primary,
                  fontSize: 18,
                  fontFamily: 'bold'
                }
              ]}>
                €{amount}
              </Text>
            </View>
            <View style={[styles.detailRow, { marginBottom: 0 }]}>
              <Text style={[
                styles.detailLabel,
                { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }
              ]}>
                {t('common.date')}
              </Text>
              <Text style={[
                styles.detailValue,
                { color: dark ? COLORS.white : COLORS.greyscale900 }
              ]}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.doneButton} 
            onPress={handleClose}
          >
            <Text style={styles.doneButtonText}>{t('common.done')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
  },
  alertContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    width: width - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.tansparentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontFamily: 'bold',
    color: COLORS.greyscale900,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.grayscale700,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  detailsContainer: {
    backgroundColor: COLORS.secondaryWhite,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.grayscale700,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'semiBold',
  },
});

export default PaymentSuccessAlert;
