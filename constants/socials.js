import { REACT_APP_SUPABASE_URL } from '@env';

const STORAGE_BASE_URL = `${REACT_APP_SUPABASE_URL}/storage/v1/object/public/app-assets/assets`;

const getAssetUrl = (path) => ({ uri: `${STORAGE_BASE_URL}/${path}` });

const facebook = getAssetUrl('icons/socials/facebook.png');
const instagram = getAssetUrl('icons/socials/instagram.png');
const linkedin = getAssetUrl('icons/socials/linkedin.png');
const messenger = getAssetUrl('icons/socials/messenger.png');
const titktok = getAssetUrl('icons/socials/tiktok.png');
const twitter = getAssetUrl('icons/socials/twitter.png');
const wechat = getAssetUrl('icons/socials/wechat.png');
const whatsapp = getAssetUrl('icons/socials/whatsappp.png');
const yahoo = getAssetUrl('icons/socials/yahoo.png');

export default {
    facebook,
    instagram,
    linkedin,
    messenger,
    titktok,
    twitter,
    wechat,
    whatsapp,
    yahoo
}