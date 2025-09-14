import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from "../constants";
import { fetchAllCategories, transformCategories } from '../lib/services/home';
import Header from '../components/Header';
import Category from '../components/Category';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../context/LanguageContext';

const AllCategories = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    loadAllCategories();
  }, []);

  const loadAllCategories = async () => {
    try {
      setLoading(true);
      const { data: rawCategories, error } = await fetchAllCategories();
      
      if (error) {
        console.error('Error loading all categories:', error);
        return;
      }

      // Transform data to match existing component format
      const transformedCategories = transformCategories(rawCategories);
      setCategories(transformedCategories);
      
    } catch (error) {
      console.error('Error in loadAllCategories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('service.all_categories')} goBack={() => navigation.goBack()} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        categories.length > 0 ? (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            horizontal={false}
            numColumns={4} // Display 4 categories per row
            renderItem={({ item }) => (
              <Category
                name={item.name}
                icon={item.icon}
                iconColor={item.iconColor}
                backgroundColor={item.backgroundColor}
                onPress={() => navigation.navigate("AllServices", { categoryId: item.id, categoryName: item.name })}
              />
            )}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {t('service.no_categories_available')}
            </Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'medium',
    fontSize: 16,
    textAlign: 'center',
  }
});

export default AllCategories;
