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
import { useI18n } from '../context/LanguageContext';

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
  const { t } = useI18n();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState(null);
  const [count, setCount] = useState(2);

  // Get today's date for minimum date
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  
  // Check if selected date is weekend (Saturday = 6, Sunday = 0)
  const isWeekend = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6;
  };
  
  // Check if selected hour is after 7 PM (19:00)
  const isAfterSevenPM = (hourId) => {
    if (!hourId) return false;
    const hourData = hoursData.find(h => h.id === hourId);
    if (!hourData) return false;
    const [hour] = hourData.hour.split(':');
    return parseInt(hour) >= 19;
  };

  // Filter hours based on selected date
  const getAvailableHours = () => {
    if (!selectedDate) return hoursData;
    
    // Check if selected date is today
    const now = new Date();
    const selected = new Date(selectedDate + 'T00:00:00'); // Ensure proper date parsing
    
    // Compare dates (ignore time)
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDateOnly = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
    const isToday = todayDate.getTime() === selectedDateOnly.getTime();
    
    console.log('🕐 Hour filtering:', {
      selectedDate,
      isToday,
      currentHour: now.getHours(),
      currentMinute: now.getMinutes()
    });
    
    if (!isToday) {
      // If it's a future date, show all hours
      console.log('📅 Future date - showing all hours');
      return hoursData;
    }
    
    // If it's today, filter out past hours
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const filtered = hoursData.filter(hourItem => {
      const [hour, minute] = hourItem.hour.split(':').map(Number);
      
      // Show hour if it's at least 1 hour from now
      const hourDiff = hour - currentHour;
      
      if (hourDiff > 1) return true; // More than 1 hour ahead
      if (hourDiff === 1 && minute >= currentMinute) return true; // Exactly 1 hour ahead or more
      
      return false;
    });
    
    console.log('⏰ Filtered hours for today:', filtered.length, 'out of', hoursData.length);
    return filtered;
  };

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

  // Reset selected hour when date changes (in case previously selected hour is no longer available)
  React.useEffect(() => {
    if (!selectedDate) return;
    
    const availableHours = getAvailableHours();
    if (selectedHour && !availableHours.find(h => h.id === selectedHour)) {
      setSelectedHour(null); // Clear selection if hour is no longer available
    }
  }, [selectedDate, selectedHour]); // Add selectedHour to dependencies
  
  // Calculate end time based on start time and hours
  const calculateEndTime = (startHour, hours) => {
    if (!startHour) return '11:00';
    const hourData = hoursData.find(h => h.id === startHour);
    if (!hourData) return '11:00';
    
    const [hour, minute] = hourData.hour.split(':');
    const endHour = parseInt(hour) + hours;
    
    // Handle overflow past 23:59 (wrap to next day or cap at 23:59)
    if (endHour >= 24) {
      return '23:59'; // Cap at end of day
    }
    
    return `${endHour.toString().padStart(2, '0')}:${minute || '00'}`;
  };
  
  // Calculate price based on hours
   const calculatePrice = (hours) => {
    // Get the hourly rate component
    const hourlyRate = workerRate || 30;
    
    // Get addon costs from basePrice (basePrice = hourlyRate*2 + addonCosts)
    const addonCosts = (basePrice || hourlyRate*2) - (hourlyRate * 2);
    
    // Calculate base price with selected hours + addon costs
    let totalPrice = (hourlyRate * hours) + addonCosts;
    
    // Add €10 surcharge for weekend bookings
    if (isWeekend(selectedDate)) {
      totalPrice += 10;
    }
    
    // Add €10 surcharge for bookings after 7 PM
    if (isAfterSevenPM(selectedHour)) {
      totalPrice += 10;
    }
    
    return totalPrice;
  };

  // Render each hour as a selectable button
  const renderHourItem = ({ item }) => {
    const [hour] = item.hour.split(':');
    const isLateHour = parseInt(hour) >= 19;
    
    return (
      <TouchableOpacity
        style={[
          styles.hourButton,
          selectedHour === item.id && styles.selectedHourButton,
        ]}
        onPress={() => handleHourSelect(item.id)}
      >
        <Text style={[styles.hourText,
        selectedHour === item.id && styles.selectedHourText]}>
          {item.hour}
          {isLateHour && ' (+€10)'}
        </Text>
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
        <Header title={t('booking.details_title')} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { 
            color: dark ? COLORS.white : COLORS.greyscale900 
          }]}>{t('booking.select_date')}</Text>
          
          {isWeekend(selectedDate) && (
            <View style={styles.surchargeNotice}>
              <Text style={styles.surchargeText}>
                ⚠️ {t('booking.weekend_surcharge')}
              </Text>
            </View>
          )}
          
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
              }}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: COLORS.white,
                  selectedTextColor: COLORS.primary,
                  marked: true,
                  dotColor: COLORS.primary,
                }
              }}
              minDate={minDate}
              theme={{
                ...calendarTheme,
                backgroundColor: COLORS.primary,
                calendarBackground: COLORS.primary,
                todayTextColor: COLORS.white,
                selectedDayBackgroundColor: COLORS.white,
                selectedDayTextColor: COLORS.primary,
                arrowColor: COLORS.white,
                dotColor: COLORS.white,
                indicatorColor: COLORS.white,
                monthTextColor: COLORS.white,
                dayTextColor: COLORS.white,
                textSectionTitleColor: COLORS.white,
                textDisabledColor: 'rgba(255, 255, 255, 0.3)',
              }}
              style={[styles.calendar, {
                borderColor: COLORS.white,
                borderWidth: 3,
                backgroundColor: COLORS.primary,
              }]}
            />
          </View>
          
          <View style={styles.ourContainer}>
            <View>
              <Text style={[styles.hourTitle, { 
                color: dark? COLORS.white : COLORS.greyscale900
              }]}>{t('booking.working_hours')}</Text>
              <Text style={[styles.hourSubtitle, { 
                color: dark ? COLORS.grayscale200 : COLORS.grayscale700 
              }]}>{t('booking.cost_increase_after_hours', { hours: 2 })}</Text>
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
          }]}>{t('booking.choose_start_time')}</Text>
          
          {selectedDate && getAvailableHours().length === 0 && (
            <View style={styles.surchargeNotice}>
              <Text style={styles.surchargeText}>
                ⚠️ {t('booking.no_hours_available_today')}
              </Text>
            </View>
          )}
          
          <View style={{ marginVertical: 12 }}>
            <FlatList
              data={getAvailableHours()}
              renderItem={renderHourItem}
              keyExtractor={(item) => item.id.toString()}
              horizontal={true}
              showsVerticalScrollIndicator={false}
            />
          </View>
          
           <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      
      <View style={[styles.bottomContainer, { 
        backgroundColor: colors.background
      }]}>
        <Button
          title={t('booking.continue_with_price', { price: calculatePrice(count) })}
          filled
          style={styles.button}
          onPress={() => {
            if (!selectedDate) {
              alert(t('booking.please_select_date'));
              return;
            }
            if (!selectedHour) {
              alert(t('booking.please_select_start_time'));
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
  surchargeNotice: {
    backgroundColor: COLORS.tansparentPrimary,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  surchargeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: 'medium',
    textAlign: 'center',
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