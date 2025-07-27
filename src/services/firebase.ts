import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import type { FirebaseConfig } from '../types';

// Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyAZM1oIbm6XtcOz7NUzB8DcmZGC0HkDjq4",
  authDomain: "flip7-game.firebaseapp.com",
  projectId: "flip7-game",
  storageBucket: "flip7-game.firebasestorage.app",
  messagingSenderId: "42472083580",
  appId: "1:42472083580:web:239735747e4890c35b79f9",
  measurementId: "G-0DK5QW38EC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Functions
export const functions = getFunctions(app);

export default app; 