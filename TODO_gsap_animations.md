# Add GSAP Animations to Signin and Signup Pages

## Steps to Complete
- [x] Add GSAP CDN to signin.html and signup.html
- [x] Add animation script to signin.html: header fade-in from top, feature cards stagger-in from left, form slide-in from right, How It Works fade-in from bottom
- [x] Add animation script to signup.html: same animations as signin.html
- [x] Test animations by launching pages in browser
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBaH-SM6yKKd6DeCd9siLp4G7UraeuhUi8",
  authDomain: "trip-bab38.firebaseapp.com",
  projectId: "trip-bab38",
  storageBucket: "trip-bab38.firebasestorage.app",
  messagingSenderId: "1069699418965",
  appId: "1:1069699418965:web:2cdd715751db1f26483ddc",
  measurementId: "G-MZ5P6QKX8T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);