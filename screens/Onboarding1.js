import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import { COLORS, SIZES, images } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const Onboarding = ({ navigation }) => {
  // Screen 1 = progress 0 (first screen)
  const currentScreen = 0;
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image
              source={images.onboarding1}
              resizeMode="contain"
              style={styles.illustration}
            />
            <Image
              source={images.ornament}
              resizeMode="contain"
              style={styles.ornament}
            />
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Find Expert Services</Text>
            <Text style={[styles.subTitle, { color: COLORS.primary }]}>at Your Fingertips</Text>
          </View>

          <Text style={[styles.description, { color: colors.text }]}>
            Discover and book local service professionals instantly, whenever and wherever you need them.
          </Text>

          <View style={styles.dotsContainer}>
            <DotsView progress={currentScreen} numDots={4} />
          </View>
          
          <Button
            title="Next"
            filled
            onPress={() => navigation.navigate('Onboarding2')}
            style={styles.nextButton}
          />
          
          <Button
            title="Skip"
            onPress={() => navigation.navigate('Login')}
            textColor={colors.primary}
            style={styles.skipButton}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    position: 'relative',
  },
  illustration: {
    height: SIZES.width * 0.7,
    width: SIZES.width * 0.7,
  },
  ornament: {
    position: "absolute",
    top: -15,
    zIndex: -1,
    width: SIZES.width * 0.7,
  },
  titleContainer: {
    marginVertical: 18,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: "bold",
    textAlign: "center",
  },
  subTitle: {
    fontSize: 28,
    fontFamily: "bold",
    textAlign: "center",
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: "regular",
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  dotsContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  nextButton: {
    marginVertical: 6,
    width: SIZES.width - 32,
    borderRadius: 30
  },
  skipButton: {
    marginVertical: 6,
    width: SIZES.width - 32,
    backgroundColor: 'transparent',
    borderRadius: 30
  }
});

export default Onboarding;