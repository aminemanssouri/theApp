import { supabase } from './lib/supabase';

async function debugServiceData() {
  try {
    console.log('🔍 DEBUG: Testing Supabase connection...');
    
    // 1. Test basic services query
    console.log('1. Getting services...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        id, 
        name, 
        description, 
        base_price,
        is_active,
        created_at,
        category_id
      `)
      .eq('is_active', true)
      .limit(3);
      
    if (servicesError) {
      console.error('❌ ERROR fetching services:', servicesError);
      return;
    }
    
    console.log('✅ Found services:', services?.length || 0);
    if (services && services.length > 0) {
      console.log('Sample service:', services[0]);
      
      // 2. Test get_service_workers SQL function with first service
      const serviceId = services[0].id;
      console.log(`2. Testing get_service_workers with service ID ${serviceId}...`);
      
      const { data: workers, error: workersError } = await supabase
        .rpc('get_service_workers', { service_id_param: serviceId });
        
      if (workersError) {
        console.error('❌ ERROR calling get_service_workers:', workersError);
        return;
      }
      
      console.log(`✅ Found ${workers?.length || 0} workers for service ${serviceId}`);
      if (workers && workers.length > 0) {
        console.log('Sample worker data:', workers[0]);
      }
      
      // 3. Test direct join query
      console.log(`3. Testing direct join query for service ID ${serviceId}...`);
      const { data: workerServices, error: wsError } = await supabase
        .from('worker_services')
        .select(`
          id,
          worker_id,
          service_id,
          custom_price,
          workers (
            id,
            first_name,
            last_name
          )
        `)
        .eq('service_id', serviceId);
        
      if (wsError) {
        console.error('❌ ERROR fetching worker_services:', wsError);
        return;
      }
      
      console.log(`✅ Found ${workerServices?.length || 0} worker services for service ${serviceId}`);
      if (workerServices && workerServices.length > 0) {
        console.log('Sample worker service data:', workerServices[0]);
      }
    }
  } catch (err) {
    console.error('❌ DEBUG ERROR:', err);
  }
}

// Run the debug function
debugServiceData();
