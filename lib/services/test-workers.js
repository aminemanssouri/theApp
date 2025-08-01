// Import dependencies 
const home = require('./home');
const fetchActiveServices = home.fetchActiveServices;
const transformServices = home.transformServices;

/**
 * Test function to check worker data structure
 */
async function testWorkerDataStructure() {
  try {
    console.log('----------------------------------------------------');
    console.log('TESTING WORKER DATA STRUCTURE');
    console.log('----------------------------------------------------');
    
    // Fetch services with workers
    console.log('Fetching services with workers...');
    const { data: services, error } = await fetchActiveServices(5);
    
    if (error) {
      console.error('Error fetching services:', error);
      return;
    }
    
    if (!services || services.length === 0) {
      console.log('No services found');
      return;
    }
    
    console.log(`Found ${services.length} services`);
    
    // Log each service with its workers
    services.forEach((service, index) => {
      console.log(`\n[SERVICE ${index + 1}] ${service.name} (ID: ${service.id})`);
      console.log('Service data:', JSON.stringify({
        id: service.id,
        name: service.name,
        description: service.description?.substring(0, 30) + '...',
        base_price: service.base_price
      }, null, 2));
      
      if (!service.workers || service.workers.length === 0) {
        console.log('  - No workers for this service');
      } else {
        console.log(`  - Found ${service.workers.length} workers for this service:`);
        
        service.workers.forEach((worker, wIndex) => {
          console.log(`    [WORKER ${wIndex + 1}] Raw worker data:`, JSON.stringify(worker, null, 2));
          
          // Display the key fields we care about
          const displayName = worker.first_name && worker.last_name 
            ? `${worker.first_name} ${worker.last_name}`
            : worker.first_name || 'Unknown Name';
            
          console.log(`    - Worker Name: ${displayName}`);
          console.log(`    - Worker ID: ${worker.id}`);
          console.log(`    - Custom Price: ${worker.custom_price || 'Not set (using service base price)'}`);
        });
      }
    });
    
    console.log('\n----------------------------------------------------');
    console.log('TESTING TRANSFORMED SERVICES');
    console.log('----------------------------------------------------');
    
    // Transform services and check the results
    const transformedServices = transformServices(services);
    console.log(`Transformed ${services.length} services into ${transformedServices.length} service cards`);
    
    transformedServices.forEach((service, index) => {
      console.log(`\n[TRANSFORMED ${index + 1}] ${service.name}`);
      console.log(`  - Provider Name: "${service.providerName}"`);
      console.log(`  - Service ID: ${service.serviceId}`);
      console.log(`  - Has Worker: ${service.hasWorker}`);
      if (service.hasWorker) {
        console.log(`  - Worker ID: ${service.workerId}`);
      }
      console.log(`  - Price: ${service.price}`);
    });
    
    console.log('\n----------------------------------------------------');
    console.log('TEST COMPLETE');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testWorkerDataStructure();
