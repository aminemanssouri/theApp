import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { COLORS, icons } from '../constants';

/**
 * StableSearchInput - A component specifically designed to maintain keyboard focus
 * during search operations by isolating the input field from re-renders.
 */
const StableSearchInput = ({ 
  initialValue = '',
  onSearch,
  onChangeText,
  onFilterPress,
  dark = false
}) => {
  // Local state for the input value
  const [inputValue, setInputValue] = useState(initialValue);
  const inputRef = useRef(null);
  
  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      // Small delay to ensure focus after animation
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
    
    return () => {
      // No need to explicitly blur on unmount
    };
  }, []);

  // Handle text changes locally first
  const handleTextChange = (text) => {
    setInputValue(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  // Handle search submission
  const handleSubmit = () => {
    if (onSearch && inputValue.trim()) {
      onSearch(inputValue);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <TouchableWithoutFeedback>
        <View style={styles.searchContainer}>
          <View style={[
            styles.inputContainer,
            { borderColor: dark ? COLORS.grayscale700 : "#E5E7EB" }
          ]}>
            <Image
              source={icons.search2}
              resizeMode='contain'
              style={styles.searchIcon}
            />
            
            {/* The critical TextInput that maintains focus */}
            <TextInput
              ref={inputRef}
              style={[
                styles.searchInput,
                { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }
              ]}
              value={inputValue}
              onChangeText={handleTextChange}
              placeholder='Search services...'
              placeholderTextColor="#BABABA"
              returnKeyType="search"
              onSubmitEditing={handleSubmit}
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
              blurOnSubmit={false}
              spellCheck={false}
              autoFocus={true}
              keyboardAppearance={dark ? 'dark' : 'light'}
            />
            
            {/* Filter button */}
            <TouchableOpacity onPress={onFilterPress}>
              <Image
                source={icons.filter}
                resizeMode='contain'
                style={[styles.filterIcon, {
                  tintColor: dark ? COLORS.white : COLORS.greyscale900
                }]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    width: '100%',
  },
  searchContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputContainer: {
    height: 50,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#BABABA",
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    padding: 0,
  },
  filterIcon: {
    width: 20,
    height: 20,
    marginLeft: 8,
  }
});

export default StableSearchInput;
