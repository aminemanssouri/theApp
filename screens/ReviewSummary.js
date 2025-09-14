import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES, icons, illustrations } from "../constants";
import Header from "../components/Header";
import { ScrollView } from "react-native-virtualized-view";
import Button from "../components/Button";
import { useTheme } from "../theme/ThemeProvider";
import reviewsService from "../lib/services/reviews";
import { t } from "../context/LanguageContext";

const ReviewSummary = ({ navigation, route }) => {
  const { dark } = useTheme();
  const { bookingId, displayData } = route.params;
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const response = await reviewsService.create({
        rating: 0,
        comment: "",
        bookingId,
      });

      if (response.success) {
        setIsModalVisible(true);
      } else {
        Alert.alert(t("reviews.errors.error"), response.error || t("reviews.errors.failed"));
      }
    } catch (error) {
      console.error("Error confirming booking:", error);
      Alert.alert(t("reviews.errors.error"), t("reviews.errors.try_again"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModalVisible) {
      const timer = setTimeout(() => {
        setIsModalVisible(false);
        navigation.navigate("BookingSuccessful");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isModalVisible, navigation]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: dark ? COLORS.dark1 : COLORS.white }}
    >
      <Header title={t("reviews.header")} onPress={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite },
          ]}
        >
          {/* Service */}
          <View style={styles.view}>
            <Text style={styles.viewLeft}>{t("reviews.labels.services")}</Text>
            <Text
              style={[
                styles.viewRight,
                { color: dark ? COLORS.white : COLORS.greyscale900 },
              ]}
            >
              {displayData.service}
            </Text>
          </View>

          {/* Category */}
          <View style={styles.view}>
            <Text style={styles.viewLeft}>{t("reviews.labels.category")}</Text>
            <Text
              style={[
                styles.viewRight,
                { color: dark ? COLORS.white : COLORS.greyscale900 },
              ]}
            >
              {displayData.category}
            </Text>
          </View>

          {/* Workers */}
          <View style={styles.view}>
            <Text style={styles.viewLeft}>{t("reviews.labels.workers")}</Text>
            <View style={styles.workerView}>
              <Image
                source={illustrations.worker}
                resizeMode="contain"
                style={styles.workerImage}
              />
              <Text
                style={[
                  styles.viewRight,
                  { color: dark ? COLORS.white : COLORS.greyscale900 },
                ]}
              >
                {displayData.worker}
              </Text>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.view}>
            <Text style={styles.viewLeft}>{t("reviews.labels.date_time")}</Text>
            <Text
              style={[
                styles.viewRight,
                { color: dark ? COLORS.white : COLORS.greyscale900 },
              ]}
            >
              {displayData.dateTime}
            </Text>
          </View>

          {/* Hours */}
          <View style={styles.view}>
            <Text style={styles.viewLeft}>{t("reviews.labels.hours")}</Text>
            <Text
              style={[
                styles.viewRight,
                { color: dark ? COLORS.white : COLORS.greyscale900 },
              ]}
            >
              {displayData.hours}
            </Text>
          </View>
        </View>

        {/* Price Details */}
        <View
          style={[
            styles.card,
            { backgroundColor: dark ? COLORS.dark2 : COLORS.tertiaryWhite },
          ]}
        >
          <View style={styles.view}>
            <Text style={styles.viewLeft}>{t("reviews.labels.amount")}</Text>
            <Text
              style={[
                styles.viewRight,
                { color: dark ? COLORS.white : COLORS.greyscale900 },
              ]}
            >
              ${displayData.amount}
            </Text>
          </View>
          <View style={styles.view}>
            <Text style={styles.viewLeft}>{t("reviews.labels.tax")}</Text>
            <Text
              style={[
                styles.viewRight,
                { color: dark ? COLORS.white : COLORS.greyscale900 },
              ]}
            >
              ${displayData.tax}
            </Text>
          </View>
          <View style={styles.view}>
            <Text style={styles.totalLabel}>{t("reviews.labels.total")}</Text>
            <Text
              style={[
                styles.totalValue,
                { color: dark ? COLORS.white : COLORS.greyscale900 },
              ]}
            >
              ${displayData.total}
            </Text>
          </View>
        </View>

        <Button
          title={loading ? t("reviews.buttons.loading") : t("reviews.buttons.confirm")}
          filled
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          disabled={loading}
        />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image source={icons.check} style={styles.modalIcon} />
              <Text style={styles.modalText}>{t("reviews.success")}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default ReviewSummary;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
  },
  view: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  viewLeft: {
    fontSize: SIZES.medium,
    color: COLORS.greyscale500,
  },
  viewRight: {
    fontSize: SIZES.medium,
    fontWeight: "600",
  },
  workerView: {
    flexDirection: "row",
    alignItems: "center",
  },
  workerImage: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  totalLabel: {
    fontSize: SIZES.medium,
    fontWeight: "600",
    color: COLORS.primary,
  },
  totalValue: {
    fontSize: SIZES.medium,
    fontWeight: "700",
  },
  confirmButton: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
  },
  modalIcon: {
    width: 48,
    height: 48,
    marginBottom: 10,
  },
  modalText: {
    fontSize: SIZES.medium,
    fontWeight: "600",
    color: COLORS.greyscale900,
  },
});
