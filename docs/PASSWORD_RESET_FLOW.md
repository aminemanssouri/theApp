# 🔐 Forgot Password Flow Documentation

## Overview

This document explains how the password reset flow works in BRICOLLANO, from the user clicking "Forgot Password" to successfully resetting their password through Gmail.

---

## Step-by-Step Process

### **1. User Clicks "Forgot Password"** 

**Location:** `screens/Login.js`

```javascript
<TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordMethods")}>
  <Text>Forgot Password?</Text>
</TouchableOpacity>
```

The user is presented with a screen to enter their email address.

---

### **2. User Enters Email**

**Location:** `screens/ForgotPasswordEmail.js`

```javascript
const handleSendResetEmail = async () => {
  const { email } = formState.inputValues;
  
  const { data, error } = await sendPasswordResetEmail(email);
  
  if (!error) {
    Alert.alert(
      'Email Sent', 
      'Check your email for the reset link',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  }
};
```

---

### **3. Backend Sends Email**

**Location:** `lib/services/auth.js`

```javascript
export const sendPasswordResetEmail = async (email) => {
  const redirectTo = 'bricollano://auth/reset-password';
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
  
  return { data, error };
}
```

**What happens:**
- Supabase Auth sends an email to the user
- Email contains a magic link with recovery tokens
- Link format: `bricollano://auth/reset-password#access_token=xxx&refresh_token=yyy&type=recovery`

---

### **4. User Clicks Link in Gmail** 📧

When the user clicks the link in their email:
- The custom URL scheme `bricollano://` opens the app
- The URL contains the recovery tokens in the hash fragment
- iOS/Android automatically routes this to the app

---

### **5. App Handles Deep Link**

**Location:** `App.js`

```javascript
const handleDeepLink = async (url) => {
  console.log('🔗 Deep link received:', url);
  
  if (url.includes('reset-password') || url.includes('type=recovery')) {
    // Extract tokens from URL hash
    if (url.includes('#')) {
      const hashParams = url.split('#')[1];
      const params = new URLSearchParams(hashParams);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      
      if (type === 'recovery' && accessToken && refreshToken) {
        // Store tokens WITHOUT logging in
        await AsyncStorage.setItem('recovery_access_token', accessToken);
        await AsyncStorage.setItem('recovery_refresh_token', refreshToken);
        await AsyncStorage.setItem('is_password_recovery', 'true');
        
        // Navigate to password reset screen
        navigationRef.current.navigate('OTPVerification');
      }
    }
  }
};
```

**Critical Design Decision:**
- Tokens are stored in AsyncStorage but session is NOT activated
- This prevents auto-login during password recovery
- The `is_password_recovery` flag signals that this is a password reset, not a normal login

---

### **6. User Enters New Password**

**Location:** `screens/OTPVerification.js`

```javascript
const handlePasswordReset = async () => {
  // Validate passwords match and meet requirements
  if (!validateForm()) return;
  
  if (!recoveryTokens) {
    Alert.alert('Session expired', 'Please request a new reset link');
    return;
  }
  
  // 1. Temporarily set session with recovery tokens
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: recoveryTokens.accessToken,
    refresh_token: recoveryTokens.refreshToken,
  });
  
  if (sessionError) throw sessionError;
  
  // 2. Update the password
  const { error } = await supabase.auth.updateUser({ 
    password: newPassword 
  });
  
  if (error) throw error;
  
  // 3. Clean up recovery tokens
  await AsyncStorage.removeItem('recovery_access_token');
  await AsyncStorage.removeItem('recovery_refresh_token');
  await AsyncStorage.removeItem('is_password_recovery');
  
  // 4. Sign out the recovery session
  await supabase.auth.signOut();
  
  // 5. Success - navigate back to Login
  Alert.alert(
    'Password Reset Successful',
    'Please login with your new password'
  );
  navigation.navigate('Login');
};
```

---

### **7. AuthContext Prevents Auto-Login**

**Location:** `context/AuthContext.js`

```javascript
supabase.auth.onAuthStateChange(async (event, session) => {
  // Skip password recovery events
  if (event === 'PASSWORD_RECOVERY') {
    console.log('Password recovery event - handled by deep link');
    return;
  }
  
  if (event === 'SIGNED_IN' && session) {
    // Check if this is a password recovery session
    const isRecovery = await AsyncStorage.getItem('is_password_recovery');
    
    if (isRecovery === 'true') {
      console.log('SIGNED_IN during password recovery - ignoring auto-login');
      return; // Don't process this as a normal sign-in
    }
    
    // Normal sign-in flow continues...
    setUser(session.user);
    // ... load profile, etc.
  }
});
```

**Why this is important:**
- When we set the recovery session in step 6, Supabase fires a `SIGNED_IN` event
- Without this check, the app would auto-login the user
- The `is_password_recovery` flag prevents this unwanted behavior
- User must explicitly login with their new password

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. Login Screen                                                │
│     ↓ (Click "Forgot Password")                                │
│                                                                 │
│  2. ForgotPasswordEmail Screen                                  │
│     ↓ (Enter email)                                             │
│                                                                 │
│  3. Supabase Auth API                                           │
│     • Generates recovery tokens                                 │
│     • Sends email with magic link                               │
│     ↓                                                            │
│                                                                 │
│  4. User's Gmail                                                │
│     • Receives email                                            │
│     • Link: bricollano://auth/reset-password#tokens             │
│     ↓ (User clicks link)                                        │
│                                                                 │
│  5. App Deep Link Handler (App.js)                              │
│     • Extracts access_token & refresh_token                     │
│     • Stores in AsyncStorage                                    │
│     • Sets is_password_recovery flag                            │
│     • Navigate to OTPVerification                               │
│     ↓                                                            │
│                                                                 │
│  6. OTPVerification Screen                                      │
│     • User enters new password                                  │
│     • Temporarily set session with recovery tokens              │
│     • Update password via Supabase                              │
│     • Clear recovery tokens                                     │
│     • Sign out recovery session                                 │
│     ↓                                                            │
│                                                                 │
│  7. AuthContext                                                 │
│     • Detects is_password_recovery flag                         │
│     • Prevents auto-login                                       │
│     ↓                                                            │
│                                                                 │
│  8. Login Screen                                                │
│     • User logs in with new password                            │
│     • ✅ Success!                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Features

### 1. **Temporary Token Storage**
- Recovery tokens are stored in AsyncStorage, not as an active session
- Tokens are cleared immediately after password update
- Prevents long-term token exposure

### 2. **Auto-Login Prevention**
```javascript
if (isRecovery === 'true') {
  return; // Don't auto-login
}
```
- The `is_password_recovery` flag blocks automatic login
- Forces user to explicitly login with new password
- Validates that password was successfully changed

### 3. **Session Cleanup**
```javascript
await supabase.auth.signOut(); // Destroy recovery session
```
- Recovery session is destroyed after password update
- Fresh authentication required with new credentials

### 4. **Token Expiration**
- Supabase recovery tokens expire after 1 hour by default
- Expired tokens are detected and user is redirected to request new link

---

## Configuration

### Deep Link URL Scheme

**Location:** `app.json`

```json
{
  "expo": {
    "scheme": "bricollano"
  }
}
```

### Redirect URL

**Location:** `lib/services/auth.js`

```javascript
const redirectTo = 'bricollano://auth/reset-password';
```

**Format:**
- Scheme: `bricollano://`
- Path: `auth/reset-password`
- Tokens appended as hash: `#access_token=...&refresh_token=...&type=recovery`

---

## Error Handling

### Missing Tokens
```javascript
if (!recoveryTokens) {
  Alert.alert('Session expired', 'Please request a new reset link');
  navigation.navigate('Login');
}
```

### Invalid Password
```javascript
if (newPassword.length < 6) {
  setErrors({ newPassword: 'Password must be at least 6 characters' });
}

if (newPassword !== confirmPassword) {
  setErrors({ confirmPassword: 'Passwords do not match' });
}
```

### Network Errors
```javascript
try {
  await supabase.auth.updateUser({ password: newPassword });
} catch (error) {
  Alert.alert('Error', 'Failed to update password. Please try again.');
}
```

---

## Testing

### Manual Testing Steps

1. **Request Password Reset:**
   - Go to Login screen
   - Click "Forgot Password"
   - Enter valid email
   - Verify email is sent

2. **Check Email:**
   - Open Gmail
   - Find password reset email from Supabase
   - Verify link format is correct

3. **Click Reset Link:**
   - Click link in email
   - Verify app opens (not browser)
   - Verify OTPVerification screen appears

4. **Reset Password:**
   - Enter new password
   - Confirm new password
   - Submit
   - Verify success message

5. **Login with New Password:**
   - Navigate to Login screen
   - Enter email and NEW password
   - Verify login works

### Debug Logs

Enable console logging to see the flow:

```javascript
console.log('🔗 Deep link received:', url);
console.log('🔑 Extracted tokens:', { hasAccessToken, hasRefreshToken });
console.log('✅ Tokens stored successfully');
console.log('🔐 Setting recovery session...');
console.log('✅ Password updated successfully!');
```

---

## Common Issues

### Issue 1: App doesn't open when clicking email link

**Cause:** URL scheme not properly configured

**Solution:** Verify `app.json` has correct scheme:
```json
"scheme": "bricollano"
```

### Issue 2: Tokens not found in OTPVerification

**Cause:** Deep link handler didn't store tokens

**Solution:** Check AsyncStorage:
```javascript
const accessToken = await AsyncStorage.getItem('recovery_access_token');
console.log('Token:', accessToken);
```

### Issue 3: Auto-login happens after password reset

**Cause:** `is_password_recovery` flag not working

**Solution:** Verify AuthContext checks the flag:
```javascript
const isRecovery = await AsyncStorage.getItem('is_password_recovery');
if (isRecovery === 'true') return;
```

---

## Related Files

| File | Purpose |
|------|---------|
| `App.js` | Deep link handler, navigation setup |
| `lib/services/auth.js` | Password reset email function |
| `screens/Login.js` | Entry point for forgot password |
| `screens/ForgotPasswordEmail.js` | Email input screen |
| `screens/OTPVerification.js` | Password reset screen |
| `context/AuthContext.js` | Auth state management, auto-login prevention |
| `app.json` | URL scheme configuration |

---

## Support

For issues or questions about the password reset flow, please check:
1. Console logs for detailed flow information
2. AsyncStorage for token debugging
3. Supabase Dashboard for email delivery status
4. This documentation for implementation details

---

**Last Updated:** November 14, 2025
**Version:** 1.0.0
