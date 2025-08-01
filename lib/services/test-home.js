// Test script for home.js functions
const { supabase } = require('../supabase');
const { 
  fetchServiceCategories, 
  fetchActiveServices, 
  fetchHomepageData,
  transformServices
} = require('./home');

async function testHomeJsFunctions() {
  try {
    console.log('==============================================');
    console.log('TESTING HOME.JS FUNCTIONS');
    console.log('==============================================');
    
    // Test 1: Fetch Service Categories
    console.log('\n1. TESTING SERVICE CATEGORIES');
    const { data: categories, error: categoriesError } = await fetchServiceCategories(5);
    
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    } else {
      console.log(`Found ${categories.length} service categories`);
      if (categories.length > 0) {
        console.log('First category:', categories[0]);
      } else {
        console.log('No categories found in database');
      }
    }
    
    // Test 2: Fetch Active Services
    console.log('\n2. TESTING ACTIVE SERVICES');
    const { data: services, error: servicesError } = await fetchActiveServices(5);
    
    if (servicesError) {
      console.error('Error fetching services:', servicesError);
    } else {
      console.log(`Found ${services.length} active services`);
      if (services.length > 0) {
        console.log('First service:', JSON.stringify(services[0], null, 2));
      } else {
        console.log('No active services found in database');
      }
    }
    
    // Test 3: Transform Services
    console.log('\n3. TESTING TRANSFORM SERVICES');
    if (services && services.length > 0) {
      const transformedServices = transformServices(services);
      console.log(`Transformed ${services.length} services into ${transformedServices.length} UI service items`);
      console.log('First transformed service:', JSON.stringify(transformedServices[0], null, 2));
    } else {
      console.log('No services to transform');
    }
    
    // Test 4: Fetch Homepage Data
    console.log('\n4. TESTING FETCH HOMEPAGE DATA');
    const { categories: homepageCategories, services: homepageServices, error: homepageError } = await fetchHomepageData();
    
    if (homepageError) {
      console.error('Error fetching homepage data:', homepageError);
    } else {
      console.log(`Homepage data contains ${homepageCategories.length} categories and ${homepageServices.length} services`);
      if (homepageServices.length > 0) {
        console.log('First homepage service:', JSON.stringify(homepageServices[0], null, 2));
      }
    }
    
    console.log('\n==============================================');
    console.log('TESTS COMPLETED');
    console.log('==============================================');
  } catch (error) {
    console.error('Test script error:', error);
  }
}

// Run the tests
testHomeJsFunctions();
