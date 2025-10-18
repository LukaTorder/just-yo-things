import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.35019d523f7d4f1db314fc0a124f78d3',
  appName: 'just-yo-things',
  webDir: 'dist',
  server: {
    url: 'https://35019d52-3f7d-4f1d-b314-fc0a124f78d3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      iosPermission: 'NSLocationWhenInUseUsageDescription',
      androidPermission: 'ACCESS_FINE_LOCATION'
    }
  }
};

export default config;
