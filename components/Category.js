import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { COLORS, SIZES } from '../constants';
import { useTheme } from '../theme/ThemeProvider';

const Category = ({ name, icon, iconColor, backgroundColor, selected = false }) => {
    const { dark } = useTheme();

  return (
    <View style={styles.container}>
        <View 
           style={[
             styles.iconContainer, 
             { backgroundColor: backgroundColor },
             selected && styles.selectedIconContainer
           ]}>
            <Image
                source={icon}
                resizeMode='contain'
                style={[styles.icon, { 
                    tintColor: iconColor
                }]}
            />
        </View>
        <Text style={[
          styles.name, 
          { color: dark ? COLORS.white : COLORS.greyscale900 },
          selected && styles.selectedName
        ]}>
          {name}
        </Text>
    </View>
  )
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 5,
        width: 75, // Smaller width for horizontal scrolling
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8
    },
    selectedIconContainer: {
        borderWidth: 2,
        borderColor: COLORS.primary
    },
    icon: {
        height: 24,
        width: 24
    },
    name: {
        fontSize: 14,
        fontFamily: "medium",
        color: COLORS.black
    },
    selectedName: {
        color: COLORS.primary,
        fontFamily: "bold"
    }
})

export default Category