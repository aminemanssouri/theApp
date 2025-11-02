import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import React from 'react';
import { COLORS, SIZES, images } from "../constants";
import ReviewStars from './ReviewStars';
import { t } from '../context/LanguageContext';

const WorkerCard = ({ worker, onSelect }) => {
  return (
    <TouchableOpacity 
      style={styles.workerCard}
      onPress={() => onSelect && onSelect(worker)}
    >
      <Image
        source={images.user5} // Replace with worker.profileImage when available
        style={styles.workerImage}
        resizeMode="cover"
      />
      <View style={styles.workerInfo}>
        <Text style={styles.workerName}>{worker.first_name} {worker.last_name}</Text>
        <View style={styles.ratingContainer}>
          <ReviewStars rating={worker.average_rating} size={14} />
          <Text style={styles.reviewCount}>{t('worker.jobs_count', { count: worker.total_jobs })}</Text>
        </View>
        <Text style={styles.price}>${worker.custom_price || worker.hourly_rate}{t('worker.per_hour')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const ServiceWorkers = ({ workers, onSelectWorker }) => {
  if (!workers || workers.length === 0) {
    return (
      <View style={styles.noWorkersContainer}>
        <Text style={styles.noWorkersText}>{t('worker.none_for_service')}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('worker.available_providers')}</Text>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkerCard 
            worker={item} 
            onSelect={() => onSelectWorker && onSelectWorker(item)} 
          />
        )}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'semiBold',
    marginBottom: 12,
    color: COLORS.greyscale900,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingHorizontal: 8,
  },
  workerCard: {
    width: 180,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  workerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontFamily: 'medium',
    color: COLORS.greyscale900,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 12,
    fontFamily: 'regular',
    color: COLORS.greyscale700,
    marginLeft: 4,
  },
  price: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.primary,
  },
  noWorkersContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noWorkersText: {
    fontSize: 14,
    fontFamily: 'medium',
    color: COLORS.greyscale700,
  }
});

export default ServiceWorkers;
