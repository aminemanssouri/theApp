import { Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const launchImagePicker = async () => {
    try {
        console.log('🖼️ Starting image picker...');
        
        const granted = await checkMediaPermissions();
        console.log('📱 Permissions granted:', granted);
        if (!granted) return;

        console.log('📂 Opening image library...');
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'Images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        console.log('📸 Image picker result:', { 
            canceled: result.canceled, 
            assetsLength: result.assets?.length,
            firstAssetUri: result.assets?.[0]?.uri 
        });

        if (!result.canceled && result.assets?.length) {
            return result.assets?.[0]?.uri;
        }

        // If gallery is empty or user canceled, offer camera fallback
        console.log('📷 Offering camera fallback...');
        const useCamera = await promptUseCameraFallback();
        if (useCamera) {
            const cameraUri = await launchCameraFallback();
            return cameraUri;
        }
    } catch (error) {
        console.error('❌ Image picker error:', error);
        Alert.alert('Error', 'Failed to open image picker: ' + error.message);
        
        // Direct camera fallback on error
        const tryCamera = await promptDirectCamera();
        if (tryCamera) {
            return await launchCameraFallback();
        }
    }
}

const checkMediaPermissions = async () => {
    if (Platform.OS !== 'web') {
        const { granted, canAskAgain, status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) {
            if (!canAskAgain || status === 'denied') {
                Alert.alert(
                    'Permission Needed',
                    'We need access to your photos to select an image. You can enable this in Settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() },
                    ]
                );
            }
            return false;
        }
    }

    return true;
}

const promptUseCameraFallback = async () => new Promise(resolve => {
    Alert.alert(
        'No Photo Selected',
        'Would you like to take a photo instead?',
        [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Open Camera', onPress: () => resolve(true) },
        ]
    );
});

const promptDirectCamera = async () => new Promise(resolve => {
    Alert.alert(
        'Image Picker Error',
        'The photo gallery could not be opened. Would you like to use the camera instead?',
        [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Use Camera', onPress: () => resolve(true) },
        ]
    );
});

const launchCameraFallback = async () => {
    try {
        console.log('📷 Requesting camera permissions...');
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('📱 Camera permission granted:', granted);
        
        if (!granted) {
            Alert.alert('Camera Permission Needed', 'Enable camera access in Settings to take a photo.');
            return;
        }
        
        console.log('📸 Opening camera...');
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        
        console.log('📷 Camera result:', { 
            canceled: result.canceled, 
            assetsLength: result.assets?.length,
            firstAssetUri: result.assets?.[0]?.uri 
        });
        
        if (!result.canceled && result.assets?.length) {
            return result.assets[0].uri;
        }
    } catch (error) {
        console.error('❌ Camera error:', error);
        Alert.alert('Camera Error', 'Failed to open camera: ' + error.message);
    }
}