import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Text } from 'react-native';
import { COLORS, SIZES, FONTS, icons } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingScreen = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary || COLORS.primary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={icons.logo} // Your app logo
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Bricollano</Text>
        <Text style={styles.tagline}>Your Service, Our Priority</Text>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingRing,
            {
              transform: [{ rotate: spin }]
            }
          ]}
        >
          <LinearGradient
            colors={['transparent', COLORS.white]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: COLORS.primary,
  },
  appName: {
    ...FONTS.h1,
    color: COLORS.white,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    ...FONTS.body3,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 40,
  },
  loadingRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: COLORS.white,
    borderRightColor: COLORS.white,
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 25,
  }
});

export default LoadingScreen;