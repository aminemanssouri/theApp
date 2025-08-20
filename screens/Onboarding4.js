import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageContainer from '../components/PageContainer';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import Onboarding1Styles from '../styles/OnboardingStyles';
import { COLORS, images } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const Onboarding4 = ({ navigation }) => {
  const [progress, setProgress] = useState(0);
  const { colors } = useTheme();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setProgress(prevProgress => {
        // Stop at 100% (1.0) and don't exceed it
        if (prevProgress >= 1) {
          clearInterval(intervalId);
          return 1;
        }
        return prevProgress + 0.5;
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  // Remove automatic navigation - let users control it manually

  return (
    <SafeAreaView style={[Onboarding1Styles.container, {
      backgroundColor: colors.background }]}>
      <PageContainer>
        <View style={Onboarding1Styles.contentContainer}>
          <Image
            source={images.onboarding4}
            resizeMode="contain"
            style={Onboarding1Styles.illustration}
          />
          <Image
            source={images.ornament}
            resizeMode="contain"
            style={Onboarding1Styles.ornament}
          />
          <View style={[Onboarding1Styles.buttonContainer, {
            backgroundColor: colors.background
          }]}>
            <View style={Onboarding1Styles.titleContainer}>
              <Text style={[Onboarding1Styles.title, {
                color: colors.text
              }]}>Book in Seconds,</Text>
              <Text style={Onboarding1Styles.subTitle}>Not Hours</Text>
            </View>

            <Text style={[Onboarding1Styles.description, { color: colors.text }]}>
              Enjoy a simple booking process with secure payments and service guarantees for complete peace of mind.
            </Text>

            <View style={Onboarding1Styles.dotsContainer}>
              <DotsView progress={progress} numDots={4} />
            </View>
            <Button
              title="Get Started"
              filled
              onPress={() => navigation.navigate('Welcome')}
              style={Onboarding1Styles.nextButton}
            />
            <Button
              title="Skip"
              onPress={() => navigation.navigate('Login')}
              textColor={colors.primary}
              style={Onboarding1Styles.skipButton}
            />
          </View>
        </View>
      </PageContainer>
    </SafeAreaView>
  );
};

export default Onboarding4;