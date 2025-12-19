// ====================================
// Game Security Module
// ====================================

/**
 * Anti-Cheat and Security Protection
 * This module prevents console manipulation and validates scores
 */

// Security Configuration
const SECURITY_CONFIG = {
    MAX_SCORE: 5000,              // Maximum realistic score
    CONSOLE_CHECK_INTERVAL: 500   // Check for devtools twice per second
};

// Game session tracking (hidden in closure)
let gameSession = {
    startTime: null,
    lastScore: 0,
    scoreUpdates: [],
    isValid: true,
    consoleWarningShown: false
};

/**
 * Initialize game session
 */
export function initGameSession() {
    gameSession = {
        startTime: Date.now(),
        lastScore: 0,
        scoreUpdates: [],
        isValid: true,
        consoleWarningShown: false
    };
    
    // Start console detection
    startConsoleDetection();
}

/**
 * Validate score before submitting to Firebase
 * @param {number} score - The score to validate
 * @returns {Object} - {valid: boolean, reason: string}
 */
export function validateScore(score) {
    // Check if session is valid (console tampering detection)
    if (!gameSession.isValid) {
        return { valid: false, reason: 'Invalid session detected - Console tampering detected' };
    }
    
    // Check maximum score limit
    if (score > SECURITY_CONFIG.MAX_SCORE) {
        console.warn('⚠️ Score exceeds maximum limit');
        return { valid: false, reason: 'Score too high (max: 5000)' };
    }
    
    // Update tracking
    gameSession.lastScore = score;
    gameSession.scoreUpdates.push({
        score: score,
        timestamp: Date.now()
    });
    
    return { valid: true, reason: 'Score validated successfully' };
}

/**
 * Detect if developer console is open
 */
function startConsoleDetection() {
    let devtoolsOpen = false;
    
    const element = new Image();
    Object.defineProperty(element, 'id', {
        get: function() {
            devtoolsOpen = true;
            return 'devtools';
        }
    });
    
    setInterval(() => {
        devtoolsOpen = false;
        console.log('%c', element);
        console.clear();
        
        if (devtoolsOpen) {
            handleConsoleDetected();
        }
    }, SECURITY_CONFIG.CONSOLE_CHECK_INTERVAL);
}

/**
 * Handle console detection
 */
function handleConsoleDetected() {
    if (!gameSession.consoleWarningShown) {
        console.warn(
            '%c⚠️ SECURITY WARNING ⚠️',
            'color: red; font-size: 24px; font-weight: bold;'
        );
        console.warn(
            '%cDeveloper Console Detected!\n\n' +
            'Manipulating game variables or scores will result in:\n' +
            '• Score invalidation\n' +
            '• Account flagging\n' +
            '• Potential ban\n\n' +
            'Play fair and have fun! 🎮',
            'color: orange; font-size: 14px;'
        );
        gameSession.consoleWarningShown = true;
    }
    
    // Mark session as potentially compromised
    gameSession.isValid = false;
}

/**
 * Disable common console cheats and strengthen protection
 */
export function protectGameVariables() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showWarning('⚠️ Right-click disabled for fair gameplay');
        return false;
    });
    
    // Disable common keyboard shortcuts for devtools
    document.addEventListener('keydown', (e) => {
        // F12 key
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            showWarning('🔒 Developer tools are disabled for fair play');
            gameSession.isValid = false; // Invalidate session
            return false;
        }
        
        // Ctrl+Shift+I / Cmd+Option+I (DevTools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
            e.preventDefault();
            showWarning('🔒 Developer tools are disabled for fair play');
            gameSession.isValid = false;
            return false;
        }
        
        // Ctrl+Shift+J / Cmd+Option+J (Console)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault();
            showWarning('🔒 Console access is disabled for fair play');
            gameSession.isValid = false;
            return false;
        }
        
        // Ctrl+Shift+C / Cmd+Option+C (Inspect)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            showWarning('🔒 Inspect tool is disabled for fair play');
            gameSession.isValid = false;
            return false;
        }
        
        // Ctrl+U / Cmd+U (view source)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+K (Firefox console)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
            e.preventDefault();
            showWarning('🔒 Console access is disabled for fair play');
            gameSession.isValid = false;
            return false;
        }
    });
    
    // Completely disable console
    try {
        const noop = () => {};
        ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp', 'context', 'memory'].forEach(method => {
            try {
                if (console[method]) {
                    console[method] = noop;
                }
            } catch (e) {
                // Silently fail if can't override
            }
        });
    } catch (e) {
        // Console protection failed, but continue
    }
    
    // Prevent debugging
    setInterval(() => {
        debugger; // This will trigger if devtools is open
    }, 100);
}

/**
 * Show warning message
 */
function showWarning(message) {
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #E62B1E;
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 18px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    warningDiv.textContent = message;
    document.body.appendChild(warningDiv);
    
    setTimeout(() => {
        warningDiv.remove();
    }, 3000);
}

/**
 * Get game session info (for debugging by admin only)
 */
export function getSessionInfo() {
    const duration = gameSession.startTime ? 
        Math.floor((Date.now() - gameSession.startTime) / 1000) : 0;
    
    return {
        duration: duration,
        isValid: gameSession.isValid,
        scoreUpdates: gameSession.scoreUpdates.length,
        lastScore: gameSession.lastScore
    };
}

/**
 * Reset security session
 */
export function resetSession() {
    gameSession = {
        startTime: null,
        lastScore: 0,
        scoreUpdates: [],
        isValid: true,
        consoleWarningShown: false
    };
}

// Protect this module from tampering
Object.freeze(SECURITY_CONFIG);
