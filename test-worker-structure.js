import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - replace with your actual credentials
// You'll need to import these from your environment file in a real app
const supabaseUrl = 'https://YOUR_SUPABASE_URL.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test function to fetch worker data structure directly
 */
const testWorkerStructure = async () => {
  try {
    console.log('Fetching worker structure test...');
    
    // 1. First, get a service ID to test with
    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('id, name')
      .limit(1);
    
    if (serviceError || !services || services.length === 0) {
      console.error('Error fetching test service:', serviceError);
      return;
    }
    
    const testServiceId = services[0].id;
    console.log(`Using test service: ${services[0].name} (${testServiceId})`);
    
    // 2. Now fetch worker_services for this service
    const { data: workerServices, error: wsError } = await supabase
      .from('worker_services')
      .select(`
        id,
        service_id,
        worker_id,
        custom_price,
        workers(*)
      `)
      .eq('service_id', testServiceId);
    
    if (wsError) {
      console.error('Error fetching worker_services:', wsError);
      return;
    }
    
    console.log(`Found ${workerServices.length} worker_services entries`);
    
    if (workerServices.length === 0) {
      console.log('No workers for this service. Testing with a different query...');
      
      // Try to get any worker_service entry
      const { data: anyWS, error: anyWSError } = await supabase
        .from('worker_services')
        .select('*')
        .limit(1);
      
      if (anyWSError || !anyWS || anyWS.length === 0) {
        console.error('Error fetching any worker_service:', anyWSError);
        console.log('Check if the worker_services table has any data.');
        return;
      }
      
      console.log('Found a worker_service entry:', anyWS[0]);
      
      // Now try to get the worker directly
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('id', anyWS[0].worker_id)
        .single();
      
      if (workerError) {
        console.error('Error fetching worker directly:', workerError);
        return;
      }
      
      console.log('Worker direct fetch result:', worker);
      
      // Now try the join properly
      const { data: wsWithWorker, error: wsWithWorkerError } = await supabase
        .from('worker_services')
        .select(`
          id,
          service_id,
          worker_id,
          custom_price,
          workers(id, first_name, last_name)
        `)
        .eq('id', anyWS[0].id)
        .single();
      
      if (wsWithWorkerError) {
        console.error('Error fetching worker_service with worker:', wsWithWorkerError);
        return;
      }
      
      console.log('Worker service with worker join:', JSON.stringify(wsWithWorker, null, 2));
      
      return;
    }
    
    // 3. Log the structure of the first result
    console.log('First worker_service entry:', JSON.stringify(workerServices[0], null, 2));
    
    // 4. Analyze the workers property to see if it's nested correctly
    const firstWS = workerServices[0];
    if (firstWS.workers) {
      console.log('Workers data is correctly nested:', firstWS.workers);
    } else {
      console.warn('Workers data is not nested correctly. Check your Supabase RLS policies and foreign key relationships.');
      
      // Try fetching the worker directly
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('id', firstWS.worker_id)
        .single();
      
      if (workerError) {
        console.error('Error fetching worker directly:', workerError);
      } else {
        console.log('Worker fetched directly:', worker);
      }
    }
    
  } catch (err) {
    console.error('Test error:', err);
  }
};

// Run the test
testWorkerStructure().then(() => console.log('Test complete.'));

// To run this test, use:
// node test-worker-structure.js

export default testWorkerStructure;
