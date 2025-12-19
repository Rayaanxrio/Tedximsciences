// ====================================
// Authentication & User Management
// ====================================

import { auth, db } from './firebase-config.js';
import { 
    signInAnonymously, 
    onAuthStateChanged,
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { validateScore } from './game-security.js';

// Current user data
let currentUser = null;

/**
 * Initialize authentication state listener
 */
export function initAuth() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                currentUser = user;
                await loadUserData();
                resolve(user);
            } else {
                // User is signed out
                currentUser = null;
                resolve(null);
            }
        });
    });
}

/**
 * Register a new user with their details
 * @param {Object} userData - User information from the form
 */
export async function registerUser(userData) {
    try {
        // Sign in anonymously first
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;

        // Store user data in Firestore
        const userDoc = {
            uid: user.uid,
            fullName: userData.fullName,
            class: userData.class,
            department: userData.department,
            semester: userData.semester,
            phone: userData.phone,
            highScore: 0,
            createdAt: new Date().toISOString(),
            lastPlayed: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', user.uid), userDoc);
        
        // Store user data in localStorage for offline access
        localStorage.setItem('tedx_user', JSON.stringify(userDoc));
        
        currentUser = user;
        return { success: true, user: userDoc };
    } catch (error) {
        console.error('Error registering user:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Load user data from Firestore
 */
export async function loadUserData() {
    if (!currentUser) return null;

    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Store in localStorage for offline access
            localStorage.setItem('tedx_user', JSON.stringify(userData));
            return userData;
        } else {
            console.log('No user data found');
            return null;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        // Try to load from localStorage if offline
        const cachedUser = localStorage.getItem('tedx_user');
        return cachedUser ? JSON.parse(cachedUser) : null;
    }
}

/**
 * Get current user data
 */
export function getCurrentUserData() {
    const cachedUser = localStorage.getItem('tedx_user');
    return cachedUser ? JSON.parse(cachedUser) : null;
}

/**
 * Update user's high score (with security validation)
 * @param {number} newScore - The new score to save
 */
export async function updateHighScore(newScore) {
    if (!currentUser) return { success: false, error: 'No user logged in' };

    // SECURITY: Validate score before saving
    const validation = validateScore(newScore);
    if (!validation.valid) {
        console.error('❌ Score validation failed:', validation.reason);
        
        // Show warning to user
        alert(`⚠️ Score validation failed: ${validation.reason}\n\nPlease play fairly!`);
        
        return { 
            success: false, 
            error: 'Score validation failed',
            reason: validation.reason 
        };
    }

    try {
        const userData = getCurrentUserData();
        const currentHighScore = userData?.highScore || 0;

        // Only update if new score is higher
        if (newScore > currentHighScore) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                highScore: newScore,
                lastPlayed: new Date().toISOString(),
                gamesPlayed: (userData.gamesPlayed || 0) + 1
            });

            // Update localStorage
            userData.highScore = newScore;
            userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
            localStorage.setItem('tedx_user', JSON.stringify(userData));

            console.log('✅ Score validated and saved:', newScore);
            return { success: true, isNewRecord: true, highScore: newScore };
        } else {
            // Update last played time and games played
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                lastPlayed: new Date().toISOString(),
                gamesPlayed: (userData.gamesPlayed || 0) + 1
            });

            userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
            localStorage.setItem('tedx_user', JSON.stringify(userData));

            return { success: true, isNewRecord: false, highScore: currentHighScore };
        }
    } catch (error) {
        console.error('Error updating high score:', error);
        
        // Update localStorage even if Firestore fails (offline support)
        try {
            const userData = getCurrentUserData();
            if (userData && newScore > (userData.highScore || 0)) {
                userData.highScore = newScore;
                localStorage.setItem('tedx_user', JSON.stringify(userData));
                return { success: true, isNewRecord: true, highScore: newScore, offline: true };
            }
        } catch (localError) {
            console.error('Error updating local storage:', localError);
        }

        return { success: false, error: error.message };
    }
}

/**
 * Get top players from leaderboard
 * @param {number} limitCount - Number of top players to retrieve (default: 10)
 */
export async function getLeaderboard(limitCount = 10) {
    try {
        const leaderboardQuery = query(
            collection(db, 'users'),
            orderBy('highScore', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(leaderboardQuery);
        const leaderboard = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            leaderboard.push({
                uid: doc.id,
                fullName: data.fullName,
                class: data.class,
                department: data.department,
                highScore: data.highScore || 0
            });
        });

        return { success: true, leaderboard };
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return { success: false, error: error.message, leaderboard: [] };
    }
}

/**
 * Logout current user
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        localStorage.removeItem('tedx_user');
        currentUser = null;
        return { success: true };
    } catch (error) {
        console.error('Error logging out:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if user is logged in
 */
export function isUserLoggedIn() {
    return currentUser !== null || localStorage.getItem('tedx_user') !== null;
}

/**
 * Get current Firebase user
 */
export function getCurrentUser() {
    return currentUser;
}
