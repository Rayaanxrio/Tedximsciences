// ====================================
// TEDxImScience Dino Game Engine
// ====================================

import { updateHighScore, getCurrentUserData } from './auth.js';

// Game configuration
const CONFIG = {
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    DUCK_FORCE: 5,
    PLAYER_X: 80,
    INITIAL_SPEED: 8,        // Faster start (was 7)
    SPEED_INCREMENT: 0.015,  // Faster acceleration (was 0.012)
    MAX_SPEED: 22,           // Higher max speed (was 18)
    OBSTACLE_MIN_GAP: 120,   // Tighter gaps (was 150)
    OBSTACLE_MAX_GAP: 350,   // Reduced max gap (was 400)
    GROUND_HEIGHT: 80,
    FPS: 60,
    // Progressive difficulty settings
    GAP_DECREASE_RATE: 1.0,  // Even faster gap reduction (was 0.8)
    MIN_POSSIBLE_GAP: 80,    // Much tighter minimum (was 100)
    MAX_POSSIBLE_GAP: 300    // Tighter max (was 350)
};

// Mobile detection and scaling
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

function getScaleFactor() {
    if (window.innerWidth <= 480) {
        return 0.7; // Smaller elements on small phones
    } else if (window.innerWidth <= 768) {
        return 0.85; // Medium size on tablets
    }
    return 1; // Full size on desktop
}

// Game state
let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    highScore: 0,
    speed: CONFIG.INITIAL_SPEED,
    obstacles: [],
    particles: [],
    frameCount: 0,
    lastObstacleFrame: 0,
    currentLetterIndex: 0  // Track position in TEDxImScience sequence
};

// Canvas and context
let canvas;
let ctx;

// Player object (base sizes, will be scaled for mobile)
const BASE_PLAYER_SIZE = {
    width: 50,
    height: 50,
    duckHeight: 25
};

const player = {
    x: CONFIG.PLAYER_X,
    y: 0,
    width: BASE_PLAYER_SIZE.width,
    height: BASE_PLAYER_SIZE.height,
    velocityY: 0,
    isJumping: false,
    isDucking: false,
    normalHeight: BASE_PLAYER_SIZE.height,
    duckHeight: BASE_PLAYER_SIZE.duckHeight
};

// Obstacle types - TEDxImScience letters in sequence
// Color will be dynamically set based on dark mode
const LETTER_SEQUENCE = ['T', 'E', 'D', 'x', 'I', 'm', 'S', 'c', 'i', 'e', 'n', 'c', 'e'];

const OBSTACLE_TYPES = [
    // Ground obstacles - appear in sequence
    { width: 35, height: 50, colorType: 'red', letter: 'T', flying: false },
    { width: 35, height: 50, colorType: 'red', letter: 'E', flying: false },
    { width: 35, height: 50, colorType: 'red', letter: 'D', flying: false },
    { width: 35, height: 50, colorType: 'contrast', letter: 'x', flying: false },
    { width: 35, height: 50, colorType: 'red', letter: 'I', flying: false },
    { width: 35, height: 50, colorType: 'red', letter: 'm', flying: false },
    { width: 35, height: 50, colorType: 'contrast', letter: 'S', flying: false },
    { width: 35, height: 50, colorType: 'red', letter: 'c', flying: false },
    { width: 35, height: 50, colorType: 'contrast', letter: 'i', flying: false },
    { width: 35, height: 50, colorType: 'red', letter: 'e', flying: false },
    { width: 35, height: 50, colorType: 'contrast', letter: 'n', flying: false },
    { width: 35, height: 50, colorType: 'red', letter: 'c', flying: false },
    { width: 35, height: 50, colorType: 'contrast', letter: 'e', flying: false },
    // Flying obstacles (appear in air)
    { width: 40, height: 35, colorType: 'red', letter: 'X', flying: true },
    { width: 40, height: 35, colorType: 'contrast', letter: 'x', flying: true },
    { width: 40, height: 35, colorType: 'red', letter: '✕', flying: true },
];

/**
 * Initialize the game
 */
export function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load high score
    const userData = getCurrentUserData();
    if (userData) {
        gameState.highScore = userData.highScore || 0;
    }

    // Set ground level
    player.y = canvas.height - CONFIG.GROUND_HEIGHT - player.height;
}

/**
 * Resize canvas to fill the available space
 */
function resizeCanvas() {
    // Get the game screen element
    const gameScreen = document.getElementById('game-screen');
    const header = document.querySelector('.game-header');
    const controlsInfo = document.querySelector('.controls-info');
    
    // Calculate available height
    const headerHeight = header ? header.offsetHeight : 0;
    const controlsHeight = controlsInfo ? controlsInfo.offsetHeight : 0;
    const availableHeight = window.innerHeight - headerHeight - controlsHeight;
    
    // Set canvas to full width and available height
    canvas.width = window.innerWidth;
    canvas.height = availableHeight;

    // Apply mobile scaling to player size
    const scale = getScaleFactor();
    player.width = BASE_PLAYER_SIZE.width * scale;
    player.height = BASE_PLAYER_SIZE.height * scale;
    player.normalHeight = BASE_PLAYER_SIZE.height * scale;
    player.duckHeight = BASE_PLAYER_SIZE.duckHeight * scale;

    // Update player position
    if (player.y > 0) {
        player.y = canvas.height - CONFIG.GROUND_HEIGHT - player.height;
    }
}

/**
 * Start the game
 */
export function startGame() {
    resetGame();
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameLoop();
}

/**
 * Pause the game
 */
export function pauseGame() {
    gameState.isPaused = true;
}

/**
 * Resume the game
 */
export function resumeGame() {
    gameState.isPaused = false;
    gameLoop();
}

/**
 * Stop the game
 */
export function stopGame() {
    gameState.isRunning = false;
    gameState.isPaused = false;
}

/**
 * Reset game state
 */
function resetGame() {
    gameState.score = 0;
    gameState.speed = CONFIG.INITIAL_SPEED;
    gameState.obstacles = [];
    gameState.particles = [];
    gameState.frameCount = 0;
    gameState.lastObstacleFrame = 0;
    gameState.currentLetterIndex = 0;  // Reset letter sequence
    
    player.y = canvas.height - CONFIG.GROUND_HEIGHT - player.height;
    player.velocityY = 0;
    player.isJumping = false;
    player.isDucking = false;
    player.height = player.normalHeight;
}

/**
 * Main game loop
 */
function gameLoop() {
    if (!gameState.isRunning || gameState.isPaused) return;

    update();
    render();

    requestAnimationFrame(gameLoop);
}

/**
 * Update game logic
 */
function update() {
    gameState.frameCount++;

    // Update score
    gameState.score = Math.floor(gameState.frameCount / 10);

    // Increase speed over time with acceleration
    if (gameState.speed < CONFIG.MAX_SPEED) {
        // Speed increases faster at higher scores
        const speedBoost = 1 + (gameState.score / 500);
        gameState.speed += CONFIG.SPEED_INCREMENT * speedBoost;
        gameState.speed = Math.min(gameState.speed, CONFIG.MAX_SPEED);
    }

    // Update player
    updatePlayer();

    // Generate obstacles
    if (shouldGenerateObstacle()) {
        generateObstacle();
    }

    // Update obstacles
    updateObstacles();

    // Update particles
    updateParticles();

    // Check collisions
    checkCollisions();

    // Emit score event for UI update
    window.dispatchEvent(new CustomEvent('scoreUpdate', { 
        detail: { score: gameState.score } 
    }));
}

/**
 * Update player physics
 */
function updatePlayer() {
    const groundY = canvas.height - CONFIG.GROUND_HEIGHT - player.height;

    // Apply gravity
    if (player.y < groundY || player.velocityY < 0) {
        player.velocityY += CONFIG.GRAVITY;
        player.y += player.velocityY;
    }

    // Ground collision
    if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // Handle ducking
    if (player.isDucking && !player.isJumping) {
        player.height = player.duckHeight;
    } else {
        player.height = player.normalHeight;
    }
}

/**
 * Player jump
 */
export function jump() {
    if (!player.isJumping && !player.isDucking && gameState.isRunning && !gameState.isPaused) {
        player.velocityY = CONFIG.JUMP_FORCE;
        player.isJumping = true;
        createJumpParticles();
    }
}

/**
 * Player duck
 */
export function duck(isDucking) {
    if (gameState.isRunning && !gameState.isPaused) {
        player.isDucking = isDucking;
        if (isDucking && !player.isJumping) {
            player.height = player.duckHeight;
            player.y = canvas.height - CONFIG.GROUND_HEIGHT - player.duckHeight;
        }
    }
}

/**
 * Check if should generate new obstacle (with progressive difficulty)
 */
function shouldGenerateObstacle() {
    // Calculate difficulty multiplier based on score
    const scoreMultiplier = Math.max(0, 1 - (gameState.score / 1000));
    
    // Decrease gaps as score increases
    let minGap = CONFIG.OBSTACLE_MIN_GAP - (gameState.score * CONFIG.GAP_DECREASE_RATE);
    let maxGap = CONFIG.OBSTACLE_MAX_GAP - (gameState.score * CONFIG.GAP_DECREASE_RATE);
    
    // Ensure gaps don't go below/above limits
    minGap = Math.max(CONFIG.MIN_POSSIBLE_GAP, minGap);
    maxGap = Math.max(CONFIG.MAX_POSSIBLE_GAP, maxGap);
    maxGap = Math.max(maxGap, minGap + 50); // Keep some variation
    
    const randomGap = Math.random() * (maxGap - minGap) + minGap;
    
    return gameState.frameCount - gameState.lastObstacleFrame > (randomGap / CONFIG.FPS) * CONFIG.FPS;
}

/**
 * Generate new obstacle (with chance of double obstacles at higher scores)
 */
function generateObstacle() {
    // Determine if we should use sequence (ground) or random (flying)
    const useFlying = Math.random() < 0.35; // Increased to 35% chance of flying obstacle (was 30%)
    
    let obstacleType;
    
    if (useFlying) {
        // Pick random flying obstacle
        const flyingObstacles = OBSTACLE_TYPES.filter(o => o.flying);
        obstacleType = flyingObstacles[Math.floor(Math.random() * flyingObstacles.length)];
    } else {
        // Use letter sequence for ground obstacles
        const groundObstacles = OBSTACLE_TYPES.filter(o => !o.flying);
        obstacleType = groundObstacles[gameState.currentLetterIndex % groundObstacles.length];
        gameState.currentLetterIndex++; // Move to next letter in sequence
    }
    
    let yPosition;
    const scale = getScaleFactor();
    const scaledWidth = obstacleType.width * scale;
    const scaledHeight = obstacleType.height * scale;
    
    if (obstacleType.flying) {
        // Flying obstacles at player head height - MUST duck to avoid!
        const flyingHeights = [
            canvas.height - CONFIG.GROUND_HEIGHT - (65 * scale),  // Head height (requires duck)
            canvas.height - CONFIG.GROUND_HEIGHT - (55 * scale),  // Slightly lower (requires duck)
        ];
        yPosition = flyingHeights[Math.floor(Math.random() * flyingHeights.length)];
    } else {
        // Ground obstacles
        yPosition = canvas.height - CONFIG.GROUND_HEIGHT - scaledHeight;
    }
    
    const obstacle = {
        x: canvas.width,
        y: yPosition,
        width: scaledWidth,
        height: scaledHeight,
        colorType: obstacleType.colorType,
        letter: obstacleType.letter,
        flying: obstacleType.flying,
        passed: false
    };

    gameState.obstacles.push(obstacle);
    
    // Progressive difficulty: Add double obstacles at higher scores (same type only)
    // Starts at score 10 (even earlier!), increases chance faster
    if (gameState.score >= 10) {
        const doubleChance = Math.min((gameState.score - 10) / 60, 0.6); // Max 60% chance, even faster ramp (was 50% at 80)
        if (Math.random() < doubleChance) {
            // Add a second obstacle of THE SAME TYPE close to the first one
            let secondY;
            
            if (obstacleType.flying) {
                // Same type of flying obstacle at same or different height
                const flyingHeights = [
                    canvas.height - CONFIG.GROUND_HEIGHT - (65 * scale),
                    canvas.height - CONFIG.GROUND_HEIGHT - (55 * scale),
                ];
                secondY = flyingHeights[Math.floor(Math.random() * flyingHeights.length)];
            } else {
                // Same height for ground obstacles
                secondY = canvas.height - CONFIG.GROUND_HEIGHT - scaledHeight;
            }
            
            const secondObstacle = {
                x: canvas.width + 60, // Even tighter gap between obstacles (was 70)
                y: secondY,
                width: scaledWidth,
                height: scaledHeight,
                colorType: obstacleType.colorType,
                letter: obstacleType.letter,
                flying: obstacleType.flying,
                passed: false
            };
            
            gameState.obstacles.push(secondObstacle);
        }
    }
    
    gameState.lastObstacleFrame = gameState.frameCount;
}

/**
 * Update obstacles
 */
function updateObstacles() {
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obstacle = gameState.obstacles[i];
        
        // Move obstacle
        obstacle.x -= gameState.speed;

        // Remove if off screen
        if (obstacle.x + obstacle.width < 0) {
            gameState.obstacles.splice(i, 1);
        }
    }
}

/**
 * Check collisions between player and obstacles
 */
function checkCollisions() {
    for (const obstacle of gameState.obstacles) {
        // Calculate actual position including floating animation
        let obstacleY = obstacle.y;
        if (obstacle.flying) {
            const yOffset = Math.sin(gameState.frameCount * 0.1 + obstacle.x * 0.01) * 5;
            obstacleY = obstacle.y + yOffset;
        }
        
        // Skip collision if ducking and obstacle is flying high enough
        if (player.isDucking && obstacle.flying) {
            // If flying obstacle is high enough, ducking player can avoid it
            const playerTop = player.y;
            const obstacleBottom = obstacleY + obstacle.height;
            
            // If obstacle is above the ducking player, no collision
            if (obstacleBottom < playerTop + 10) { // Small margin
                continue;
            }
        }
        
        // Create adjusted obstacle for collision check
        const adjustedObstacle = {
            x: obstacle.x,
            y: obstacleY,
            width: obstacle.width,
            height: obstacle.height
        };
        
        if (isColliding(player, adjustedObstacle)) {
            gameOver();
            return;
        }
    }
}

/**
 * Check if two rectangles are colliding
 */
function isColliding(rect1, rect2) {
    // Add small margin for better gameplay
    const margin = 5;
    
    return rect1.x + margin < rect2.x + rect2.width &&
           rect1.x + rect1.width - margin > rect2.x &&
           rect1.y + margin < rect2.y + rect2.height &&
           rect1.y + rect1.height - margin > rect2.y;
}

/**
 * Game over
 */
async function gameOver() {
    stopGame();
    
    // Create explosion particles
    createExplosionParticles(player.x + player.width / 2, player.y + player.height / 2);

    // Update high score
    const result = await updateHighScore(gameState.score);
    
    if (result.success) {
        gameState.highScore = result.highScore;
    }

    // Emit game over event
    window.dispatchEvent(new CustomEvent('gameOver', { 
        detail: { 
            score: gameState.score, 
            highScore: gameState.highScore,
            isNewRecord: result.isNewRecord
        } 
    }));
}

/**
 * Create jump particles
 */
function createJumpParticles() {
    for (let i = 0; i < 5; i++) {
        gameState.particles.push({
            x: player.x + Math.random() * player.width,
            y: player.y + player.height,
            velocityX: (Math.random() - 0.5) * 4,
            velocityY: Math.random() * 2,
            life: 30,
            color: '#E62B1E'
        });
    }
}

/**
 * Create explosion particles
 */
function createExplosionParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        gameState.particles.push({
            x: x,
            y: y,
            velocityX: Math.cos(angle) * 5,
            velocityY: Math.sin(angle) * 5,
            life: 50,
            color: Math.random() > 0.5 ? '#E62B1E' : '#000000'
        });
    }
}

/**
 * Update particles
 */
function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += 0.3; // Gravity
        particle.life--;

        if (particle.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

/**
 * Render the game
 */
function render() {
    // Get current theme
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Simple solid background - white or black
    const bgColor = isDarkMode ? '#000000' : '#FFFFFF';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle "TEDxImScience" watermark in background
    drawWatermark();

    // Draw ground with subtle gradient
    const groundGradient = ctx.createLinearGradient(0, canvas.height - CONFIG.GROUND_HEIGHT, 0, canvas.height);
    if (isDarkMode) {
        groundGradient.addColorStop(0, '#1a1a1a');
        groundGradient.addColorStop(1, '#0a0a0a');
    } else {
        groundGradient.addColorStop(0, '#F0F0F0');
        groundGradient.addColorStop(1, '#E0E0E0');
    }
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - CONFIG.GROUND_HEIGHT, canvas.width, CONFIG.GROUND_HEIGHT);

    // Draw ground line
    const lineColor = isDarkMode ? '#333333' : '#CCCCCC';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - CONFIG.GROUND_HEIGHT);
    ctx.lineTo(canvas.width, canvas.height - CONFIG.GROUND_HEIGHT);
    ctx.stroke();

    // Draw player (TEDx X logo)
    drawPlayer();

    // Draw obstacles
    for (const obstacle of gameState.obstacles) {
        drawObstacle(obstacle);
    }

    // Draw particles
    for (const particle of gameState.particles) {
        drawParticle(particle);
    }
}

/**
 * Draw subtle watermark text in background
 */
function drawWatermark() {
    ctx.save();
    
    // Brighter transparent red watermark
    ctx.globalAlpha = 0.12;  // More visible
    ctx.font = 'bold 100px Montserrat';
    ctx.textAlign = 'left';  // Changed to left align for proper spacing
    ctx.textBaseline = 'middle';
    
    // Draw watermarks with proper spacing
    const text = 'TEDxImScience  ';  // Added spaces for separation
    const spacing = 1000;  // Even more spacing to prevent overlap
    const yPos = canvas.height / 2 - 50;
    
    // Slow horizontal scroll
    const scrollOffset = (gameState.frameCount * 0.3) % spacing;
    
    for (let x = -500; x < canvas.width + 500; x += spacing) {
        ctx.fillStyle = '#FF3B2F';  // Brighter TEDx red color
        ctx.fillText(text, x + scrollOffset, yPos);
    }
    
    ctx.restore();
}

/**
 * Draw the player (TEDx X logo)
 */
function drawPlayer() {
    ctx.save();
    
    // Draw TEDx "X" shape
    ctx.fillStyle = '#E62B1E';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const size = Math.min(player.width, player.height) * 0.8;

    // Draw X shape
    ctx.beginPath();
    ctx.moveTo(centerX - size / 2, centerY - size / 2);
    ctx.lineTo(centerX + size / 2, centerY + size / 2);
    ctx.moveTo(centerX + size / 2, centerY - size / 2);
    ctx.lineTo(centerX - size / 2, centerY + size / 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#E62B1E';
    ctx.stroke();

    // Add small black outline
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.globalAlpha = 0.3;
    ctx.stroke();

    ctx.restore();
}

/**
 * Draw obstacle with letter styling (color adapts to dark mode)
 */
function drawObstacle(obstacle) {
    ctx.save();
    
    // Add floating animation for flying obstacles
    let yOffset = 0;
    if (obstacle.flying) {
        // Create floating effect
        yOffset = Math.sin(gameState.frameCount * 0.1 + obstacle.x * 0.01) * 5;
    }
    
    // Determine color based on dark mode
    const isDarkMode = document.body.classList.contains('dark-mode');
    let color;
    
    if (obstacle.colorType === 'red') {
        color = '#FF3B2F'; // Brighter red for better visibility
    } else { // contrast color
        color = isDarkMode ? '#FFFFFF' : '#000000'; // White in dark mode, black in light mode
    }
    
    // Draw the letter
    ctx.fillStyle = color;
    ctx.font = `bold ${obstacle.height}px Montserrat, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Add shadow for flying obstacles
    if (obstacle.flying) {
        ctx.shadowColor = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
    }
    
    // Draw letter at obstacle position with offset
    ctx.fillText(obstacle.letter, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height + yOffset);
    
    ctx.restore();
}

/**
 * Draw particle
 */
function drawParticle(particle) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.life / 50;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

/**
 * Get current score
 */
export function getScore() {
    return gameState.score;
}

/**
 * Get high score
 */
export function getHighScore() {
    return gameState.highScore;
}

/**
 * Check if game is running
 */
export function isGameRunning() {
    return gameState.isRunning;
}

/**
 * Check if game is paused
 */
export function isGamePaused() {
    return gameState.isPaused;
}
