import { supabase } from './lib/supabase';

// Test SQL function with a specific service ID that we know has workers
async function testSQLFunction() {
  try {
    console.log('🔍 Testing SQL function with specific service IDs...');
    
    // Use IDs from the sample data you provided earlier
    const testServiceIds = [
      '171abcb1-8aa7-4a0f-9542-ebfea6abd94d', // Plumbing Repair
      'e617abe0-b40e-44bc-af63-db84e09fc85e', // Pipe Repair
      'b2dee0a4-4a81-434d-a7c8-831ffb375443'  // Pet Grooming
    ];
    
    for (const serviceId of testServiceIds) {
      console.log(`\n🔍 Testing service ID: ${serviceId}`);
      
      // Call the SQL function directly
      const { data: workers, error } = await supabase
        .rpc('get_service_workers', { service_id_param: serviceId });
      
      if (error) {
        console.error(`❌ Error calling get_service_workers for ${serviceId}:`, error);
        continue;
      }
      
      console.log(`✅ Found ${workers?.length || 0} workers for service ID ${serviceId}`);
      
      if (workers && workers.length > 0) {
        console.log('First worker:', workers[0]);
      } else {
        console.log('No workers found for this service.');
        
        // Test if there are worker_services records for this service (direct query)
        const { data: workerServices, error: wsError } = await supabase
          .from('worker_services')
          .select(`id, worker_id, service_id`)
          .eq('service_id', serviceId);
        
        if (wsError) {
          console.error(`❌ Error fetching worker_services:`, wsError);
        } else {
          console.log(`Found ${workerServices?.length || 0} worker_services records for this service ID`);
          
          if (workerServices && workerServices.length > 0) {
            console.log('First worker_service record:', workerServices[0]);
          }
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Test error:', err);
  }
}

// Run the test
testSQLFunction();
