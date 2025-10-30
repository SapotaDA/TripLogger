# GeoTrip Logger - Professional Trip Tracking Application

## Overview
A vanilla JavaScript trip tracking web application with Firebase authentication, Firestore database, and Leaflet maps for real-time GPS tracking. Users can log their outdoor activities like running, hiking, or cycling with live map visualization and comprehensive analytics.

## Current State
- **Status**: Imported from GitHub, configured for Replit environment
- **Last Updated**: October 30, 2025
- **Working Features**: Authentication, trip tracking, map visualization, profile management

## Project Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Express.js server (Node.js)
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Maps**: Leaflet.js
- **Animations**: GSAP (GreenSock Animation Platform)
- **Icons**: Font Awesome

### Directory Structure
```
/
├── src/
│   └── main.js           # Main application logic with Firebase integration
├── index.html            # Main dashboard page
├── signin.html           # Sign-in page
├── signup.html           # Sign-up page
├── style.css             # Global styles
├── server.js             # Express server (serves static files on port 5000)
├── auth-guard.js         # Firebase authentication guard
├── firestore.rules       # Firestore security rules
└── package.json          # Node.js dependencies
```

### Key Features
1. **User Authentication**: Firebase Auth with email/password
2. **Real-time Trip Tracking**: GPS-based location tracking with Leaflet maps
3. **Map Page Trip Controls**: Professional trip control panel on map page with timer, distance, and speed displays
4. **Trip Management**: Start, pause, resume, and end trips with smooth GSAP animations
5. **Live Location Following**: Map automatically follows user's location in real-time during trips
6. **Statistics**: Distance, duration, average speed calculations
7. **Profile Management**: User profile editing and avatar support
8. **Notifications**: In-app notification system
9. **Trip History**: View all completed trips with detailed stats

### Firebase Configuration
The app uses Firebase for:
- Authentication (email/password)
- Firestore database for storing users and trips
- Project ID: trip-bab38

### Database Schema

#### Users Collection
- `uid` (string): Firebase Auth UID
- `email` (string): User email
- `name` (string): Display name
- `birthday` (date): User birthday
- `gender` (string): User gender
- `location` (string): User location
- `weight` (number): User weight in kg
- `avatarUrl` (string): Profile photo URL
- `activeTrip` (object): Paused trip data

#### Trips Collection
- `id` (auto-generated): Trip ID
- `userId` (string): Reference to Users.uid
- `duration` (string): Trip duration (HH:MM:SS)
- `distance` (number): Distance in kilometers
- `path` (array): GPS coordinates array
- `status` (string): Trip status
- `createdAt` (timestamp): Creation timestamp

## Development Setup

### Server Configuration
- **Host**: 0.0.0.0 (required for Replit proxy)
- **Port**: 5000 (frontend)
- **Cache Control**: Disabled to prevent stale content in iframe

### Running the Application
The Express server serves static files from the root directory on port 5000.

## User Preferences
None documented yet.

## Recent Changes
- **October 30, 2025**: 
  - ✅ Configured server.js to run on port 5000 with 0.0.0.0 binding for Replit proxy
  - ✅ Added cache control headers to prevent caching issues in iframe
  - ✅ Fixed static file serving (removed non-existent dist directory reference)
  - ✅ Fixed all Firebase imports to use CDN version 12.4.0 consistently
  - ✅ Removed service worker registration (file doesn't exist)
  - ✅ Added GSAP library loading via CDN
  - ✅ Fixed trip tracking to use modal-specific elements (tripDuration, tripDistance)
  - ✅ Implemented separate map initialization for main map and trip modal
  - ✅ Fixed navigation to work within single-page app (bottom nav clicks)
  - ✅ Added profile edit functionality
  - ✅ Fixed location tracking to update both main and trip maps
  - ✅ Added map auto-refresh when switching to map page
  - ✅ Configured deployment for autoscale (stateless web app)
  - ✅ **NEW**: Added professional trip control panel to map page with glassmorphism design
  - ✅ **NEW**: Implemented real-time timer display on map page (counts up during trips)
  - ✅ **NEW**: Added Start Trip, Pause, Resume, and End Trip buttons with GSAP animations
  - ✅ **NEW**: Implemented real-time location following (map pans to user's location automatically)
  - ✅ **NEW**: Added distance and speed displays that update in real-time
  - ✅ **NEW**: Trip path drawn on map with smooth polyline updates
  - ✅ **NEW**: Shared location tracking and timer functions for both modal and map page
  - ✅ **NEW**: GSAP-powered button transitions and number animations

## How It Works
1. **Authentication Flow**: User lands on index.html → redirected to signin.html if not authenticated → after login, returns to dashboard
2. **Map Functionality**: 
   - Main map on "Map" page shows user location with marker
   - Professional trip control panel appears at bottom of map page
   - Trip modal has its own independent map for tracking active trips
   - Maps auto-initialize when pages are visited
3. **Trip Tracking on Map Page**: 
   - Click "Start Trip" button → timer begins counting, GPS tracking starts
   - Map automatically follows user's location in real-time
   - Trip path is drawn on map with smooth updates
   - Distance and speed update live during the trip
   - Pause/Resume functionality to control tracking
   - Click "End Trip" → trip data saved to Firestore with duration, distance, and path
   - All button transitions use smooth GSAP animations
4. **Navigation**: Bottom navigation bar switches between pages with GSAP animations

## Known Issues
None at this time - all core features are working.

## Future Improvements
- Community features (challenges, leaderboards)
- Data analytics with charts
- Mobile app version
- Email verification
- Wearable device integration
- Offline support
