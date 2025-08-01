import { supabase } from '../supabase';

/**
 * This function is meant to be used within the React Native app
 * to test Supabase connections and worker data structure.
 * 
 * You can call it from any component with:
 * import { testWorkerQueries } from '../lib/services/worker-data-test';
 * 
 * Then call it in a useEffect or button press:
 * useEffect(() => {
 *   testWorkerQueries();
 * }, []);
 */
export const testWorkerQueries = async () => {
  try {
    console.log('---- TESTING WORKER QUERIES ----');
    
    // Query services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(2);
      
    if (servicesError) {
      console.error('Error querying services:', servicesError);
      return;
    }
    
    console.log(`Found ${services.length} services`);
    
    if (services.length === 0) {
      console.log('No services found to test with');
      return;
    }
    
    // Get a service ID to test with
    const serviceId = services[0].id;
    console.log(`Testing with service: ${services[0].name} (ID: ${serviceId})`);
    
    // Query workers for this service
    console.log('Querying worker_services table...');
    const { data: workerServices, error: wsError } = await supabase
      .from('worker_services')
      .select(`
        *,
        workers(
          id,
          first_name, 
          last_name,
          bio,
          hourly_rate,
          average_rating,
          total_jobs
        )
      `)
      .eq('service_id', serviceId);
      
    if (wsError) {
      console.error('Error querying worker_services:', wsError);
      return;
    }
    
    console.log(`Found ${workerServices.length} workers for this service`);
    console.log('Raw worker_services data:', JSON.stringify(workerServices, null, 2));
    
    // Extract worker information and display
    console.log('\nExtracted worker information:');
    workerServices.forEach((ws, index) => {
      console.log(`\nWorker ${index + 1}:`);
      
      // Check if workers property exists and has the expected structure
      if (ws.workers) {
        const worker = ws.workers;
        console.log(`ID: ${worker.id}`);
        console.log(`Name: ${worker.first_name} ${worker.last_name || ''}`);
        console.log(`Custom price: ${ws.custom_price || 'Using default price'}`);
      } else {
        console.log('WARNING: workers property is missing or null!');
        console.log('Full worker service record:', ws);
      }
    });
    
    console.log('\n---- TEST COMPLETE ----');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
};

// Export the test function
export default testWorkerQueries;
