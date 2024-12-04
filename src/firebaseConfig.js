// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration object (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "fish-silage-tracker.firebaseapp.com",
  projectId: "fish-silage-tracker",
  storageBucket: "fish-silage-tracker.appspot.com",
  messagingSenderId: "1002870291358",
  appId: "1:1002870291358:web:db668366bf6270db73b48f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
