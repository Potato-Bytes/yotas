# yotas - Location-based Review App

A React Native app for sharing location-based reviews and discovering great places in your area.

## Features

- Interactive map with location-based reviews
- Post reviews with photos and ratings
- Browse review history
- Google authentication
- Real-time location services

## Tech Stack

- React Native with TypeScript
- React Navigation
- Zustand (State Management)
- React Query (Data Fetching)
- Google Maps
- Firebase Auth
- React Hook Form + Yup (Form Validation)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- React Native development environment
- iOS/Android development tools

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required API keys and configuration

### Required Environment Variables

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here
GOOGLE_WEB_CLIENT_ID=your_google_web_client_id_here
ADMOB_APP_ID=your_admob_app_id_here
ADMOB_BANNER_AD_UNIT_ID=your_admob_banner_ad_unit_id_here
ADMOB_INTERSTITIAL_AD_UNIT_ID=your_admob_interstitial_ad_unit_id_here
API_BASE_URL=https://api.yourdomain.com
```

### iOS Setup

For iOS, install CocoaPods dependencies:

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

### Running the App

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── common/       # Common components
│   ├── map/          # Map-related components
│   ├── review/       # Review components
│   └── ui/           # UI components
├── screens/          # Screen components
│   ├── auth/         # Authentication screens
│   ├── map/          # Map screen
│   ├── post/         # Post review screen
│   ├── history/      # Review history screen
│   └── settings/     # Settings screen
├── navigation/       # Navigation configuration
├── services/         # API and external services
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── constants/       # App constants
├── types/           # TypeScript type definitions
└── stores/          # Zustand stores
```

## Dependencies

### Core Dependencies
- React Native with TypeScript
- React Navigation for navigation
- Zustand for state management
- TanStack Query for data fetching

### UI & UX
- react-native-vector-icons for icons
- react-native-image-picker for image handling
- react-native-star-rating-widget for ratings
- react-native-modal for modals

### Location & Maps
- react-native-maps for map functionality
- @react-native-community/geolocation for location services
- @react-native-google-signin/google-signin for Google authentication

### Forms & Validation
- react-hook-form for form handling
- @hookform/resolvers and yup for validation

### Utilities
- date-fns for date formatting
- @react-native-async-storage/async-storage for local storage

### Monetization
- react-native-admob-native-ads for ads

## Next Steps

1. Configure Google Maps API key
2. Set up Firebase project and authentication
3. Implement location permissions
4. Add vector icons configuration
5. Set up backend API endpoints
6. Configure AdMob for monetization

## License

MIT License