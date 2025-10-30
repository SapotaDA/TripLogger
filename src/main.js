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
    logoutBtn: document.getElementById('logout-btn'),

    // Trips
    recentTrips: document.getElementById('recent-trips'),
    allTripsList: document.getElementById('all-trips-list'),
    totalDistance: document.getElementById('total-distance'),
    totalTrips: document.getElementById('total-trips'),
    avgSpeed: document.getElementById('avg-speed')
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
        } else {
            state.currentUser = null;
            showUnauthenticatedUI();
            redirectToSignIn();
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

    // Notifications
    if (elements.notificationBtn) elements.notificationBtn.addEventListener('click', toggleNotificationPanel);
    if (elements.closeNotificationPanel) elements.closeNotificationPanel.addEventListener('click', closeNotificationPanel);
    if (elements.panelBackdrop) elements.panelBackdrop.addEventListener('click', closeNotificationPanel);

    // Modals
    if (elements.cancelLogout) elements.cancelLogout.addEventListener('click', hideLogoutConfirmModal);
    if (elements.confirmLogout) elements.confirmLogout.addEventListener('click', confirmLogout);

    // Profile
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', showLogoutConfirmModal);
    
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
    }

    state.currentPage = pageId;
}

// Initialize Leaflet map
function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.log('Map element not found, skipping map initialization');
        return;
    }

    try {
        state.map = L.map('map').setView(state.userLocation, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(state.map);

        // Add user marker
        state.userMarker = L.marker(state.userLocation).addTo(state.map);
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Start trip
function startTrip() {
    state.isTripActive = true;
    state.isPaused = false;
    state.path = [];
    state.startTime = Date.now();
    state.totalPausedTime = 0;

    // Update UI
    elements.startTripBtn.style.display = 'none';
    elements.pauseTripBtn.style.display = 'inline-block';
    elements.stopTripBtn.style.display = 'inline-block';

    // Reset stats
    elements.duration.textContent = '00:00:00';
    elements.distance.textContent = '0.00 km';

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

    // Update UI
    elements.pauseTripBtn.style.display = 'none';
    elements.resumeTripBtn.style.display = 'inline-block';

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

    // Update UI
    elements.resumeTripBtn.style.display = 'none';
    elements.pauseTripBtn.style.display = 'inline-block';

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

    // Clear path polyline
    if (state.pathPolyline) {
        state.map.removeLayer(state.pathPolyline);
        state.pathPolyline = null;
    }

    // Stop tracking
    stopLocationTracking();
    stopTimer();

    // Reset UI
    elements.startTripBtn.style.display = 'inline-block';
    elements.pauseTripBtn.style.display = 'none';
    elements.resumeTripBtn.style.display = 'none';
    elements.stopTripBtn.style.display = 'none';

    elements.duration.textContent = '00:00:00';
    elements.distance.textContent = '0.00 km';
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
    const { latitude, longitude } = position.coords;
    state.userLocation = [latitude, longitude];

    // Update user marker
    state.userMarker.setLatLng(state.userLocation);

    // Add to path
    state.path.push([latitude, longitude]);

    // Update path polyline
    updatePathPolyline();

    // Update distance
    updateDistance();

    // Center map on user
    state.map.setView(state.userLocation);
}

// Handle location error
function handleLocationError(error) {
    console.error('Location error:', error);
    addNotification('Unable to get your location. Please check your GPS settings.', 'error');
}

// Update path polyline on map
function updatePathPolyline() {
    if (state.path.length < 2) return;

    if (state.pathPolyline) {
        state.map.removeLayer(state.pathPolyline);
    }

    state.pathPolyline = L.polyline(state.path, {
        color: '#007bff',
        weight: 4,
        opacity: 0.7
    }).addTo(state.map);
}

// Update distance display
function updateDistance() {
    const distance = calculateTotalDistance();
    elements.distance.textContent = `${distance.toFixed(2)} km`;
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
        if (!state.isPaused) {
            const elapsed = Math.floor((Date.now() - state.startTime - state.totalPausedTime) / 1000);
            elements.duration.textContent = formatDuration(elapsed);
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
