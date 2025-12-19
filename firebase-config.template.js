// ====================================
// Firebase Configuration Template
// ====================================
// 
// INSTRUCTIONS:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Select your project
// 3. Click the gear icon → Project settings
// 4. Scroll down to "Your apps" section
// 5. Click on your web app or create one
// 6. Copy the config values and paste them below
// 7. Save this file
//
// IMPORTANT: Never commit real Firebase credentials to public repositories!
// ====================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// TODO: Replace with your actual Firebase configuration
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Example of what it should look like (don't use these values):
// const firebaseConfig = {
//     apiKey: "AIzaSyAbc123Def456Ghi789Jkl012Mno345Pqr",
//     authDomain: "tedximscience-game.firebaseapp.com",
//     projectId: "tedximscience-game",
//     storageBucket: "tedximscience-game.appspot.com",
//     messagingSenderId: "123456789012",
//     appId: "1:123456789012:web:abc123def456ghi789"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export app for other uses
export default app;
