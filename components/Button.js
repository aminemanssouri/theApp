import {
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated,
} from 'react-native';
import React, { useRef } from 'react';
import { COLORS, SIZES } from '../constants';

const Button = (props) => {
    const filledBgColor = props.color || COLORS.primary
    const outlinedBgColor = COLORS.white
    const bgColor = props.filled ? filledBgColor : outlinedBgColor
    const textColor = props.filled
        ? COLORS.white || props.textColor
        : props.textColor || COLORS.primary
    const isLoading = props.isLoading || false
    
    // Animation values
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
            }}
        >
            <TouchableOpacity
                style={{
                    ...styles.btn,
                    ...{ backgroundColor: bgColor },
                    ...props.style,
                }}
                onPress={props.onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.8}
                disabled={isLoading}
            >
                {isLoading && isLoading == true ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                    <Text style={{ fontSize: 18, fontFamily: "semiBold", ...{ color: textColor } }}>
                        {props.title}
                    </Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    )
}
const styles = StyleSheet.create({
    btn: {
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        height: 52
    },
})

export default Button