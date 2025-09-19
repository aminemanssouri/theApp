import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, Platform } from 'react-native';
import React, { useState, useRef } from 'react';
import { COLORS, SIZES, icons, images } from '../constants';
import { getSafeAreaInsets } from '../utils/safeAreaUtils';
import { ScrollView } from 'react-native-virtualized-view';
import { MaterialIcons } from '@expo/vector-icons';
import { launchImagePicker } from '../utils/ImagePickerHelper';
import SettingsItem from '../components/SettingsItem';
import { useTheme } from '../theme/ThemeProvider';
import RBSheet from "react-native-raw-bottom-sheet";
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../context/LanguageContext';

const Profile = ({ navigation }) => {
  const { t } = useI18n();
  const refRBSheet = useRef();
  const { dark, colors, setScheme } = useTheme();
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  
  // Calculate bottom spacing to avoid tab bar overlap
  const getBottomSpacing = () => {
    const baseTabHeight = 60;
    const safeAreaBottom = insets.bottom;
    
    if (Platform.OS === 'ios') {
      return baseTabHeight + safeAreaBottom + 20;
    } else {
      return baseTabHeight + Math.max(safeAreaBottom, 10) + 20;
    }
  };
  /**
   * Render Header
   */
  const renderHeader = () => {
    return (
      <TouchableOpacity style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}>
            <Image
              source={icons.back}
              resizeMode='contain'
              style={[styles.backIcon, {
                tintColor: dark ? COLORS.white : COLORS.greyscale900
              }]}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>{t('profile.title')}</Text>
        </View>
        <TouchableOpacity>
          <Image
            source={icons.moreCircle}
            resizeMode='contain'
            style={[styles.headerIcon, {
              tintColor: dark ? COLORS.secondaryWhite : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }
  /**
   * Render User Profile
   */
  const renderProfile = () => {
    const [image, setImage] = useState(null)

    // Get profile image from database or fallback to default
    const getProfileImage = () => {
      if (image) {
        return image; // User just picked a new image
      } else if (userProfile?.profile_picture) {
        return { uri: userProfile.profile_picture }; // From database
      } else {
        return images.user1; // Default fallback
      }
    };

    const pickImage = async () => {
      try {
        const tempUri = await launchImagePicker()

        if (!tempUri) return

        // set the image
        setImage({ uri: tempUri })
      } catch (error) { }
    };

    // Get user display name
    const getDisplayName = () => {
      if (userProfile?.first_name && userProfile?.last_name) {
        return `${userProfile.first_name} ${userProfile.last_name}`;
      } else if (userProfile?.first_name) {
        return userProfile.first_name;
      } else if (user?.email) {
        // Fallback to email if no name is set
        return user.email.split('@')[0];
      }
      return 'User';
    };

    // Get user email
    const getUserEmail = () => {
      return user?.email || userProfile?.email || 'No email available';
    };

    return (
      <View style={styles.profileContainer}>
        <View>
          <Image
            source={getProfileImage()}
            resizeMode='cover'
            style={styles.avatar}
          />
          <TouchableOpacity
            onPress={pickImage}
            style={styles.picContainer}>
            <MaterialIcons name="edit" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>
          {authLoading ? 'Loading...' : getDisplayName()}
        </Text>
        <Text style={[styles.subtitle, { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }]}>
          {authLoading ? 'Loading...' : getUserEmail()}
        </Text>
      </View>
    )
  }
  /**
   * Render Settings
   */
  const renderSettings = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
      setIsDarkMode((prev) => !prev);
      dark ? setScheme('light') : setScheme('dark')
    };

    return (
      <View style={styles.settingsContainer}>
        <SettingsItem
          icon={icons.calendar}
          name={t('profile.my_booking')}
          onPress={() => navigation.navigate("MyBookings")}
        />
        <SettingsItem
          icon={icons.userOutline}
          name={t('profile.edit_profile')}
          onPress={() => navigation.navigate("EditProfile")}
        />
        <SettingsItem
          icon={icons.bell2}
          name={t('profile.notification')}
          onPress={() => navigation.navigate("SettingsNotifications")}
        />
        <SettingsItem
          icon={icons.wallet2Outline}
          name={t('profile.payment')}
          onPress={() => navigation.navigate("SettingsPayment")}
        />
        <SettingsItem
          icon={icons.shieldOutline}
          name={t('profile.security')}
          onPress={() => navigation.navigate("SettingsSecurity")}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate("SettingsLanguage")}
          style={styles.settingsItemContainer}>
          <View style={styles.leftContainer}>
            <Image
              source={icons.more}
              resizeMode='contain'
              style={[styles.settingsIcon, {
                tintColor: dark ? COLORS.white : COLORS.greyscale900
              }]}
            />
            <Text style={[styles.settingsName, {
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>{t('profile.language_region')}</Text>
          </View>
          <View style={styles.rightContainer}>
            <Text style={[styles.rightLanguage, {
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>{t('profile.current_language')}</Text>
            <Image
              source={icons.arrowRight}
              resizeMode='contain'
              style={[styles.settingsArrowRight, {
                tintColor: dark ? COLORS.white : COLORS.greyscale900
              }]}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsItemContainer}>
          <View style={styles.leftContainer}>
            <Image
              source={icons.show}
              resizeMode='contain'
              style={[styles.settingsIcon, {
                tintColor: dark ? COLORS.white : COLORS.greyscale900
              }]}
            />
            <Text style={[styles.settingsName, {
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>{t('profile.dark_mode')}</Text>
          </View>
          <View style={styles.rightContainer}>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              thumbColor={isDarkMode ? '#fff' : COLORS.white}
              trackColor={{ false: '#EEEEEE', true: COLORS.primary }}
              ios_backgroundColor={COLORS.white}
              style={styles.switch}
            />
          </View>
        </TouchableOpacity>
        <SettingsItem
          icon={icons.lockedComputerOutline}
          name={t('profile.privacy_policy')}
          onPress={() => navigation.navigate("SettingsPrivacyPolicy")}
        />
        <SettingsItem
          icon={icons.infoCircle}
          name={t('profile.help_center')}
          onPress={() => navigation.navigate("HelpCenter")}
        />
        <SettingsItem
          icon={icons.people4}
          name={t('profile.invite_friends')}
          onPress={() => navigation.navigate("InviteFriends")}
        />
        <TouchableOpacity
          onPress={() => refRBSheet.current.open()}
          style={styles.logoutContainer}>
          <View style={styles.logoutLeftContainer}>
            <Image
              source={icons.logout}
              resizeMode='contain'
              style={[styles.logoutIcon, {
                tintColor: "red"
              }]}
            />
            <Text style={[styles.logoutName, {
              color: "red"
            }]}>{t('profile.logout')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }
  return (
    <View style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getBottomSpacing(),
          }}
        >
          {renderProfile()}
          {renderSettings()}
        </ScrollView>
      </View>
      <RBSheet
        ref={refRBSheet}
        closeOnDragDown={true}
        closeOnPressMask={false}
        height={SIZES.height * .8}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)",
          },
          draggableIcon: {
            backgroundColor: dark ? COLORS.gray2 : COLORS.grayscale200,
            height: 4
          },
          container: {
            borderTopRightRadius: 32,
            borderTopLeftRadius: 32,
            height: 260,
            backgroundColor: dark ? COLORS.dark2 : COLORS.white
          }
        }}
      >
        <Text style={styles.bottomTitle}>{t('profile.logout')}</Text>
        <View style={[styles.separateLine, {
          backgroundColor: dark ? COLORS.greyScale800 : COLORS.grayscale200,
        }]} />
        <Text style={[styles.bottomSubtitle, {
          color: dark ? COLORS.white : COLORS.black
        }]}>{t('profile.logout_confirm')}</Text>
        <View style={styles.bottomContainer}>
          <Button
            title={t('profile.cancel')}
            style={{
              width: (SIZES.width - 32) / 2 - 8,
              backgroundColor: dark ? COLORS.gray2 : COLORS.tansparentPrimary,
              borderRadius: 32,
              borderColor: dark ? COLORS.gray2 : COLORS.tansparentPrimary
            }}
            textColor={dark ? COLORS.white : COLORS.primary}
            onPress={() => refRBSheet.current.close()}
          />
          <Button
            title={t('profile.yes_logout')}
            filled
            style={styles.logoutButton}
            onPress={async () => {
              try {
                await signOut();
              } catch (e) {
                // noop; errors already logged in context
              } finally {
                refRBSheet.current.close();
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              }
            }}
          />
        </View>
      </RBSheet>
    </View>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? 25 : 0,

  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 32,
    paddingVertical: 16,

  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  logo: {
    height: 32,
    width: 32,
    tintColor: COLORS.primary
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginLeft: 12
  },
  headerIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.greyscale900
  },
   backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black
    },
  profileContainer: {
    alignItems: "center",
    borderBottomColor: COLORS.grayscale400,
    borderBottomWidth: .4,
    paddingVertical: 20
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 999
  },
  picContainer: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    position: "absolute",
    right: 0,
    bottom: 12
  },
  title: {
    fontSize: 18,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginTop: 12
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.greyscale900,
    fontFamily: "medium",
    marginTop: 4
  },
  settingsContainer: {
    marginVertical: 12
  },
  settingsItemContainer: {
    width: SIZES.width - 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.greyscale900
  },
  settingsName: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginLeft: 12
  },
  settingsArrowRight: {
    width: 24,
    height: 24,
    tintColor: COLORS.greyscale900
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  rightLanguage: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginRight: 8
  },
  switch: {
    marginLeft: 8,
    transform: [{ scaleX: .8 }, { scaleY: .8 }], // Adjust the size of the switch
  },
  logoutContainer: {
    width: SIZES.width - 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12
  },
  logoutLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.greyscale900
  },
  logoutName: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginLeft: 12
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
    paddingHorizontal: 16
  },
  cancelButton: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.tansparentPrimary,
    borderRadius: 32
  },
  logoutButton: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.primary,
    borderRadius: 32
  },
  bottomTitle: {
    fontSize: 24,
    fontFamily: "semiBold",
    color: "red",
    textAlign: "center",
    marginTop: 12
  },
  bottomSubtitle: {
    fontSize: 20,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    textAlign: "center",
    marginVertical: 28
  },
  separateLine: {
    width: SIZES.width,
    height: 1,
    backgroundColor: COLORS.grayscale200,
    marginTop: 12
  }
})

export default Profile