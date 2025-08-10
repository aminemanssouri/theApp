import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react'; // Added useEffect
import { COLORS, SIZES } from '../constants';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

const BookingItem = ({ itemId, name, price, description, onQuantityChange, initialQuantity = 0 }) => {
  // Initialize count with initialQuantity and sync with parent
  const [count, setCount] = useState(initialQuantity);
  const { colors, dark } = useTheme();
  
  // Keep local state in sync with parent
  useEffect(() => {
    setCount(initialQuantity);
  }, [initialQuantity]);

  const handleIncrease = () => {
    const newCount = count + 1;
    setCount(newCount);

    if (onQuantityChange) {
      // Pass itemId to help parent component identify which item changed
      onQuantityChange(newCount);
    }
  };

  const handleDecrease = () => {
    if (count > 0) {
      const newCount = count - 1;
      setCount(newCount); 
      
      if (onQuantityChange) {
        onQuantityChange(newCount);
      }
    }
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: dark ? COLORS.dark2 : COLORS.white,
    }]}>
      <View style={styles.itemInfo}>
        <Text style={[styles.name, { 
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>{name}</Text>
        {price && (
          <Text style={[styles.price, {
            color: COLORS.primary
          }]}>${price}</Text>
        )}
        {description && (
          <Text style={[styles.description, {
            color: dark ? COLORS.white : COLORS.grayscale600
          }]}>{description}</Text>
        )}
      </View>
      <View style={styles.viewContainer}>
        <TouchableOpacity style={styles.iconContainer} onPress={handleDecrease}>
            <AntDesign name="minus" size={16} color={dark ? COLORS.white : "black"} />
        </TouchableOpacity>
        <Text style={[styles.count, { 
          color: dark? COLORS.white : COLORS.greyscale900
        }]}>{count}</Text>
        <TouchableOpacity style={styles.iconContainer} onPress={handleIncrease}>
             <AntDesign name="plus" size={16} color={dark ? COLORS.white : "black"} />
        </TouchableOpacity>
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        minHeight: 70,
        borderRadius: 16,
        flexDirection: "row",
        paddingHorizontal: 12,
        width: SIZES.width - 32,
        justifyContent: "space-between",
        alignItems: 'center',
        marginVertical: 12,
        backgroundColor: COLORS.white,
        shadowColor: COLORS.black,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 0,
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    name: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.black,
        marginBottom: 2,
    },
    price: {
        fontSize: 14,
        fontFamily: "semiBold",
        marginBottom: 2,
    },
    description: {
        fontSize: 12,
        fontFamily: "regular",
    },
    viewContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: 120,
        justifyContent: "space-between"
    },
    iconContainer: {
        height: 38,
        width: 38,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        backgroundColor: COLORS.tansparentPrimary
    },
    count: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.black
    }
})

export default BookingItem