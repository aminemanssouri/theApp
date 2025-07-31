# Adding Workers to Your Booking App

This guide will walk you through setting up the workers functionality in your booking app.

## Steps to Add Workers

### 1. Run the SQL Script

Run the provided SQL script `scripts/complete_worker_setup.sql` in your Supabase SQL Editor:

1. Log in to your Supabase dashboard
2. Navigate to SQL Editor
3. Open the file `scripts/complete_worker_setup.sql`
4. Run the SQL script to create the workers table, worker_services table, and insert sample data

### 2. Test the Worker API Functions

Your app already has the necessary API functions to fetch services with worker data:

- `fetchServicesWithWorkers()` - Gets all services with their associated workers
- `fetchServiceWithWorkers(serviceId)` - Gets a specific service with its workers
- `getServiceById(serviceId)` - Gets service details via the service.js utility
- `getServiceWorkers(serviceId)` - Gets all workers for a specific service

You can test these functions in your app to verify they're working correctly.

### 3. Use the Worker Components

Your app already has a `ServiceWorkers` component that can display workers for a service. To use it:

```jsx
import ServiceWorkers from '../components/ServiceWorkers';

// In your component
const ServiceDetailsScreen = ({ route }) => {
  const { serviceId } = route.params;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      setLoading(true);
      const { service, error } = await getServiceById(serviceId);
      
      if (error) {
        console.error("Error fetching service details:", error);
      } else {
        setService(service);
      }
      
      setLoading(false);
    };
    
    fetchServiceDetails();
  }, [serviceId]);

  return (
    <View style={styles.container}>
      {/* Service details */}
      
      {/* Worker section */}
      {service && service.workers && (
        <ServiceWorkers 
          workers={service.workers} 
          onSelectWorker={(worker) => {
            // Handle worker selection, e.g. navigate to booking screen with worker pre-selected
            console.log('Worker selected:', worker);
          }} 
        />
      )}
      
      {/* Rest of component */}
    </View>
  );
};
```

### 4. Update the ServiceDetails Screen

To incorporate workers into your ServiceDetails screen:

1. Import the ServiceWorkers component
2. Use the getServiceById function to fetch service details including workers
3. Add the ServiceWorkers component to your screen layout

## Data Structure

### Workers Table
- `id`: UUID primary key
- `first_name`: Worker's first name
- `last_name`: Worker's last name
- `bio`: Short biography
- `hourly_rate`: Default hourly rate
- `average_rating`: Average rating (0-5)
- `total_jobs`: Number of completed jobs
- `profile_image_url`: URL to profile image
- `years_experience`: Years of experience
- `specialty`: Worker's specialty area
- `email`: Contact email
- `phone`: Contact phone number
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Worker_Services Table
- `id`: UUID primary key
- `worker_id`: References workers.id
- `service_id`: References services.id
- `custom_price`: Custom price for this worker-service combination
- `is_primary`: Whether this worker is primary for this service
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Next Steps

After setting up the basic worker functionality, you might want to:

1. Add worker profile screens
2. Create a booking flow that allows selecting specific workers
3. Implement a review system for workers
4. Add filtering of services by worker rating or availability

Let me know if you need help with any of these next steps!
