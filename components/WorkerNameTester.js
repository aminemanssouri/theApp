import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { fetchActiveServices, transformServices } from '../lib/services/home';

// This is a test component you can add to any screen
const WorkerNameTester = () => {
  const [results, setResults] = React.useState({
    loading: false,
    rawServices: [],
    transformedServices: [],
    error: null
  });

  const runTest = async () => {
    try {
      setResults(prev => ({ ...prev, loading: true, error: null }));
      
      // Step 1: Fetch services with workers
      console.log('Fetching services with workers...');
      const { data: servicesWithWorkers, error } = await fetchActiveServices(10);
      
      if (error) {
        console.error('Error fetching services:', error);
        setResults(prev => ({ 
          ...prev, 
          loading: false, 
          error: `Failed to fetch services: ${error.message || JSON.stringify(error)}` 
        }));
        return;
      }
      
      if (!servicesWithWorkers || servicesWithWorkers.length === 0) {
        setResults(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'No services found in the database' 
        }));
        return;
      }
      
      console.log(`Found ${servicesWithWorkers.length} services`);
      
      // Step 2: Transform services to include worker names
      console.log('Transforming services...');
      const transformed = transformServices(servicesWithWorkers);
      
      console.log(`Transformed into ${transformed.length} service cards`);
      
      // Step 3: Update results
      setResults({
        loading: false,
        rawServices: servicesWithWorkers,
        transformedServices: transformed,
        error: null
      });
    } catch (err) {
      console.error('Test failed:', err);
      setResults(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Exception: ${err.message || JSON.stringify(err)}` 
      }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worker Name Tester</Text>
      
      <Button 
        title={results.loading ? "Running Test..." : "Test Worker Names"} 
        onPress={runTest}
        disabled={results.loading}
      />
      
      {results.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{results.error}</Text>
        </View>
      )}
      
      {results.transformedServices.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>
            Service Cards ({results.transformedServices.length})
          </Text>
          
          {results.transformedServices.map((service, index) => (
            <View key={service.id} style={styles.serviceCard}>
              <Text style={styles.serviceTitle}>
                {index + 1}. {service.name}
              </Text>
              <Text style={styles.serviceDetail}>
                <Text style={styles.label}>Provider:</Text> {service.providerName}
              </Text>
              <Text style={styles.serviceDetail}>
                <Text style={styles.label}>Has Worker:</Text> {service.hasWorker ? 'Yes' : 'No'}
              </Text>
              {service.hasWorker && service.worker && (
                <>
                  <Text style={styles.serviceDetail}>
                    <Text style={styles.label}>Worker ID:</Text> {service.workerId}
                  </Text>
                  <Text style={styles.serviceDetail}>
                    <Text style={styles.label}>First Name:</Text> {service.worker.first_name || 'N/A'}
                  </Text>
                  <Text style={styles.serviceDetail}>
                    <Text style={styles.label}>Last Name:</Text> {service.worker.last_name || 'N/A'}
                  </Text>
                </>
              )}
              <Text style={styles.serviceDetail}>
                <Text style={styles.label}>Price:</Text> ${service.price}
              </Text>
            </View>
          ))}
          
          <Text style={styles.sectionTitle}>
            Raw Services with Workers ({results.rawServices.length})
          </Text>
          
          {results.rawServices.map((service, index) => (
            <View key={service.id} style={styles.serviceCard}>
              <Text style={styles.serviceTitle}>
                {index + 1}. {service.name}
              </Text>
              <Text style={styles.serviceDetail}>
                <Text style={styles.label}>Workers Count:</Text> {service.workers?.length || 0}
              </Text>
              {service.workers && service.workers.map((worker, wIndex) => (
                <View key={worker.id} style={styles.workerItem}>
                  <Text style={styles.workerTitle}>Worker {wIndex + 1}:</Text>
                  <Text style={styles.workerDetail}>
                    <Text style={styles.label}>ID:</Text> {worker.id}
                  </Text>
                  <Text style={styles.workerDetail}>
                    <Text style={styles.label}>Name:</Text> {worker.first_name} {worker.last_name}
                  </Text>
                  <Text style={styles.workerDetail}>
                    <Text style={styles.label}>Custom Price:</Text> {worker.custom_price || 'N/A'}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  errorText: {
    color: '#cc0000',
  },
  resultsContainer: {
    marginTop: 16,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 4,
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  serviceDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
  },
  workerItem: {
    marginLeft: 12,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  workerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workerDetail: {
    fontSize: 13,
    marginBottom: 2,
  }
});

export default WorkerNameTester;
