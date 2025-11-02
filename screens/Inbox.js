import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions, Platform, TextInput, Modal, Pressable, Alert } from 'react-native';
import React from 'react';
import { COLORS, SIZES, icons, images } from '../constants';
import { getSafeAreaInsets } from '../utils/safeAreaUtils';
import { TabView, TabBar } from 'react-native-tab-view';
import { Chats } from '../tabs';
import { Feather } from "@expo/vector-icons";
import { useTheme } from '../theme/ThemeProvider';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { markMessagesRead } from '../lib/services/chat';
import { useI18n } from '../context/LanguageContext';

const Inbox = ({ navigation }) => {
  const { t, language } = useI18n();
  const layout = useWindowDimensions();
  const { colors, dark } = useTheme();
  const insets = getSafeAreaInsets();
  const { user } = useAuth();

  const [index, setIndex] = React.useState(0);
  const [routes, setRoutes] = React.useState([
    { key: 'first', title: t('inbox.chats_tab') }
  ]);

  // Update tabs when language changes
  React.useEffect(() => {
    setRoutes([{ key: 'first', title: t('inbox.chats_tab') }]);
  }, [language, t]);

  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showOptions, setShowOptions] = React.useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = React.useState(false);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAllRead(true);
      setShowOptions(false);
      
      // Get all conversations for the current user
      const { data: conversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user?.id);
      
      if (conversations && conversations.length > 0) {
        // Mark all messages as read for each conversation
        for (const conv of conversations) {
          await markMessagesRead(conv.conversation_id, user?.id);
        }
      }
      
      // Refresh the conversations list
      // This will trigger a re-render in the Chats component
      Alert.alert(t('inbox.success'), t('inbox.all_marked_read'));
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert(t('inbox.error'), t('inbox.failed_mark_all'));
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleDeleteAll = async () => {
    Alert.alert(
      t('inbox.delete_all_title'),
      t('inbox.delete_all_message'),
      [
        {
          text: t('inbox.cancel'),
          style: 'cancel',
        },
        {
          text: t('inbox.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAll(true);
              setShowOptions(false);
              
              // Get all conversations for the current user
              const { data: conversations } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', user?.id);
              
              if (conversations && conversations.length > 0) {
                // Delete all conversations
                for (const conv of conversations) {
                  // Delete messages first
                  await supabase
                    .from('messages')
                    .delete()
                    .eq('conversation_id', conv.conversation_id);
                  
                  // Delete conversation participants
                  await supabase
                    .from('conversation_participants')
                    .delete()
                    .eq('conversation_id', conv.conversation_id);
                  
                  // Delete the conversation
                  await supabase
                    .from('conversations')
                    .delete()
                    .eq('id', conv.conversation_id);
                }
              }
              
              Alert.alert(t('inbox.success'), t('inbox.all_deleted'));
            } catch (error) {
              console.error('Error deleting all conversations:', error);
              Alert.alert(t('inbox.error'), t('inbox.failed_delete_all'));
            } finally {
              setIsDeletingAll(false);
            }
          },
        },
      ]
    );
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: colors.primary,
        height: 3,
        borderRadius: 2,
        marginLeft: 8,
        marginRight: 8,
      }}
      style={{
        backgroundColor: 'transparent',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
        borderTopWidth: 0,
        paddingHorizontal: 8,
      }}
      tabStyle={{
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
        paddingHorizontal: 8,
        marginHorizontal: 4,
      }}
      renderLabel={({ route, focused }) => (
        <Text style={{
          color: focused ? colors.primary : colors.text,
          fontSize: 16,
          fontFamily: 'bold',
        }}>
          {route.title}
        </Text>
      )}
    />
  );

  const renderHeader = () => {
    return (
      <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.headerLeft, { backgroundColor: colors.background }]}>
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
          }]}>{t('inbox.title')}</Text>
        </View>
        <View style={[styles.headerRight, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => setShowSearch((prev) => !prev)}>
            <Image
              source={icons.search}
              resizeMode='contain'
              style={[styles.searchIcon, {
                tintColor: dark ? COLORS.secondaryWhite : COLORS.greyscale900
              }]}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptions(true)}>
            <Image
              source={icons.moreCircle}
              resizeMode='contain'
              style={[styles.moreCircleIcon, {
                tintColor: dark ? COLORS.secondaryWhite : COLORS.greyscale900
              }]}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOptionsModal = () => (
    <Modal
      visible={showOptions}
      transparent
      animationType="fade"
      onRequestClose={() => setShowOptions(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
        <View style={[styles.optionsMenu, {
          backgroundColor: colors.background,
          top: 60,
          right: 16,
          position: 'absolute',
        }]}> 
          <TouchableOpacity 
            style={styles.optionItem} 
            onPress={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
          >
            <Text style={[styles.optionText, {color: dark ? COLORS.white : COLORS.black}]}> 
              {isMarkingAllRead ? t('inbox.marking') : t('inbox.mark_all_as_read')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.optionItem} 
            onPress={handleDeleteAll}
            disabled={isDeletingAll}
          >
            <Text style={[styles.optionText, {color: dark ? COLORS.white : COLORS.black}]}> 
              {isDeletingAll ? t('inbox.deleting') : t('inbox.delete_all')}
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={[styles.area, { backgroundColor: colors.background }]}> 
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
        {renderHeader()}
        {showSearch && (
          <View style={[styles.searchBarContainer, { backgroundColor: colors.background }]}> 
            <View style={[styles.searchInputContainer, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.white,
              borderWidth: 1,
              borderColor: dark ? colors.card : '#e0e0e0'
            }]}>
              <Feather 
                name="search" 
                size={20} 
                color={dark ? COLORS.secondaryWhite : 'gray'} 
                style={styles.searchIconInput}
              />
              <TextInput
                style={[styles.searchInput, {color: dark ? COLORS.white : COLORS.black}]}
                placeholder={t('inbox.search_placeholder')}
                placeholderTextColor={dark ? COLORS.secondaryWhite : 'gray'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Feather 
                    name="x" 
                    size={18} 
                    color={dark ? COLORS.secondaryWhite : 'gray'} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        {renderOptionsModal()}
        <View style={{ backgroundColor: colors.background, flex: 1 }}>
          <TabView
            navigationState={{ index, routes }}
            renderScene={({ route }) => {
              switch (route.key) {
                case 'first':
                  return <Chats searchQuery={searchQuery} />;
                default:
                  return null;
              }
            }}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={renderTabBar}
            style={{ backgroundColor: colors.background }}
            sceneContainerStyle={{ backgroundColor: colors.background }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,

  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
  moreCircleIcon: {
    width: 24,
    height: 24,
    marginLeft: 12
    
  },
   backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black
    },
  searchBarContainer: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIconInput: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  optionsMenu: {
    borderRadius: 8,
    paddingVertical: 8,
    width: 180,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'absolute',
    // top and right are set inline for dynamic placement
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
  },
})

export default Inbox