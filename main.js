// ====================================
// Main Application Controller
// ====================================

import { 
    initAuth, 
    registerUser, 
    logoutUser, 
    isUserLoggedIn,
    getCurrentUserData,
    getLeaderboard 
} from './auth.js';

import { 
    initGame, 
    startGame, 
    jump, 
    duck,
    pauseGame,
    resumeGame,
    getHighScore 
} from './game.js';

import {
    initGameSession,
    protectGameVariables,
    resetSession
} from './game-security.js';

// DOM Elements
let loadingScreen;
let loginScreen;
let gameScreen;
let loginForm;
let gameOverModal;
let leaderboardModal;
let pauseModal;
let darkModeToggle;

// Application state
let touchStartY = 0;

/**
 * Initialize the application
 */
async function init() {
    // Get DOM elements
    loadingScreen = document.getElementById('loading-screen');
    loginScreen = document.getElementById('login-screen');
    gameScreen = document.getElementById('game-screen');
    loginForm = document.getElementById('login-form');
    gameOverModal = document.getElementById('game-over-modal');
    leaderboardModal = document.getElementById('leaderboard-modal');
    pauseModal = document.getElementById('pause-modal');
    darkModeToggle = document.getElementById('dark-mode-toggle');

    // Initialize security protection
    protectGameVariables();

    // Show loading screen
    showScreen('loading');

    // Initialize Firebase auth
    await initAuth();

    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if user is already logged in
    if (isUserLoggedIn()) {
        const userData = getCurrentUserData();
        if (userData) {
            initializeGame(userData);
            showScreen('game');
        } else {
            showScreen('login');
        }
    } else {
        showScreen('login');
    }

    // Setup event listeners
    setupEventListeners();

    // Load dark mode preference
    loadDarkModePreference();

    // Setup orientation change listener
    setupOrientationListener();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Login form submission
    loginForm.addEventListener('submit', handleLogin);

    // Game controls - Keyboard
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Game controls - Touch
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Game over modal buttons - add both click and touchend for mobile support
    const restartBtn = document.getElementById('restart-btn');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const logoutGameOverBtn = document.getElementById('logout-game-over-btn');
    const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    restartBtn.addEventListener('click', handleButtonClick(restartGame));
    restartBtn.addEventListener('touchend', handleButtonTouch(restartGame));
    
    leaderboardBtn.addEventListener('click', handleButtonClick(showLeaderboard));
    leaderboardBtn.addEventListener('touchend', handleButtonTouch(showLeaderboard));
    
    logoutGameOverBtn.addEventListener('click', handleButtonClick(handleLogout));
    logoutGameOverBtn.addEventListener('touchend', handleButtonTouch(handleLogout));
    
    closeLeaderboardBtn.addEventListener('click', handleButtonClick(closeLeaderboard));
    closeLeaderboardBtn.addEventListener('touchend', handleButtonTouch(closeLeaderboard));
    
    resumeBtn.addEventListener('click', handleButtonClick(handleResume));
    resumeBtn.addEventListener('touchend', handleButtonTouch(handleResume));
    
    logoutBtn.addEventListener('click', handleButtonClick(handleLogout));
    logoutBtn.addEventListener('touchend', handleButtonTouch(handleLogout));

    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);
    darkModeToggle.addEventListener('touchend', handleButtonTouch(toggleDarkMode));

    // Game events
    window.addEventListener('scoreUpdate', updateScoreDisplay);
    window.addEventListener('gameOver', handleGameOver);

    // Click outside modals to close - prevent on mobile to avoid accidental closes
    gameOverModal.addEventListener('click', (e) => {
        if (e.target === gameOverModal && !isMobileDevice()) {
            gameOverModal.classList.remove('active');
        }
    });

    leaderboardModal.addEventListener('click', (e) => {
        if (e.target === leaderboardModal && !isMobileDevice()) {
            closeLeaderboard();
        }
    });

    pauseModal.addEventListener('click', (e) => {
        if (e.target === pauseModal && !isMobileDevice()) {
            handleResume();
        }
    });
}

/**
 * Check if device is mobile
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

/**
 * Handle button click events
 */
function handleButtonClick(callback) {
    return function(e) {
        e.stopPropagation();
        e.preventDefault();
        callback();
    };
}

/**
 * Handle button touch events for mobile
 */
function handleButtonTouch(callback) {
    return function(e) {
        e.stopPropagation();
        e.preventDefault();
        callback();
    };
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();

    // Get form data
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        class: document.getElementById('class').value.trim(),
        department: document.getElementById('department').value.trim(),
        semester: document.getElementById('semester').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };

    // Validate form
    if (!formData.fullName || !formData.class || !formData.department || 
        !formData.semester || !formData.phone) {
        alert('Please fill in all fields');
        return;
    }

    // Show loading spinner
    const submitBtn = document.getElementById('start-game-btn');
    const spinner = document.getElementById('login-spinner');
    submitBtn.disabled = true;
    spinner.classList.add('active');

    try {
        // Register user
        const result = await registerUser(formData);

        if (result.success) {
            // Initialize game
            initializeGame(result.user);
            
            // Show game screen
            showScreen('game');
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    } finally {
        submitBtn.disabled = false;
        spinner.classList.remove('active');
    }
}

/**
 * Initialize game with user data
 */
function initializeGame(userData) {
    // Display player name
    document.getElementById('player-name').textContent = userData.fullName;

    // Display high score with leading zeros
    const formattedHighScore = String(userData.highScore || 0).padStart(5, '0');
    document.getElementById('high-score').textContent = formattedHighScore;

    // Initialize security session
    initGameSession();

    // Initialize game engine
    initGame();

    // Start the game
    startGame();
}

/**
 * Handle keyboard input
 */
function handleKeyDown(e) {
    if (!gameScreen.classList.contains('active')) return;

    switch (e.key) {
        case ' ':
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            jump();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            duck(true);
            break;
        case 'Escape':
            e.preventDefault();
            togglePause();
            break;
    }
}

/**
 * Handle keyboard release
 */
function handleKeyUp(e) {
    if (!gameScreen.classList.contains('active')) return;

    switch (e.key) {
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            duck(false);
            break;
    }
}

/**
 * Handle touch start
 */
function handleTouchStart(e) {
    if (!gameScreen.classList.contains('active') || 
        gameOverModal.classList.contains('active') ||
        leaderboardModal.classList.contains('active') ||
        pauseModal.classList.contains('active')) {
        return;
    }

    touchStartY = e.touches[0].clientY;
    e.preventDefault();
}

/**
 * Handle touch move
 */
function handleTouchMove(e) {
    if (!gameScreen.classList.contains('active') || touchStartY === 0) return;

    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY;

    if (deltaY > 50) {
        // Swipe down - duck
        duck(true);
    }

    e.preventDefault();
}

/**
 * Handle touch end
 */
function handleTouchEnd(e) {
    if (!gameScreen.classList.contains('active')) return;

    if (touchStartY !== 0) {
        const touchY = e.changedTouches[0].clientY;
        const deltaY = touchY - touchStartY;

        if (Math.abs(deltaY) < 50) {
            // Tap - jump
            jump();
        }

        duck(false);
        touchStartY = 0;
    }

    e.preventDefault();
}

/**
 * Update score display
 */
function updateScoreDisplay(e) {
    // Format score with leading zeros (5 digits)
    const formattedScore = String(e.detail.score).padStart(5, '0');
    document.getElementById('current-score').textContent = formattedScore;
}

/**
 * Handle game over event
 */
function handleGameOver(e) {
    const { score, highScore, isNewRecord } = e.detail;

    // Update modal content
    document.getElementById('final-score').textContent = score;
    document.getElementById('modal-high-score').textContent = highScore;
    
    // Update high score display with leading zeros
    const formattedHighScore = String(highScore).padStart(5, '0');
    document.getElementById('high-score').textContent = formattedHighScore;

    // Show new record message if applicable
    const newRecordElement = document.getElementById('new-record');
    if (isNewRecord) {
        newRecordElement.classList.add('show');
    } else {
        newRecordElement.classList.remove('show');
    }

    // Show game over modal
    gameOverModal.classList.add('active');
}

/**
 * Restart the game
 */
function restartGame() {
    gameOverModal.classList.remove('active');
    startGame();
}

/**
 * Show leaderboard
 */
async function showLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    
    // Show loading spinner
    leaderboardList.innerHTML = '<div class="loading-spinner active"></div>';
    
    // Show modal
    leaderboardModal.classList.add('active');

    try {
        const result = await getLeaderboard(10);

        if (result.success && result.leaderboard.length > 0) {
            leaderboardList.innerHTML = result.leaderboard
                .map((player, index) => {
                    const rank = index + 1;
                    const topClass = rank <= 3 ? `top-${rank}` : '';
                    
                    return `
                        <div class="leaderboard-item ${topClass}">
                            <div class="leaderboard-rank">${rank}</div>
                            <div class="leaderboard-info">
                                <div class="leaderboard-name">${player.fullName}</div>
                                <div class="leaderboard-details">${player.class} • ${player.department}</div>
                            </div>
                            <div class="leaderboard-score">${player.highScore}</div>
                        </div>
                    `;
                })
                .join('');
        } else {
            leaderboardList.innerHTML = '<p style="text-align: center; color: var(--secondary-text);">No players yet. Be the first!</p>';
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardList.innerHTML = '<p style="text-align: center; color: var(--tedx-red);">Error loading leaderboard</p>';
    }
}

/**
 * Close leaderboard
 */
function closeLeaderboard() {
    leaderboardModal.classList.remove('active');
}

/**
 * Toggle pause
 */
function togglePause() {
    if (pauseModal.classList.contains('active')) {
        handleResume();
    } else {
        pauseGame();
        pauseModal.classList.add('active');
    }
}

/**
 * Resume game
 */
function handleResume() {
    pauseModal.classList.remove('active');
    resumeGame();
}

/**
 * Handle logout
 */
async function handleLogout() {
    const confirm = window.confirm('Are you sure you want to logout?');
    
    if (confirm) {
        await logoutUser();
        
        // Close all modals
        gameOverModal.classList.remove('active');
        leaderboardModal.classList.remove('active');
        pauseModal.classList.remove('active');
        
        // Reset form
        loginForm.reset();
        
        // Show login screen
        showScreen('login');
    }
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    // Save preference
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('tedx_dark_mode', isDarkMode);
}

/**
 * Load dark mode preference
 */
function loadDarkModePreference() {
    const isDarkMode = localStorage.getItem('tedx_dark_mode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

/**
 * Show specific screen
 */
function showScreen(screenName) {
    // Hide all screens
    loadingScreen.classList.remove('active');
    loginScreen.classList.remove('active');
    gameScreen.classList.remove('active');

    // Show requested screen
    switch (screenName) {
        case 'loading':
            loadingScreen.classList.add('active');
            break;
        case 'login':
            loginScreen.classList.add('active');
            break;
        case 'game':
            gameScreen.classList.add('active');
            break;
    }
}

/**
 * Setup orientation change listener for mobile
 */
function setupOrientationListener() {
    // Check orientation on load
    checkOrientation();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);
}

/**
 * Check device orientation and show/hide rotate prompt
 */
function checkOrientation() {
    const rotatePrompt = document.getElementById('rotate-prompt');
    
    if (!rotatePrompt) return;
    
    // Only apply to mobile devices
    if (isMobileDevice()) {
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (isPortrait) {
            rotatePrompt.style.display = 'flex';
        } else {
            rotatePrompt.style.display = 'none';
        }
    } else {
        rotatePrompt.style.display = 'none';
    }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
