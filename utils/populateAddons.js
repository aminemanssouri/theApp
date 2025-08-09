import { supabase } from '../lib/supabase';

/**
 * Populate sample addons for testing
 * Run this function in your app to add sample data
 */
export const populateServiceAddons = async () => {
  try {
    // First, let's get the available services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name')
      .limit(5);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return { success: false, error: 'Failed to fetch services' };
    }

    if (!services || services.length === 0) {
      return { success: false, error: 'No services found. Please create services first.' };
    }

    console.log('Found services:', services);

    // Sample addons for each service
    const sampleAddons = [];

    // For each service, add some relevant addons
    services.forEach((service, index) => {
      const serviceName = service.name.toLowerCase();
      
      if (serviceName.includes('clean')) {
        // Cleaning service addons
        sampleAddons.push(
          {
            service_id: service.id,
            name: 'Deep Carpet Cleaning',
            description: 'Professional deep cleaning of carpets and rugs',
            price: 25.00
          },
          {
            service_id: service.id,
            name: 'Window Cleaning',
            description: 'Interior and exterior window cleaning',
            price: 15.00
          },
          {
            service_id: service.id,
            name: 'Refrigerator Cleaning',
            description: 'Deep cleaning of refrigerator interior',
            price: 20.00
          },
          {
            service_id: service.id,
            name: 'Oven Deep Clean',
            description: 'Professional oven interior cleaning',
            price: 30.00
          }
        );
      } else if (serviceName.includes('plumb')) {
        // Plumbing service addons
        sampleAddons.push(
          {
            service_id: service.id,
            name: 'Pipe Inspection',
            description: 'Video inspection of pipes',
            price: 50.00
          },
          {
            service_id: service.id,
            name: 'Drain Cleaning',
            description: 'Professional drain cleaning',
            price: 40.00
          },
          {
            service_id: service.id,
            name: 'Emergency Service',
            description: 'After-hours emergency service',
            price: 80.00
          }
        );
      } else if (serviceName.includes('electric')) {
        // Electrical service addons
        sampleAddons.push(
          {
            service_id: service.id,
            name: 'Outlet Installation',
            description: 'Install new electrical outlets',
            price: 35.00
          },
          {
            service_id: service.id,
            name: 'Safety Inspection',
            description: 'Electrical safety check',
            price: 55.00
          }
        );
      } else {
        // Generic addons for other services
        sampleAddons.push(
          {
            service_id: service.id,
            name: 'Premium Service',
            description: 'Enhanced service with premium tools',
            price: 25.00
          },
          {
            service_id: service.id,
            name: 'Express Service',
            description: 'Faster completion time',
            price: 20.00
          },
          {
            service_id: service.id,
            name: 'Weekend Service',
            description: 'Available on weekends',
            price: 15.00
          }
        );
      }
    });

    // Insert the addons
    const { data, error } = await supabase
      .from('service_addons')
      .insert(sampleAddons)
      .select();

    if (error) {
      console.error('Error inserting addons:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully created addons:', data);
    return { 
      success: true, 
      message: `Created ${data.length} addons for ${services.length} services`,
      addons: data 
    };

  } catch (error) {
    console.error('Error in populateServiceAddons:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check existing addons for a service
 */
export const checkServiceAddons = async (serviceId) => {
  try {
    const { data, error } = await supabase
      .from('service_addons')
      .select('*')
      .eq('service_id', serviceId);

    if (error) {
      console.error('Error fetching addons:', error);
      return { success: false, error: error.message };
    }

    return { success: true, addons: data };
  } catch (error) {
    console.error('Error in checkServiceAddons:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all service addons (for testing)
 */
export const clearAllAddons = async () => {
  try {
    const { error } = await supabase
      .from('service_addons')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error clearing addons:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: 'All addons cleared' };
  } catch (error) {
    console.error('Error in clearAllAddons:', error);
    return { success: false, error: error.message };
  }
};
