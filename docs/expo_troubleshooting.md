# Expo App Startup Troubleshooting Guide

## The Issue
You're seeing a `TypeError: fetch failed` error when trying to start your Expo app with `npx expo start --clear`. This is usually a networking or environment issue rather than a problem with your database setup.

## Troubleshooting Steps

Try these solutions in order:

### 1. Restart Your Development Environment

```bash
# Kill all node processes
taskkill /f /im node.exe

# Clear cache and try again
npx expo start --clear
```

### 2. Check Your Network Connection

Ensure you have a stable internet connection, as Expo CLI needs to fetch packages from the internet.

### 3. Try Different Startup Options

```bash
# Try offline mode
npx expo start --offline

# Or try with a different Metro config
npx expo start --no-dev
```

### 4. Update Expo CLI and Packages

```bash
# Update Expo CLI
npm install -g expo-cli@latest

# Update project dependencies
npm update
```

### 5. Disable Firewall/Antivirus Temporarily

Your firewall or antivirus might be blocking network requests from Expo.

### 6. Use a Different Network

Try using a different network (like mobile hotspot) if available.

### 7. Clear All Caches

```bash
# Clear node modules and reinstall
rm -rf node_modules
npm cache clean --force
npm install

# Clear Expo cache
expo r -c
```

### 8. Check Environment Variables

Ensure your `.env` file has the correct values for:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY

### 9. Check for Node.js Version Issues

```bash
# Check your Node.js version
node -v

# If needed, try using a different Node.js version with nvm
# For example:
# nvm install 18
# nvm use 18
```

### Advanced Troubleshooting

If none of the above works, consider:

- Checking for conflicting global packages
- Examining any proxy settings that might interfere with fetch requests
- Temporarily disabling VPN services if you're using them
- Running with verbose logs: `npx expo start --verbose`
