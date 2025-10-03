import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../constants';

const DatePickerModal = ({
  open,
  startDate,
  selectedDate,
  onClose,
  onChangeStartDate,
}) => {
  // Parse initial date or set defaults
  const parseInitialDate = () => {
    if (selectedDate && selectedDate !== "12/12/2023") {
      const [day, month, year] = selectedDate.split('/');
      return {
        day: parseInt(day) || 1,
        month: parseInt(month) || 1,
        year: parseInt(year) || 2000
      };
    }
    return { day: 1, month: 1, year: 2000 };
  };

  const initialDate = parseInitialDate();
  const [selectedDay, setSelectedDay] = useState(initialDate.day);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };
  
  const days = Array.from(
    { length: getDaysInMonth(selectedMonth, selectedYear) }, 
    (_, i) => i + 1
  );

  const handleConfirm = () => {
    const formattedDate = `${selectedDay.toString().padStart(2, '0')}/${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`;
    onChangeStartDate(formattedDate);
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial values if cancelled
    setSelectedDay(initialDate.day);
    setSelectedMonth(initialDate.month);
    setSelectedYear(initialDate.year);
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={open}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={handleCancel}
      >
        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Select Date of Birth</Text>
          </View>
          
          <View style={styles.pickerContainer}>
            {/* Day Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Day</Text>
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.pickerItem,
                      selectedDay === day && styles.selectedItem
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedDay === day && styles.selectedItemText
                    ]}>
                      {day.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Month</Text>
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.pickerItem,
                      selectedMonth === index + 1 && styles.selectedItem
                    ]}
                    onPress={() => {
                      setSelectedMonth(index + 1);
                      // Adjust day if needed
                      const maxDays = getDaysInMonth(index + 1, selectedYear);
                      if (selectedDay > maxDays) {
                        setSelectedDay(maxDays);
                      }
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedMonth === index + 1 && styles.selectedItemText
                    ]}>
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Year</Text>
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.pickerItem,
                      selectedYear === year && styles.selectedItem
                    ]}
                    onPress={() => {
                      setSelectedYear(year);
                      // Adjust day if needed
                      const maxDays = getDaysInMonth(selectedMonth, year);
                      if (selectedDay > maxDays) {
                        setSelectedDay(maxDays);
                      }
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedYear === year && styles.selectedItemText
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateLabel}>Selected Date:</Text>
            <Text style={styles.selectedDate}>
              {`${selectedDay.toString().padStart(2, '0')}/${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: SIZES.width * 0.9,
    maxHeight: SIZES.height * 0.7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  headerText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingTop: 20,
    height: 250,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: COLORS.primary,
  },
  pickerItemText: {
    fontSize: 14,
    color: COLORS.black,
  },
  selectedItemText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  selectedDateContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyscale300,
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontSize: 12,
    color: COLORS.greyscale600,
    marginBottom: 5,
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.greyscale300,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DatePickerModal;