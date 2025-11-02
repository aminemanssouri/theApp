import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { COLORS, SIZES } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { SvgUri } from 'react-native-svg';

const Category = ({ name, icon, iconColor, backgroundColor, selected = false }) => {
    const { dark } = useTheme();
    const [svgError, setSvgError] = React.useState(false);

    // Convert string URL to proper image source format
    const imageSource = typeof icon === 'string' ? { uri: icon } : icon;
    
    // Check if it's a remote URL and if it's SVG
    const isRemoteImage = typeof icon === 'string' && (icon.startsWith('http://') || icon.startsWith('https://'));
    const isSvg = typeof icon === 'string' && icon.toLowerCase().endsWith('.svg');

  return (
    <View style={styles.container}>
        <View 
           style={[
             styles.iconContainer, 
             { backgroundColor: backgroundColor },
             selected && styles.selectedIconContainer
           ]}>
            {imageSource && isRemoteImage && isSvg && !svgError ? (
                <SvgUri
                    uri={icon}
                    width={32}
                    height={32}
                    fill={iconColor}
                    color={iconColor}
                    onError={() => {
                        setSvgError(true);
                    }}
                />
            ) : imageSource && !isSvg ? (
                <Image
                    source={imageSource}
                    resizeMode='contain'
                    style={[styles.icon, !isRemoteImage && { 
                        tintColor: iconColor
                    }]}
                />
            ) : (
                <View style={[styles.icon, { backgroundColor: iconColor, opacity: 0.3, borderRadius: 12 }]} />
            )}
            
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
        height: 32,
        width: 32
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