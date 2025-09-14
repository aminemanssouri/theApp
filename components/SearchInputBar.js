import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { COLORS, icons } from '../constants';
import { t } from '../context/LanguageContext';

/**
 * A standalone search input component that properly maintains focus
 */
const SearchInputBar = forwardRef(({ 
  initialValue = '',
  onSearch,
  onChangeText,
  placeholderText = t('search.search_services'),
  dark = false,
  showFilter = false,
  onFilterPress
}, ref) => {
  // Local state for input value
  const [inputValue, setInputValue] = useState(initialValue);
  const inputRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    clear: () => {
      setInputValue('');
      if (inputRef.current) {
        inputRef.current.clear();
      }
    },
    getValue: () => inputValue
  }));

  // Handle text input changes locally
  const handleTextChange = (text) => {
    setInputValue(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  // Handle search submission
  const handleSubmitEditing = () => {
    if (onSearch && inputValue.trim()) {
      onSearch(inputValue);
    }
  };

  return (
    <View style={[
      styles.searchContainer, 
      { borderColor: dark ? COLORS.grayscale700 : "#E5E7EB" }
    ]}>
      <TouchableOpacity>
        <Image
          source={icons.search2}
          resizeMode='contain'
          style={styles.searchIcon}
        />
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        style={[
          styles.searchInput, 
          { color: dark ? COLORS.secondaryWhite : COLORS.greyscale900 }
        ]}
        value={inputValue}
        onChangeText={handleTextChange}
        placeholder={placeholderText}
        placeholderTextColor="#BABABA"
        returnKeyType="search"
        onSubmitEditing={handleSubmitEditing}
        clearButtonMode="while-editing"
        autoCapitalize="none"
        blurOnSubmit={false}
        autoCorrect={false}
        underlineColorAndroid="transparent"
        keyboardType="default"
        contextMenuHidden={false}
      />

      {showFilter && (
        <TouchableOpacity onPress={onFilterPress}>
          <Image
            source={icons.filter}
            resizeMode='contain'
            style={[styles.filterIcon, { 
              tintColor: dark ? COLORS.white : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  searchContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    height: 20,
    width: 20,
    tintColor: "#BABABA",
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    padding: 0
  },
  filterIcon: {
    width: 20,
    height: 20,
    marginLeft: 8,
    tintColor: COLORS.black
  }
});

export default SearchInputBar;
