// auth-guard.js
// This script protects pages from being accessed by non-logged-in users.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// Your web app's Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyBaH-SM6yKKd6DeCd9siLp4G7UraeuhUi8",
  authDomain: "trip-bab38.firebaseapp.com",
  projectId: "trip-bab38",
  storageBucket: "trip-bab38.firebasestorage.app",
  messagingSenderId: "1069699418965",
  appId: "1:1069699418965:web:d9183b6f20e8743f483ddc",
  measurementId: "G-E0VZWSESBB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // No user is signed in.
    console.log("No user signed in. Redirecting to signin page.");
    // Redirect them to the sign-in page.
    // Make sure the current page isn't the sign-in or sign-up page to avoid an infinite loop.
    const currentPage = window.location.pathname;
    if (currentPage !== '/signin.html' && currentPage !== '/signup.html') {
        window.location.href = '/signin.html';
    }
  } else {
    // User is signed in.
    console.log("User is signed in:", user.uid);
    // You can now show the page content.
    // This line makes the page visible after the check is complete.
    document.body.style.display = 'block';
  }
});
