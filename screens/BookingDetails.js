import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { Calendar } from 'react-native-calendars';
import { AntDesign } from '@expo/vector-icons';
import { hoursData } from '../data';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';

const BookingDetails = ({ navigation, route }) => {
  const { 
    serviceId, 
    serviceName, 
    workerId, 
    workerName, 
    workerRate,
    basePrice,  // Get the basePrice that includes addon costs
    addons      // Get the addons array
  } = route.params || {};
  const { colors, dark } = useTheme();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState(null);
  const [count, setCount] = useState(2);

  // Get today's date for minimum date
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleIncrease = () => {
    setCount(count + 1);
  };

  const handleDecrease = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  // Function to handle hour selection
  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
  };
  
  // Calculate end time based on start time and hours
  const calculateEndTime = (startHour, hours) => {
    if (!startHour) return '11:00';
    const hourData = hoursData.find(h => h.id === startHour);
    if (!hourData) return '11:00';
    
    const [hour] = hourData.hour.split(':');
    const endHour = parseInt(hour) + hours;
    return `${endHour.toString().padStart(2, '0')}:00`;
  };
  
  // Calculate price based on hours
   const calculatePrice = (hours) => {
    // Get the hourly rate component
    const hourlyRate = workerRate || 30;
    
    // Get addon costs from basePrice (basePrice = hourlyRate*2 + addonCosts)
    const addonCosts = (basePrice || hourlyRate*2) - (hourlyRate * 2);
    
    // Calculate new price with selected hours + addon costs
    return (hourlyRate * hours) + addonCosts;
  };

  // Render each hour as a selectable button
  const renderHourItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.hourButton,
          selectedHour === item.id && styles.selectedHourButton,
        ]}
        onPress={() => handleHourSelect(item.id)}
      >
        <Text style={[styles.hourText,
        selectedHour === item.id && styles.selectedHourText]}>{item.hour}</Text>
      </TouchableOpacity>
    );
  };

  // Custom theme for calendar
  const calendarTheme = {
    backgroundColor: dark ? COLORS.dark2 : COLORS.white,
    calendarBackground: dark ? COLORS.dark2 : COLORS.white,
    textSectionTitleColor: dark ? COLORS.grayscale200 : COLORS.grayscale700,
    textSectionTitleDisabledColor: dark ? COLORS.grayscale600 : COLORS.grayscale400,
    selectedDayBackgroundColor: COLORS.primary,
    selectedDayTextColor: COLORS.white,
    todayTextColor: COLORS.primary,
    dayTextColor: dark ? COLORS.white : COLORS.greyscale900,
    textDisabledColor: dark ? COLORS.grayscale600 : COLORS.grayscale400,
    dotColor: COLORS.primary,
    selectedDotColor: COLORS.white,
    arrowColor: COLORS.primary,
    disabledArrowColor: dark ? COLORS.grayscale600 : COLORS.grayscale400,
    monthTextColor: dark ? COLORS.white : COLORS.greyscale900,
    indicatorColor: COLORS.primary,
    textDayFontFamily: 'regular',
    textMonthFontFamily: 'semiBold',
    textDayHeaderFontFamily: 'medium',
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Booking Details" />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { 
            color: dark ? COLORS.white : COLORS.greyscale900 
          }]}>Select Date</Text>
          
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
              }}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: COLORS.primary,
                  selectedTextColor: COLORS.white
                }
              }}
              minDate={minDate}
              theme={calendarTheme}
              style={[styles.calendar, {
                borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
              }]}
            />
          </View>
          
          <View style={styles.ourContainer}>
            <View>
              <Text style={[styles.hourTitle, { 
                color: dark? COLORS.white : COLORS.greyscale900
              }]}>Working Hours</Text>
              <Text style={[styles.hourSubtitle, { 
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700 
              }]}>Cost increase after 2 hrs of work</Text>
            </View>
            <View style={styles.viewContainer}>
              <TouchableOpacity style={styles.iconContainer} onPress={handleDecrease}>
                <AntDesign name="minus" size={16} color={dark ? COLORS.white : "black"} />
              </TouchableOpacity>
              <Text style={[styles.count, {
                color: dark ? COLORS.white : COLORS.black
              }]}>{count}</Text>
              <TouchableOpacity style={styles.iconContainer} onPress={handleIncrease}>
                <AntDesign name="plus" size={16} color={dark ? COLORS.white : "black"} />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={[styles.title, { 
            color: dark? COLORS.white : COLORS.greyscale900
          }]}>Choose Start Time</Text>
          <View style={{ marginVertical: 12 }}>
            <FlatList
              data={hoursData}
              renderItem={renderHourItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal={true}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>
      </View>

      
      <View style={[styles.bottomContainer, { 
        backgroundColor: colors.background
      }]}>
        <Button
          title={`Continue - $${calculatePrice(count)}`}
          filled
          style={styles.button}
          onPress={() => {
            if (!selectedDate) {
              alert('Please select a date');
              return;
            }
            if (!selectedHour) {
              alert('Please select a start time');
              return;
            }
            
            const hourData = hoursData.find(h => h.id === selectedHour);
            navigation.navigate("YourAddress", {
              serviceId,
              serviceName,
              workerId,
              workerName,
              bookingDate: selectedDate,
              startTime: hourData?.hour || '09:00',
              endTime: calculateEndTime(selectedHour, count),
              workingHours: count,
              price: calculatePrice(count),
              addons: route.params?.addons || [] // Pass addons from previous screen
            })
          }}
        />
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  title: {
    fontSize: 16,
    fontFamily: "bold",
    color: COLORS.black,
    marginTop: 12
  },
  calendarContainer: {
    marginVertical: 16,
  },
  calendar: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  ourContainer: {
    width: SIZES.width - 32,
    height: 72,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hourTitle: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.black,
    marginBottom: 12
  },
  hourSubtitle: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.black,
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
  },
  hourButton: {
    padding: 10,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 5,
    borderColor: COLORS.primary,
    borderWidth: 1.4
  },
  selectedHourButton: {
    backgroundColor: COLORS.primary,
  },
  selectedHourText: {
    fontSize: 12,
    fontFamily: 'medium',
    color: COLORS.white
  },
  hourText: {
    fontSize: 12,
    fontFamily: 'medium',
    color: COLORS.primary
  },
  bottomContainer: {
    position: "absolute",
    bottom: 22,
    left: 0,
    right: 0,
    width: "100%",
    height: 54,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: "center",
    backgroundColor: COLORS.white
  },
  button: {
    width: SIZES.width - 32,
    height: 54,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary
  }
})

export default BookingDetails