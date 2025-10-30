// Main application entry point
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBaH-SM6yKKd6DeCd9siLp4G7UraeuhUi8",
    authDomain: "trip-bab38.firebaseapp.com",
    projectId: "trip-bab38",
    storageBucket: "trip-bab38.firebasestorage.app",
    messagingSenderId: "1069699418965",
    appId: "1:1069699418965:web:d9183b6f20e8743f483ddc",
    measurementId: "G-E0VZWSESBB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Application state
const state = {
    currentUser: null,
    currentPage: 'dashboard-page',
    isTripActive: false,
    isPaused: false,
    tripData: null,
    userLocation: [12.9716, 77.5946],
    path: [],
    startTime: null,
    pauseTime: null,
    totalPausedTime: 0,
    watchId: null,
    intervalId: null,
    map: null,
    userMarker: null,
    pathPolyline: null,
    tripMap: null,
    tripUserMarker: null,
    tripPathPolyline: null,
    notifications: []
};

// DOM elements
const elements = {
    // Header
    userInfo: document.getElementById('user-info'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    notificationBtn: document.getElementById('notification-btn'),
    notificationBadge: document.getElementById('notification-badge'),
    authButtons: document.getElementById('auth-buttons'),
    signinBtn: document.getElementById('signin-btn'),
    signupBtn: document.getElementById('signup-btn'),

    // Panels
    panelBackdrop: document.getElementById('panel-backdrop'),
    notificationPanel: document.getElementById('notification-panel'),
    closeNotificationPanel: document.getElementById('close-notification-panel'),
    notificationContent: document.getElementById('notification-content'),

    // Main Dashboard
    dashboardMain: document.getElementById('dashboard-main'),

    // Quick Actions
    startTripBtn: document.getElementById('start-trip-btn'),
    viewMapBtn: document.getElementById('view-map-btn'),
    shareTripBtn: document.getElementById('share-trip-btn'),
    viewAllTrips: document.getElementById('view-all-trips'),
    exploreCommunity: document.getElementById('explore-community'),
    editProfile: document.getElementById('edit-profile'),
    viewProfile: document.getElementById('view-profile'),

    // Trip Modal
    tripModal: document.getElementById('trip-modal'),
    closeTripModal: document.getElementById('close-trip-modal'),
    tripMap: document.getElementById('trip-map'),
    tripDuration: document.getElementById('trip-duration'),
    tripDistance: document.getElementById('trip-distance'),
    modalStartTripBtn: document.getElementById('modal-start-trip-btn'),
    modalPauseTripBtn: document.getElementById('modal-pause-trip-btn'),
    modalResumeTripBtn: document.getElementById('modal-resume-trip-btn'),
    modalStopTripBtn: document.getElementById('modal-stop-trip-btn'),

    // Modals
    logoutConfirmModal: document.getElementById('logout-confirm-modal'),
    cancelLogout: document.getElementById('cancel-logout'),
    confirmLogout: document.getElementById('confirm-logout'),

    // Profile
    profileAvatar: document.getElementById('profile-avatar'),
    profileName: document.getElementById('profile-name'),
    profileEmail: document.getElementById('profile-email'),
    profileForm: document.getElementById('profile-form'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    cancelEdit: document.getElementById('cancel-edit'),
    saveProfile: document.getElementById('save-profile'),
    logoutBtn: document.getElementById('logout-btn'),

    // Trips
    recentTrips: document.getElementById('recent-trips'),
    allTripsList: document.getElementById('all-trips-list'),
    totalDistance: document.getElementById('total-distance'),
    totalTrips: document.getElementById('total-trips'),
    avgSpeed: document.getElementById('avg-speed'),

    // Map Trip Controls
    mapTripControls: document.getElementById('map-trip-controls'),
    mapTripTimer: document.getElementById('map-trip-timer'),
    mapTripDistance: document.getElementById('map-trip-distance'),
    mapTripSpeed: document.getElementById('map-trip-speed'),
    mapStartTripBtn: document.getElementById('map-start-trip-btn'),
    mapPauseTripBtn: document.getElementById('map-pause-trip-btn'),
    mapResumeTripBtn: document.getElementById('map-resume-trip-btn'),
    mapEndTripBtn: document.getElementById('map-end-trip-btn')
};

// Initialize the application
function init() {
    setupAuthListener();
    setupEventListeners();
    initializeMap();
    loadNotifications();
}

// Authentication listener
function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            state.currentUser = user;
            updateUserUI(user);
            loadUserData();
            loadTrips();
            showAuthenticatedUI();
            console.log('User authenticated:', user.email);
        } else {
            state.currentUser = null;
            showUnauthenticatedUI();
            // Only redirect if we're on index.html, not if we're already on signin/signup
            const currentPath = window.location.pathname;
            if (!currentPath.includes('signin') && !currentPath.includes('signup')) {
                redirectToSignIn();
            }
        }
    });
}

// Show authenticated UI
function showAuthenticatedUI() {
    if (elements.userInfo) elements.userInfo.style.display = 'flex';
    if (elements.notificationBtn) elements.notificationBtn.style.display = 'block';
    // Hide auth buttons if they exist
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) authButtons.style.display = 'none';
    
    // Make sure dashboard page is visible
    const dashboardPage = document.getElementById('dashboard-page');
    if (dashboardPage) {
        dashboardPage.classList.add('active');
        dashboardPage.style.display = 'flex';
        console.log('Dashboard page activated');
    }
}

// Show unauthenticated UI
function showUnauthenticatedUI() {
    if (elements.userInfo) elements.userInfo.style.display = 'none';
    if (elements.notificationBtn) elements.notificationBtn.style.display = 'none';
    // Show auth buttons
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) authButtons.style.display = 'flex';
}

// Update user interface with user data
function updateUserUI(user) {
    if (user.photoURL) {
        elements.userAvatar.src = user.photoURL;
        elements.profileAvatar.src = user.photoURL;
    } else {
        elements.userAvatar.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjc2MTQgMjAgMjUgMTcuNzYxNCAyNSAxNUMyNSAxMi4yMzg2IDIyLjc2MTQgMTAgMjAgMTBDMTcuMjM4NiAxMCAxNSAxMi4yMzg2IDE1IDE1QzE1IDE3Ljc2MTQgMTcgMjAgMjBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
        elements.profileAvatar.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjc2MTQgMjAgMjUgMTcuNzYxNCAyNSAxNUMyNSAxMi4yMzg2IDIyLjc2MTQgMTAgMjAgMTBDMTcuMjM4NiAxMCAxNSAxMi4yMzg2IDE1IDE1QzE1IDE3Ljc2MTQgMTcgMjAgMjBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
    }
    elements.userName.textContent = user.displayName || user.email.split('@')[0];
    elements.profileName.textContent = user.displayName || user.email.split('@')[0];
    elements.profileEmail.textContent = user.email;
}

// Redirect to sign-in page
function redirectToSignIn() {
    window.location.href = 'signin.html';
}

// Load user data from Firestore
async function loadUserData() {
    if (!state.currentUser) return;

    try {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', state.currentUser.uid)));
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            // Update form fields
            document.getElementById('edit-name').value = userData.name || '';
            document.getElementById('edit-email').value = userData.email || '';
            document.getElementById('edit-birthday').value = userData.birthday || '';
            document.getElementById('edit-gender').value = userData.gender || '';
            document.getElementById('edit-location').value = userData.location || '';
            document.getElementById('edit-weight').value = userData.weight || '';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load trips from Firestore
async function loadTrips() {
    if (!state.currentUser) return;

    try {
        const tripsQuery = query(
            collection(db, 'trips'),
            where('userId', '==', state.currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        const tripsSnapshot = await getDocs(tripsQuery);
        const trips = tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        updateTripsUI(trips);
        calculateStats(trips);
    } catch (error) {
        console.error('Error loading trips:', error);
    }
}

// Update trips UI
function updateTripsUI(trips) {
    // Update all trips list
    if (elements.allTripsList) {
        elements.allTripsList.innerHTML = '';
        if (trips.length === 0) {
            elements.allTripsList.innerHTML = '<li class="loading"><span>No trips recorded yet.</span></li>';
        } else {
            trips.forEach(trip => {
                const tripElement = createTripListItem(trip);
                elements.allTripsList.appendChild(tripElement);
            });
        }
    }

    // Update recent trips in dashboard
    if (elements.recentTrips) {
        elements.recentTrips.innerHTML = '';
        const recentTrips = trips.slice(0, 5);
        if (recentTrips.length === 0) {
            elements.recentTrips.innerHTML = '<li class="loading"><span>No trips recorded yet.</span></li>';
        } else {
            recentTrips.forEach(trip => {
                const tripElement = createRecentTripElement(trip);
                elements.recentTrips.appendChild(tripElement);
            });
        }
    }
}

// Create trip list item for trips page
function createTripListItem(trip) {
    const li = document.createElement('li');
    li.className = 'trip-item';
    const createdDate = trip.createdAt?.toDate ? new Date(trip.createdAt.toDate()).toLocaleDateString() : 'Unknown date';
    li.innerHTML = `
        <div class="trip-info">
            <h3>Trip - ${createdDate}</h3>
            <p>${trip.distance} km • ${trip.duration}</p>
        </div>
    `;
    return li;
}

// Create recent trip element for dashboard
function createRecentTripElement(trip) {
    const li = document.createElement('li');
    li.className = 'trip-item';
    const createdDate = trip.createdAt?.toDate ? new Date(trip.createdAt.toDate()).toLocaleDateString() : 'Unknown date';
    li.innerHTML = `
        <div class="trip-info">
            <h3>Trip - ${createdDate}</h3>
            <p>${trip.distance} km • ${trip.duration}</p>
        </div>
    `;
    return li;
}

// Calculate and display stats
function calculateStats(trips) {
    const totalDistance = trips.reduce((sum, trip) => sum + parseFloat(trip.distance || 0), 0);
    const totalTrips = trips.length;
    const avgSpeed = totalTrips > 0 ? (totalDistance / totalTrips).toFixed(2) : 0;

    elements.totalDistance.textContent = `${totalDistance.toFixed(2)} km`;
    elements.totalTrips.textContent = totalTrips;
    elements.avgSpeed.textContent = `${avgSpeed} km/h`;
}

// Setup event listeners
function setupEventListeners() {
    // Auth buttons
    if (elements.signinBtn) elements.signinBtn.addEventListener('click', () => window.location.href = 'signin.html');
    if (elements.signupBtn) elements.signupBtn.addEventListener('click', () => window.location.href = 'signup.html');

    // Quick Actions - navigate to pages within the SPA
    if (elements.startTripBtn) elements.startTripBtn.addEventListener('click', () => {
        if (elements.tripModal) elements.tripModal.style.display = 'flex';
    });
    if (elements.viewMapBtn) elements.viewMapBtn.addEventListener('click', () => switchPage('map-page'));
    if (elements.shareTripBtn) elements.shareTripBtn.addEventListener('click', shareTrip);
    if (elements.viewAllTrips) elements.viewAllTrips.addEventListener('click', () => switchPage('trips-page'));
    if (elements.exploreCommunity) elements.exploreCommunity.addEventListener('click', () => switchPage('community-page'));
    if (elements.editProfile) elements.editProfile.addEventListener('click', () => switchPage('profile-page'));

    // Trip Modal
    if (elements.closeTripModal) elements.closeTripModal.addEventListener('click', () => {
        if (elements.tripModal) elements.tripModal.style.display = 'none';
    });
    if (elements.modalStartTripBtn) elements.modalStartTripBtn.addEventListener('click', startTrip);
    if (elements.modalPauseTripBtn) elements.modalPauseTripBtn.addEventListener('click', pauseTrip);
    if (elements.modalResumeTripBtn) elements.modalResumeTripBtn.addEventListener('click', resumeTrip);
    if (elements.modalStopTripBtn) elements.modalStopTripBtn.addEventListener('click', stopTrip);

    // Map Trip Controls
    if (elements.mapStartTripBtn) elements.mapStartTripBtn.addEventListener('click', startMapTrip);
    if (elements.mapPauseTripBtn) elements.mapPauseTripBtn.addEventListener('click', pauseMapTrip);
    if (elements.mapResumeTripBtn) elements.mapResumeTripBtn.addEventListener('click', resumeMapTrip);
    if (elements.mapEndTripBtn) elements.mapEndTripBtn.addEventListener('click', endMapTrip);

    // Notifications
    if (elements.notificationBtn) elements.notificationBtn.addEventListener('click', toggleNotificationPanel);
    if (elements.closeNotificationPanel) elements.closeNotificationPanel.addEventListener('click', closeNotificationPanel);
    if (elements.panelBackdrop) elements.panelBackdrop.addEventListener('click', closeNotificationPanel);

    // Modals
    if (elements.cancelLogout) elements.cancelLogout.addEventListener('click', hideLogoutConfirmModal);
    if (elements.confirmLogout) elements.confirmLogout.addEventListener('click', confirmLogout);

    // Profile
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', showLogoutConfirmModal);
    if (elements.editProfileBtn) elements.editProfileBtn.addEventListener('click', showProfileEditForm);
    if (elements.cancelEdit) elements.cancelEdit.addEventListener('click', hideProfileEditForm);
    if (elements.saveProfile) elements.saveProfile.addEventListener('click', saveProfileData);
    
    // Bottom Navigation
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.addEventListener('click', handleNavigation);
    }
}

// Handle bottom navigation
function handleNavigation(e) {
    const navItem = e.target.closest('.nav-item');
    if (!navItem) return;

    const pageId = navItem.dataset.page;
    switchPage(pageId);
}

// Switch between pages with animation
function switchPage(pageId) {
    if (state.currentPage === pageId) return;

    const currentPageElement = document.getElementById(state.currentPage);
    const newPageElement = document.getElementById(pageId);

    if (!currentPageElement || !newPageElement) {
        console.error(`Page not found: ${pageId}`);
        return;
    }

    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });

    // Update page content active state
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    newPageElement.classList.add('active');

    // Animate page transition with GSAP if available
    if (typeof gsap !== 'undefined') {
        gsap.to(currentPageElement, {
            opacity: 0,
            x: -20,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                currentPageElement.style.display = 'none';
                newPageElement.style.display = 'block';
                
                // Initialize or refresh map when switching to map page
                if (pageId === 'map-page') {
                    setTimeout(() => {
                        if (!state.map) {
                            initializeMap();
                        } else {
                            state.map.invalidateSize();
                        }
                    }, 100);
                }
                
                gsap.fromTo(newPageElement, 
                    { opacity: 0, x: 20 },
                    { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
                );
            }
        });
    } else {
        // Fallback without animation
        currentPageElement.style.display = 'none';
        newPageElement.style.display = 'block';
        
        // Initialize or refresh map when switching to map page
        if (pageId === 'map-page') {
            setTimeout(() => {
                if (!state.map) {
                    initializeMap();
                } else {
                    state.map.invalidateSize();
                }
            }, 100);
        }
    }

    state.currentPage = pageId;
}

// Initialize Leaflet map for main map page
function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.log('Map element not found, skipping map initialization');
        return;
    }

    try {
        // Check if map already exists
        if (state.map) {
            state.map.invalidateSize();
            return;
        }

        state.map = L.map('map').setView(state.userLocation, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(state.map);

        // Add user marker
        state.userMarker = L.marker(state.userLocation).addTo(state.map);
        
        // Get current location if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                state.userLocation = [latitude, longitude];
                state.map.setView(state.userLocation, 13);
                state.userMarker.setLatLng(state.userLocation);
            });
        }
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Initialize Leaflet map for trip modal
function initializeTripMap() {
    const tripMapElement = document.getElementById('trip-map');
    if (!tripMapElement) {
        console.error('Trip map element not found');
        return;
    }

    try {
        // Check if trip map already exists
        if (state.tripMap) {
            state.tripMap.invalidateSize();
            return;
        }

        state.tripMap = L.map('trip-map').setView(state.userLocation, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(state.tripMap);

        // Add user marker
        state.tripUserMarker = L.marker(state.userLocation).addTo(state.tripMap);
        
        // Get current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                state.userLocation = [latitude, longitude];
                state.tripMap.setView(state.userLocation, 15);
                state.tripUserMarker.setLatLng(state.userLocation);
            });
        }
        
        console.log('Trip map initialized successfully');
    } catch (error) {
        console.error('Error initializing trip map:', error);
    }
}

// Start trip
function startTrip() {
    if (!state.currentUser) {
        addNotification('Please sign in to start a trip', 'error');
        return;
    }

    state.isTripActive = true;
    state.isPaused = false;
    state.path = [];
    state.startTime = Date.now();
    state.totalPausedTime = 0;

    // Initialize trip map if not already done
    if (!state.tripMap) {
        initializeTripMap();
    }

    // Update UI - use modal buttons
    if (elements.modalStartTripBtn) elements.modalStartTripBtn.style.display = 'none';
    if (elements.modalPauseTripBtn) elements.modalPauseTripBtn.style.display = 'inline-block';
    if (elements.modalStopTripBtn) elements.modalStopTripBtn.style.display = 'inline-block';

    // Reset stats
    if (elements.tripDuration) elements.tripDuration.textContent = '00:00:00';
    if (elements.tripDistance) elements.tripDistance.textContent = '0.00 km';

    // Start location tracking
    startLocationTracking();

    // Start timer
    startTimer();

    // Add motivational message
    addNotification('Trip started! Keep moving!', 'success');
}

// Pause trip
function pauseTrip() {
    state.isPaused = true;
    state.pauseTime = Date.now();

    // Update UI - use modal buttons
    if (elements.modalPauseTripBtn) elements.modalPauseTripBtn.style.display = 'none';
    if (elements.modalResumeTripBtn) elements.modalResumeTripBtn.style.display = 'inline-block';

    // Stop location tracking
    stopLocationTracking();

    // Stop timer
    stopTimer();

    addNotification('Trip paused. Take a break!', 'info');
}

// Resume trip
function resumeTrip() {
    state.isPaused = false;
    if (state.pauseTime) {
        state.totalPausedTime += Date.now() - state.pauseTime;
        state.pauseTime = null;
    }

    // Update UI - use modal buttons
    if (elements.modalResumeTripBtn) elements.modalResumeTripBtn.style.display = 'none';
    if (elements.modalPauseTripBtn) elements.modalPauseTripBtn.style.display = 'inline-block';

    // Resume location tracking
    startLocationTracking();

    // Resume timer
    startTimer();

    addNotification('Trip resumed! Let\'s go!', 'success');
}

// Stop trip
function stopTrip() {
    if (!state.isTripActive) return;

    // Calculate final stats
    const endTime = Date.now();
    const totalTime = endTime - state.startTime - state.totalPausedTime;
    const duration = formatDuration(Math.floor(totalTime / 1000));
    const distance = calculateTotalDistance();

    // Create trip data
    const tripData = {
        userId: state.currentUser.uid,
        duration: duration,
        distance: distance.toFixed(2),
        path: state.path,
        createdAt: serverTimestamp()
    };

    // Save to Firestore
    saveTrip(tripData);

    // Reset state
    resetTripState();

    // Show modal
    showTripStopModal(tripData);
}

// Save trip to Firestore
async function saveTrip(tripData) {
    try {
        await addDoc(collection(db, 'trips'), tripData);
        addNotification('Trip saved successfully!', 'success');
        loadTrips(); // Refresh trips list
    } catch (error) {
        console.error('Error saving trip:', error);
        addNotification('Failed to save trip. Please try again.', 'error');
    }
}

// Reset trip state
function resetTripState() {
    state.isTripActive = false;
    state.isPaused = false;
    state.path = [];
    state.startTime = null;
    state.pauseTime = null;
    state.totalPausedTime = 0;

    // Clear path polyline from trip map
    if (state.tripPathPolyline && state.tripMap) {
        state.tripMap.removeLayer(state.tripPathPolyline);
        state.tripPathPolyline = null;
    }

    // Stop tracking
    stopLocationTracking();
    stopTimer();

    // Reset UI - use modal buttons
    if (elements.modalStartTripBtn) elements.modalStartTripBtn.style.display = 'inline-block';
    if (elements.modalPauseTripBtn) elements.modalPauseTripBtn.style.display = 'none';
    if (elements.modalResumeTripBtn) elements.modalResumeTripBtn.style.display = 'none';
    if (elements.modalStopTripBtn) elements.modalStopTripBtn.style.display = 'none';

    if (elements.tripDuration) elements.tripDuration.textContent = '00:00:00';
    if (elements.tripDistance) elements.tripDistance.textContent = '0.00 km';
}

// Start location tracking
function startLocationTracking() {
    if (navigator.geolocation) {
        state.watchId = navigator.geolocation.watchPosition(
            handleLocationUpdate,
            handleLocationError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }
}

// Stop location tracking
function stopLocationTracking() {
    if (state.watchId) {
        navigator.geolocation.clearWatch(state.watchId);
        state.watchId = null;
    }
}

// Handle location update
function handleLocationUpdate(position) {
    const { latitude, longitude, speed } = position.coords;
    state.userLocation = [latitude, longitude];

    // Update trip map marker if trip is active
    if (state.tripUserMarker && state.tripMap) {
        state.tripUserMarker.setLatLng(state.userLocation);
        state.tripMap.setView(state.userLocation);
    }

    // Update main map marker and follow location if trip is active on map page
    if (state.userMarker && state.map) {
        state.userMarker.setLatLng(state.userLocation);
        
        // If trip is active on map page, follow the user's location
        if (state.isTripActive && state.currentPage === 'map-page') {
            state.map.panTo(state.userLocation, {
                animate: true,
                duration: 1,
                easeLinearity: 0.25
            });
        }
    }

    // Add to path if trip is active
    if (state.isTripActive && !state.isPaused) {
        state.path.push([latitude, longitude]);

        // Update path polyline on trip map
        updatePathPolyline();
        
        // Update path polyline on main map if on map page
        if (state.currentPage === 'map-page') {
            updateMapPathPolyline();
        }

        // Update distance
        updateDistance();
        
        // Update map page distance and speed displays
        if (state.currentPage === 'map-page') {
            updateMapDistance();
            updateMapSpeed(speed);
        }
    }
}

// Handle location error
function handleLocationError(error) {
    console.error('Location error:', error);
    addNotification('Unable to get your location. Please check your GPS settings.', 'error');
}

// Update path polyline on trip map
function updatePathPolyline() {
    if (state.path.length < 2 || !state.tripMap) return;

    // Remove old polyline
    if (state.tripPathPolyline) {
        state.tripMap.removeLayer(state.tripPathPolyline);
    }

    // Add new polyline
    state.tripPathPolyline = L.polyline(state.path, {
        color: '#FF6B35',
        weight: 4,
        opacity: 0.8
    }).addTo(state.tripMap);

    // Fit map to show full path
    if (state.path.length > 1) {
        const bounds = L.latLngBounds(state.path);
        state.tripMap.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Update distance display
function updateDistance() {
    const distance = calculateTotalDistance();
    if (elements.tripDistance) {
        elements.tripDistance.textContent = `${distance.toFixed(2)} km`;
    }
}

// Calculate total distance
function calculateTotalDistance() {
    let totalDistance = 0;
    for (let i = 1; i < state.path.length; i++) {
        totalDistance += calculateDistance(
            state.path[i-1][0], state.path[i-1][1],
            state.path[i][0], state.path[i][1]
        );
    }
    return totalDistance;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Start timer
function startTimer() {
    state.intervalId = setInterval(() => {
        if (!state.isPaused && state.startTime) {
            const elapsed = Math.floor((Date.now() - state.startTime - state.totalPausedTime) / 1000);
            
            // Update modal timer
            if (elements.tripDuration) {
                elements.tripDuration.textContent = formatDuration(elapsed);
            }
            
            // Update map page timer
            if (elements.mapTripTimer) {
                elements.mapTripTimer.textContent = formatDuration(elapsed);
            }
        }
    }, 1000);
}

// Stop timer
function stopTimer() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}

// Format duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ===== MAP PAGE TRIP FUNCTIONS =====

// Start trip on map page
function startMapTrip() {
    if (!state.currentUser) {
        addNotification('Please sign in to start a trip', 'error');
        return;
    }

    state.isTripActive = true;
    state.isPaused = false;
    state.path = [];
    state.startTime = Date.now();
    state.totalPausedTime = 0;

    // Animate button transition with GSAP
    if (typeof gsap !== 'undefined' && elements.mapStartTripBtn) {
        gsap.to(elements.mapStartTripBtn, {
            scale: 0.9,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                elements.mapStartTripBtn.style.display = 'none';
                elements.mapPauseTripBtn.style.display = 'flex';
                elements.mapEndTripBtn.style.display = 'flex';
                
                gsap.fromTo([elements.mapPauseTripBtn, elements.mapEndTripBtn], 
                    { scale: 0.9, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out', stagger: 0.1 }
                );
            }
        });
    } else {
        elements.mapStartTripBtn.style.display = 'none';
        elements.mapPauseTripBtn.style.display = 'flex';
        elements.mapEndTripBtn.style.display = 'flex';
    }

    // Animate timer icon with GSAP
    if (typeof gsap !== 'undefined') {
        const timerIcon = document.querySelector('.timer-icon');
        if (timerIcon) {
            gsap.to(timerIcon, {
                rotation: 360,
                duration: 0.8,
                ease: 'power2.out'
            });
        }
    }

    // Reset stats
    if (elements.mapTripTimer) elements.mapTripTimer.textContent = '00:00:00';
    if (elements.mapTripDistance) elements.mapTripDistance.textContent = '0.00 km';
    if (elements.mapTripSpeed) elements.mapTripSpeed.textContent = '0.00 km/h';

    // Clear old path polyline if exists
    if (state.pathPolyline && state.map) {
        state.map.removeLayer(state.pathPolyline);
        state.pathPolyline = null;
    }

    // Start location tracking (use the shared function)
    startLocationTracking();

    // Start timer (use the shared function)
    startTimer();

    // Show notification
    addNotification('Trip started! The map will follow your location.', 'success');
}

// Pause trip on map page
function pauseMapTrip() {
    state.isPaused = true;
    state.pauseTime = Date.now();

    // Animate button transition
    if (typeof gsap !== 'undefined') {
        gsap.to(elements.mapPauseTripBtn, {
            scale: 0.9,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                elements.mapPauseTripBtn.style.display = 'none';
                elements.mapResumeTripBtn.style.display = 'flex';
                
                gsap.fromTo(elements.mapResumeTripBtn, 
                    { scale: 0.9, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
                );
            }
        });
    } else {
        elements.mapPauseTripBtn.style.display = 'none';
        elements.mapResumeTripBtn.style.display = 'flex';
    }

    // Stop location tracking
    stopLocationTracking();

    // Stop timer
    stopTimer();

    addNotification('Trip paused. Take a break!', 'info');
}

// Resume trip on map page
function resumeMapTrip() {
    state.isPaused = false;
    if (state.pauseTime) {
        state.totalPausedTime += Date.now() - state.pauseTime;
        state.pauseTime = null;
    }

    // Animate button transition
    if (typeof gsap !== 'undefined') {
        gsap.to(elements.mapResumeTripBtn, {
            scale: 0.9,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                elements.mapResumeTripBtn.style.display = 'none';
                elements.mapPauseTripBtn.style.display = 'flex';
                
                gsap.fromTo(elements.mapPauseTripBtn, 
                    { scale: 0.9, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
                );
            }
        });
    } else {
        elements.mapResumeTripBtn.style.display = 'none';
        elements.mapPauseTripBtn.style.display = 'flex';
    }

    // Resume location tracking
    startLocationTracking();

    // Resume timer
    startTimer();

    addNotification('Trip resumed! Keep going!', 'success');
}

// End trip on map page
function endMapTrip() {
    if (!state.isTripActive) return;

    // Calculate final stats
    const endTime = Date.now();
    const totalTime = endTime - state.startTime - state.totalPausedTime;
    const duration = formatDuration(Math.floor(totalTime / 1000));
    const distance = calculateTotalDistance();

    // Create trip data
    const tripData = {
        userId: state.currentUser.uid,
        duration: duration,
        distance: distance.toFixed(2),
        path: state.path,
        createdAt: serverTimestamp()
    };

    // Save to Firestore
    saveTrip(tripData);

    // Animate ending
    if (typeof gsap !== 'undefined' && elements.mapTripControls) {
        gsap.to(elements.mapTripControls, {
            scale: 1.05,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
        });
    }

    // Reset state
    resetMapTripState();

    addNotification(`Trip completed! Distance: ${distance.toFixed(2)} km, Duration: ${duration}`, 'success');
}

// Reset map trip state
function resetMapTripState() {
    state.isTripActive = false;
    state.isPaused = false;
    state.path = [];
    state.startTime = null;
    state.pauseTime = null;
    state.totalPausedTime = 0;

    // Clear path polyline from main map
    if (state.pathPolyline && state.map) {
        state.map.removeLayer(state.pathPolyline);
        state.pathPolyline = null;
    }

    // Stop tracking
    stopLocationTracking();
    stopTimer();

    // Reset UI with animation
    if (typeof gsap !== 'undefined') {
        gsap.to([elements.mapPauseTripBtn, elements.mapResumeTripBtn, elements.mapEndTripBtn], {
            scale: 0.9,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                elements.mapPauseTripBtn.style.display = 'none';
                elements.mapResumeTripBtn.style.display = 'none';
                elements.mapEndTripBtn.style.display = 'none';
                elements.mapStartTripBtn.style.display = 'flex';
                
                gsap.fromTo(elements.mapStartTripBtn, 
                    { scale: 0.9, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
                );
            }
        });
    } else {
        elements.mapPauseTripBtn.style.display = 'none';
        elements.mapResumeTripBtn.style.display = 'none';
        elements.mapEndTripBtn.style.display = 'none';
        elements.mapStartTripBtn.style.display = 'flex';
    }

    if (elements.mapTripTimer) elements.mapTripTimer.textContent = '00:00:00';
    if (elements.mapTripDistance) elements.mapTripDistance.textContent = '0.00 km';
    if (elements.mapTripSpeed) elements.mapTripSpeed.textContent = '0.00 km/h';
}

// Update path polyline on main map
function updateMapPathPolyline() {
    if (state.path.length < 2 || !state.map) return;

    // Remove old polyline
    if (state.pathPolyline) {
        state.map.removeLayer(state.pathPolyline);
    }

    // Add new polyline with gradient effect
    state.pathPolyline = L.polyline(state.path, {
        color: '#667eea',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1
    }).addTo(state.map);
}

// Update distance display on map
function updateMapDistance() {
    const distance = calculateTotalDistance();
    if (elements.mapTripDistance) {
        // Animate the number change
        if (typeof gsap !== 'undefined') {
            const currentValue = parseFloat(elements.mapTripDistance.textContent) || 0;
            gsap.to({ val: currentValue }, {
                val: distance,
                duration: 0.5,
                onUpdate: function() {
                    elements.mapTripDistance.textContent = `${this.targets()[0].val.toFixed(2)} km`;
                }
            });
        } else {
            elements.mapTripDistance.textContent = `${distance.toFixed(2)} km`;
        }
    }
}

// Update speed display on map
function updateMapSpeed(speed) {
    if (elements.mapTripSpeed && speed !== null) {
        const speedKmh = (speed * 3.6).toFixed(2);
        
        // Animate the number change
        if (typeof gsap !== 'undefined') {
            const currentValue = parseFloat(elements.mapTripSpeed.textContent) || 0;
            gsap.to({ val: currentValue }, {
                val: parseFloat(speedKmh),
                duration: 0.5,
                onUpdate: function() {
                    elements.mapTripSpeed.textContent = `${this.targets()[0].val.toFixed(2)} km/h`;
                }
            });
        } else {
            elements.mapTripSpeed.textContent = `${speedKmh} km/h`;
        }
    }
}

// Toggle fullscreen
function toggleFullscreen() {
    const mapContainer = document.querySelector('.map-container');
    mapContainer.classList.toggle('fullscreen');

    if (mapContainer.classList.contains('fullscreen')) {
        elements.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        elements.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }

    // Resize map
    setTimeout(() => {
        state.map.invalidateSize();
    }, 300);
}

// Notification functions
function addNotification(message, type = 'info') {
    const notification = {
        id: Date.now(),
        message,
        type,
        timestamp: new Date()
    };

    state.notifications.unshift(notification);
    updateNotificationBadge();
    updateNotificationPanel();

    // Auto-remove after 5 seconds
    setTimeout(() => {
        removeNotification(notification.id);
    }, 5000);
}

function removeNotification(id) {
    state.notifications = state.notifications.filter(n => n.id !== id);
    updateNotificationBadge();
    updateNotificationPanel();
}

function updateNotificationBadge() {
    const count = state.notifications.length;
    elements.notificationBadge.textContent = count;
    elements.notificationBadge.style.display = count > 0 ? 'block' : 'none';
}

function updateNotificationPanel() {
    elements.notificationContent.innerHTML = '';
    if (state.notifications.length === 0) {
        elements.notificationContent.innerHTML = '<p>No notifications</p>';
    } else {
        state.notifications.forEach(notification => {
            const div = document.createElement('div');
            div.className = `notification-item ${notification.type}`;
            div.innerHTML = `
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${formatTime(notification.timestamp)}</div>
            `;
            elements.notificationContent.appendChild(div);
        });
    }
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function loadNotifications() {
    // Load any persistent notifications from localStorage or Firestore
    // For now, just initialize empty
    updateNotificationBadge();
}

function toggleNotificationPanel() {
    const isOpen = elements.notificationPanel.style.display === 'block';
    if (isOpen) {
        closeNotificationPanel();
    } else {
        openNotificationPanel();
    }
}

function openNotificationPanel() {
    elements.notificationPanel.style.display = 'block';
    elements.panelBackdrop.style.display = 'block';
    gsap.fromTo(elements.notificationPanel, 
        { x: '100%' },
        { x: '0%', duration: 0.3, ease: 'power2.out' }
    );
}

function closeNotificationPanel() {
    gsap.to(elements.notificationPanel, {
        x: '100%',
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
            elements.notificationPanel.style.display = 'none';
            elements.panelBackdrop.style.display = 'none';
        }
    });
}

// Modal functions
function showTripStopModal(tripData) {
    document.getElementById('trip-summary').innerHTML = `
        <p><strong>Duration:</strong> ${tripData.duration}</p>
        <p><strong>Distance:</strong> ${tripData.distance} km</p>
        <p><strong>Points:</strong> ${tripData.path.length}</p>
    `;
    elements.tripStopModal.style.display = 'flex';
}

function hideTripStopModal() {
    elements.tripStopModal.style.display = 'none';
}

function confirmTripStop() {
    hideTripStopModal();
    switchPage('trips-dashboard-page');
}

function showLogoutConfirmModal() {
    elements.logoutConfirmModal.style.display = 'flex';
}

function hideLogoutConfirmModal() {
    elements.logoutConfirmModal.style.display = 'none';
}

async function confirmLogout() {
    try {
        await signOut(auth);
        hideLogoutConfirmModal();
        addNotification('Logged out successfully', 'success');
    } catch (error) {
        console.error('Error signing out:', error);
        addNotification('Error logging out', 'error');
    }
}

// Share trip function
function shareTrip() {
    if (navigator.share) {
        navigator.share({
            title: 'My Trip',
            text: 'Check out my recent trip!',
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback for browsers that don't support Web Share API
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            addNotification('Trip link copied to clipboard!', 'success');
        }).catch(() => {
            addNotification('Unable to share trip. Please copy the URL manually.', 'error');
        });
    }
}

// Profile edit functions
function showProfileEditForm() {
    if (elements.profileForm) {
        elements.profileForm.style.display = 'block';
    }
    if (elements.editProfileBtn) {
        elements.editProfileBtn.style.display = 'none';
    }
}

function hideProfileEditForm() {
    if (elements.profileForm) {
        elements.profileForm.style.display = 'none';
    }
    if (elements.editProfileBtn) {
        elements.editProfileBtn.style.display = 'block';
    }
}

async function saveProfileData(e) {
    if (e) e.preventDefault();
    
    if (!state.currentUser) return;

    try {
        const userData = {
            uid: state.currentUser.uid,
            email: document.getElementById('edit-email')?.value || state.currentUser.email,
            name: document.getElementById('edit-name')?.value || '',
            birthday: document.getElementById('edit-birthday')?.value || '',
            gender: document.getElementById('edit-gender')?.value || '',
            location: document.getElementById('edit-location')?.value || '',
            weight: parseFloat(document.getElementById('edit-weight')?.value) || 0
        };

        // Save to Firestore
        const userQuery = query(collection(db, 'users'), where('uid', '==', state.currentUser.uid));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            await updateDoc(doc(db, 'users', userDoc.id), userData);
        } else {
            await addDoc(collection(db, 'users'), userData);
        }

        addNotification('Profile updated successfully!', 'success');
        hideProfileEditForm();
        
        // Update display
        if (elements.profileName) elements.profileName.textContent = userData.name || state.currentUser.email.split('@')[0];
    } catch (error) {
        console.error('Error saving profile:', error);
        addNotification('Failed to save profile. Please try again.', 'error');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
