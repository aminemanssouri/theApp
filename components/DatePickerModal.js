import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { COLORS } from '../constants';

const DatePickerModal = ({
  open,
  startDate,
  selectedDate,
  onClose,
  onChangeStartDate,
}) => {
  const [selectedStartDate, setSelectedStartDate] = useState(selectedDate);

  const handleDateSelect = (day) => {
    console.log('Date selected:', day); // Debug log
    const formattedDate = `${day.day.toString().padStart(2, '0')}/${day.month.toString().padStart(2, '0')}/${day.year}`;
    console.log('Formatted date:', formattedDate); // Debug log
    setSelectedStartDate(formattedDate);
    onChangeStartDate(formattedDate);
    onClose();
  };

  const handleOnPressStartDate = () => {
    onClose();
  };

  const modalVisible = open;

  // Convert selected date to marked format for calendar
  const getMarkedDates = () => {
    if (!selectedStartDate || selectedStartDate === "Select Date of Birth") {
      return {};
    }
    
    try {
      const [day, month, year] = selectedStartDate.split('/');
      const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('Marked date string:', dateString); // Debug log
      
      return {
        [dateString]: {
          selected: true,
          selectedColor: COLORS.white,
          selectedTextColor: COLORS.primary,
        }
      };
    } catch (error) {
      console.log('Error parsing date:', error); // Debug log
      return {};
    }
  };

  // Convert startDate to proper format for calendar
  const getMinDate = () => {
    if (!startDate) {
      // Default to 100 years ago
      const date = new Date();
      date.setFullYear(date.getFullYear() - 100);
      return date.toISOString().split('T')[0];
    }
    return startDate;
  };

  return (
    <Modal animationType="slide" transparent={true} visible={modalVisible}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={getMarkedDates()}
            minDate={getMinDate()}
            maxDate={new Date().toISOString().split('T')[0]}
            enableSwipeMonths={true}
            hideExtraDays={true}
            disableMonthChange={false}
            firstDay={1}
            hideDayNames={false}
            showWeekNumbers={false}
            onPressArrowLeft={(subtractMonth) => subtractMonth()}
            onPressArrowRight={(addMonth) => addMonth()}
            theme={{
              backgroundColor: COLORS.primary,
              calendarBackground: COLORS.primary,
              textSectionTitleColor: COLORS.white,
              selectedDayBackgroundColor: COLORS.white,
              selectedDayTextColor: COLORS.primary,
              todayTextColor: COLORS.white,
              dayTextColor: COLORS.white,
              textDisabledColor: 'rgba(255,255,255,0.5)',
              dotColor: COLORS.white,
              selectedDotColor: COLORS.primary,
              arrowColor: COLORS.white,
              monthTextColor: COLORS.white,
              indicatorColor: COLORS.white,
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleOnPressStartDate}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    padding: 35,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calendar: {
    borderRadius: 10,
    margin: 0,
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DatePickerModal;