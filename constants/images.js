import { REACT_APP_SUPABASE_URL } from '@env';

// Supabase Storage base URL
const STORAGE_BASE_URL = `${REACT_APP_SUPABASE_URL}/storage/v1/object/public/app-assets/assets`;

// Helper function to get asset URL
const getAssetUrl = (path) => `${STORAGE_BASE_URL}/${path}`;

const ornament = { uri: getAssetUrl('images/ornament.png') };

const onboarding1 = { uri: getAssetUrl('images/onboarding1.png') };
const onboarding2 = { uri: getAssetUrl('images/onboarding2.png') };
const onboarding3 = { uri: getAssetUrl('images/onboarding3.png') };
const onboarding4 = { uri: getAssetUrl('images/onboarding4.png') };
const onboarding5 = { uri: getAssetUrl('images/onboarding5.png') };
const onboarding6 = { uri: getAssetUrl('images/onboarding6.png') };
const onboarding7 = { uri: getAssetUrl('images/onboarding7.png') };
const onboarding8 = { uri: getAssetUrl('images/onboarding8.png') };
const onboarding9 = { uri: getAssetUrl('images/onboarding9.png') };
const onboarding10 = { uri: getAssetUrl('images/onboarding10.png') };
const avatarurl = { uri: getAssetUrl('images/user.png') };
const user1 = { uri: getAssetUrl('images/users/user1.jpeg') };
const user2 = { uri: getAssetUrl('images/users/user2.jpeg') };
const user3 = { uri: getAssetUrl('images/users/user3.jpeg') };
const user4 = { uri: getAssetUrl('images/users/user4.jpeg') };
const user5 = { uri: getAssetUrl('images/users/user5.jpeg') };
const user6 = { uri: getAssetUrl('images/users/user6.jpeg') };
const user7 = { uri: getAssetUrl('images/users/user7.jpeg') };
const user8 = { uri: getAssetUrl('images/users/user8.jpeg') };
const user9 = { uri: getAssetUrl('images/users/user9.jpeg') };
const user10 = { uri: getAssetUrl('images/users/user10.jpeg') };
const user11 = { uri: getAssetUrl('images/users/user11.jpeg') };

const avatar = { uri: getAssetUrl('images/avatar.jpeg') };
const logo = { uri: getAssetUrl('images/logo.png') };
const elipseCard = { uri: getAssetUrl('images/elipse-card.png') };
const rectangleCard = { uri: getAssetUrl('images/rectangle-card.png') };

const service1 = { uri: getAssetUrl('images/services/service1.jpeg') };
const service2 = { uri: getAssetUrl('images/services/service2.jpeg') };
const service3 = { uri: getAssetUrl('images/services/service3.jpeg') };
const service4 = { uri: getAssetUrl('images/services/service4.jpeg') };
const service5 = { uri: getAssetUrl('images/services/service5.jpeg') };
const service6 = { uri: getAssetUrl('images/services/service6.jpeg') };
const service7 = { uri: getAssetUrl('images/services/service7.jpeg') };
const service8 = { uri: getAssetUrl('images/services/service8.jpeg') };
const service9 = { uri: getAssetUrl('images/services/service9.jpeg') };
const service10 = { uri: getAssetUrl('images/services/service10.jpeg') };
const service11 = { uri: getAssetUrl('images/services/service11.jpeg') };

export default {
    ornament,
    logo,
    elipseCard,
    rectangleCard,
    
    onboarding1,
    onboarding2,
    onboarding3,
    onboarding4,
    onboarding5,
    onboarding6,
    onboarding7,
    onboarding8,
    onboarding9,
    onboarding10,

    user1,
    user2,
    user3,
    user4,
    user5,
    user6,
    user7,
    user8,
    user9,
    user10,
    user11,
    avatar,

    service1,
    service2,
    service3,
    service4,
    service5,
    service6,
    service7,
    service8,
    service9,
    service10,
    service11,
    avatarurl
}