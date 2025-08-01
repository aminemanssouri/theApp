import { getServiceWorkersWithNames } from './services/workers';

/**
 * A simple test to verify that our worker name fetching approach works
 */
export const testWorkerNames = async () => {
  try {
    console.log('Testing worker name fetching...');
    
    // Test with a known service ID from your data
    const serviceId = 'abe8c7a0-87db-4f56-9deb-268cc6c94367'; // Deep Cleaning
    
    console.log(`Fetching workers for service ID: ${serviceId}`);
    
    const { data: workers, error } = await getServiceWorkersWithNames(serviceId);
    
    if (error) {
      console.error('Error fetching workers:', error);
      return;
    }
    
    console.log(`Found ${workers.length} workers`);
    
    workers.forEach((worker, index) => {
      console.log(`Worker ${index + 1}:`);
      console.log(`  Worker ID: ${worker.worker_id}`);
      console.log(`  First Name: ${worker.first_name}`);
      console.log(`  Last Name: ${worker.last_name}`);
      console.log(`  Full Name: ${worker.worker_full_name}`);
      console.log(`  Custom Price: ${worker.custom_price}`);
    });
    
    return workers;
  } catch (err) {
    console.error('Test failed:', err);
    return [];
  }
};
