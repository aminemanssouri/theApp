// Direct Supabase query test script for React Native
import { supabase } from '../supabase';

/**
 * Test function to directly query Supabase tables
 */
async function testDirectSupabaseQueries() {
  try {
    console.log('----------------------------------------------------');
    console.log('TESTING DIRECT SUPABASE QUERIES');
    console.log('----------------------------------------------------');
    
    // 1. First, let's check the services table
    console.log('\nQuerying services table...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(5);
      
    if (servicesError) {
      console.error('Error querying services:', servicesError);
    } else {
      console.log(`Found ${services.length} services`);
      if (services.length > 0) {
        console.log('First service:', JSON.stringify(services[0], null, 2));
      }
    }
    
    // 2. Check the workers table
    console.log('\nQuerying workers table...');
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .limit(5);
      
    if (workersError) {
      console.error('Error querying workers:', workersError);
    } else {
      console.log(`Found ${workers.length} workers`);
      if (workers.length > 0) {
        console.log('Sample workers:');
        workers.forEach((worker, i) => {
          console.log(`Worker ${i + 1}: ${worker.first_name} ${worker.last_name || ''} (ID: ${worker.id})`);
        });
      }
    }
    
    // 3. Check the worker_services junction table
    console.log('\nQuerying worker_services junction table...');
    const { data: workerServices, error: wsError } = await supabase
      .from('worker_services')
      .select('*')
      .limit(10);
      
    if (wsError) {
      console.error('Error querying worker_services:', wsError);
    } else {
      console.log(`Found ${workerServices.length} worker-service relationships`);
      if (workerServices.length > 0) {
        console.log('Sample worker-service relationships:');
        console.log(JSON.stringify(workerServices.slice(0, 3), null, 2));
      }
    }
    
    // 4. Do a joined query to check the relationship
    console.log('\nTesting joined query (worker_services with workers)...');
    if (services && services.length > 0) {
      const serviceId = services[0].id;
      console.log(`Getting workers for service ID: ${serviceId}`);
      
      const { data: joinedData, error: joinedError } = await supabase
        .from('worker_services')
        .select(`
          *,
          workers(
            id,
            first_name,
            last_name
          )
        `)
        .eq('service_id', serviceId);
        
      if (joinedError) {
        console.error('Error with joined query:', joinedError);
      } else {
        console.log(`Found ${joinedData.length} results from joined query`);
        console.log('Joined data structure:');
        console.log(JSON.stringify(joinedData, null, 2));
        
        // Extract and display worker names
        console.log('\nExtracted worker names:');
        joinedData.forEach((item, i) => {
          if (item.workers) {
            const worker = item.workers;
            console.log(`${i + 1}. ${worker.first_name} ${worker.last_name || ''}`);
          } else {
            console.log(`${i + 1}. Worker data missing or malformed`);
          }
        });
      }
    }
    
    console.log('\n----------------------------------------------------');
    console.log('TEST COMPLETE');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testDirectSupabaseQueries();
