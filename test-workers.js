import { supabase } from './lib/supabase';

// Simple test script to verify the get_service_workers function
async function testGetServiceWorkers() {
  try {
    console.log('Testing get_service_workers SQL function...');
    
    // Try with service IDs 1, 2, and 3 to increase chances of finding valid data
    for (const serviceId of [1, 2, 3]) {
      console.log(`Testing with service ID: ${serviceId}`);
      
      // Try to call the SQL function directly
      const { data, error } = await supabase
        .rpc('get_service_workers', { service_id_param: serviceId });
        
      if (error) {
        console.error(`Error calling get_service_workers for service ${serviceId}:`, error);
        continue;
      }
      
      console.log(`Success! Found ${data?.length || 0} workers for service ID ${serviceId}`);
      
      // Print the worker data
      if (data && data.length > 0) {
        console.log('First worker sample:');
        console.log(JSON.stringify(data[0], null, 2));
        
        // Break the loop if we found workers
        break;
      }
    }
  } catch (err) {
    console.error('Test script error:', err);
  }
}

// Run the test function
testGetServiceWorkers();
