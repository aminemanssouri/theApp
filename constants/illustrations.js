import { REACT_APP_SUPABASE_URL } from '@env';

// Supabase Storage base URL
const STORAGE_BASE_URL = `${REACT_APP_SUPABASE_URL}/storage/v1/object/public/app-assets/assets`;

// Helper function to get asset URL
const getAssetUrl = (path) => ({ uri: `${STORAGE_BASE_URL}/${path}` });

const illustration1 = getAssetUrl('illustrations/illustration1.png');
const illustration2 = getAssetUrl('illustrations/illustration2.png');
const illustration3 = getAssetUrl('illustrations/illustration3.png');
const illustration4 = getAssetUrl('illustrations/illustration4.png');
const illustration5 = getAssetUrl('illustrations/illustration5.png');
const illustration6 = getAssetUrl('illustrations/illustration6.png');
const illustration7 = getAssetUrl('illustrations/illustration7.png');
const fingerprint = getAssetUrl('illustrations/fingerprint.png');
const passwordSuccess = getAssetUrl('illustrations/password_success.png');
const password = getAssetUrl('illustrations/password.png');
const passwordDark = getAssetUrl('illustrations/password_dark.png');
const newPassword = getAssetUrl('illustrations/new_password.png');
const passwordSuccessDark = getAssetUrl('illustrations/password_sucess_dark.png');
const empty = getAssetUrl('illustrations/empty.png');
const notFound = getAssetUrl('illustrations/not_found.png');
const background = getAssetUrl('illustrations/background.png');
const error1 = getAssetUrl('illustrations/error1.png');
const error2 = getAssetUrl('illustrations/error2.png');
const success1 = getAssetUrl('illustrations/success1.png');
const success2 = getAssetUrl('illustrations/success2.png');

export default {
    illustration1,
    illustration2,
    illustration3,
    illustration4,
    illustration5,
    illustration6,
    illustration7,
    fingerprint,
    passwordSuccess,
    password,
    passwordDark,
    newPassword,
    passwordSuccessDark,
    empty,
    notFound,
    background,
    error1,
    error2,
    success1,
    success2,
}