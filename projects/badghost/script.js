const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');
const gameContainer = document.querySelector('.game-container'); // To toggle classes

// --- Game Constants ---
const GHOST_WIDTH = 64; // Match the sprite frame width
const GHOST_HEIGHT = 64; // Match the sprite frame height
const GRAVITY = 0.15; // Reduced gravity for a floating effect
const FLAP_STRENGTH = -3; // Weaker flap strength to match reduced gravity
const WALL_WIDTH = 50;
const GAP_HEIGHT = 100; // Space between walls

function getWallSpeed() {
    return 2 + Math.floor(score / 10);
}

const SPAWN_INTERVAL = 60; // Frames between wall spawns (approx 2 seconds at 60fps)

// --- Colors ---
const COLOR_PRIMARY = '#C0F8FF';  // Light cyan outline color from sprite
const COLOR_ACCENT = '#202020';  // Darker gray for spikes and particles

// --- Canvas Size ---
// Set canvas size here for pixel art clarity
canvas.width = 320;
canvas.height = 480;

// --- Game State ---
let ghost;
let obstacles;
let frameCount;
let score;
let gameActive;
let animationFrameId; // To stop the loop
let backgroundX = 0; // New variable for background position
let difficultyMultiplier = 1; // New variable to track difficulty
let ghostFrame = 0; // Track animation frame
let ghostAnimationTicker = 0; // Ticker for ghost animation
const ghostAnimationSpeed = 10; // Speed of ghost animation (frames per update)

// --- Ghost Animation Variables ---
let ghostFrameIndex = 0; // Current frame index
const ghostFrameCount = 4; // Total number of frames in the sprite sheet
const ghostFrameWidth = 400; // Width of each frame (based on the sprite sheet)
const ghostFrameHeight = 400; // Height of each frame (based on the sprite sheet)
const ghostSprite = new Image();
ghostSprite.src = './assets/ghost-sprite.png'; // Path to the provided sprite sheet

// Add event handlers to log sprite loading status
ghostSprite.onload = () => {
    console.log('Ghost sprite loaded successfully.');
};
ghostSprite.onerror = () => {
    console.error('Failed to load ghost sprite. Check the file path.');
};

// --- Particle System ---
let particles = [];

function spawnParticles(x, y) {
    for (let i = 0; i < 3; i++) {
        particles.push({
            x: x + GHOST_WIDTH / 2 + (Math.random() * 10 - 5),
            y: y + GHOST_HEIGHT,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * -1,
            alpha: 1,
            size: 2
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.alpha -= 0.02;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = COLOR_PRIMARY;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

// --- Helper Functions ---
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h)); // Use Math.floor for pixel precision
}

function drawSpikes(x, y, width, height) {
    const spikeCount = Math.floor(width / 10);
    const spikeWidth = width / spikeCount;
    ctx.fillStyle = COLOR_ACCENT;
    for (let i = 0; i < spikeCount; i++) {
        const spikeX = x + i * spikeWidth;
        ctx.beginPath();
        ctx.moveTo(spikeX, y + height);
        ctx.lineTo(spikeX + spikeWidth / 2, y);
        ctx.lineTo(spikeX + spikeWidth, y + height);
        ctx.closePath();
        ctx.fill();
    }
}

function drawGhost(x, y, width, height) {
    console.log('Drawing ghost at:', x, y, width, height);
    if (ghostSprite.complete) {
        const ghostSpriteCols = 2; // Number of columns in the sprite sheet
        const sx = (ghostFrameIndex % ghostSpriteCols) * ghostFrameWidth;
        const sy = Math.floor(ghostFrameIndex / ghostSpriteCols) * ghostFrameHeight;
        ctx.drawImage(
            ghostSprite,
            sx, sy, ghostFrameWidth, ghostFrameHeight, // Source rectangle
            x, y, width, height // Destination rectangle
        );
    } else {
        console.log('Sprite not loaded, drawing fallback.');

        // Draw the rectangular base of the doorway
        ctx.fillStyle = COLOR_PRIMARY;
        ctx.fillRect(x, y + height / 2, width, height / 2);

        // Draw the arch on top of the rectangle
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2, Math.PI, 0, false);
        ctx.fill();
    }
}

function resetGame() {
    resizeCanvas(); // Ensure canvas is resized before resetting
    ghost = {
        x: canvas.width / 2 - GHOST_WIDTH / 2, // Center horizontally
        y: canvas.height / 2, // Center vertically
        width: GHOST_WIDTH,
        height: GHOST_HEIGHT,
        velocity: 0
    };
    obstacles = [];
    frameCount = 0;
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    messageDisplay.textContent = ''; // Clear message initially
    gameContainer.classList.remove('game-over');
    gameContainer.classList.add('game-active');
    gameActive = true;

    // Cancel previous loop if any, then start new one
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameLoop();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Adjust ghost position and obstacle positions only if the game is active
    if (gameActive) {
        if (ghost) {
            ghost.y = Math.min(ghost.y, canvas.height - ghost.height);
        }
        obstacles.forEach(obs => {
            obs.x = Math.min(obs.x, canvas.width);
        });
    }
}

function spawnObstacle() {
    const segmentWidth = 80;
    const gapChance = Math.random() < 0.2; // 20% chance of a gap at first

    if (!gapChance) {
        obstacles.push({
            x: canvas.width,
            y: canvas.height / 2 + GHOST_HEIGHT / 2,
            width: segmentWidth,
            height: 20,
            passed: false
        });
    }
}

function updateGame() {
    if (!gameActive) return;

    ghostAnimationTicker++;
    if (ghostAnimationTicker % ghostAnimationSpeed === 0) {
        ghostFrameIndex = (ghostFrameIndex + 1) % ghostFrameCount;
    }

    frameCount++;
    if (frameCount % SPAWN_INTERVAL === 0) {
        spawnObstacle();
    }

    let onGround = false;

    for (const obs of obstacles) {
        if (
            ghost.x + ghost.width > obs.x &&
            ghost.x < obs.x + obs.width &&
            ghost.y + ghost.height >= obs.y
        ) {
            onGround = true;
            ghost.y = obs.y - ghost.height;
            break;
        }
    }

    if (!onGround) {
        ghost.velocity += GRAVITY;
        ghost.y += ghost.velocity;
    } else {
        if (ghost.velocity > 2) {
            ghost.velocity = -ghost.velocity * 0.85; // Bounce with damping
        } else {
            ghost.velocity = 0; // Settle when low enough
        }
    }

    if (ghost.y > canvas.height) {
        endGame();
    }

    // Check Collisions
    for (const obs of obstacles) {
        if (
            ghost.x < obs.x + obs.width &&
            ghost.x + ghost.width > obs.x &&
            ghost.y < obs.y + obs.height &&
            ghost.y + ghost.height > obs.y
        ) {
            endGame();
        }
    }
}

function endGame() {
    gameActive = false;
    gameContainer.classList.remove('game-active');
    gameContainer.classList.add('game-over');
    messageDisplay.textContent = `Game Over! Score: ${score}. Click or Space to Restart`;
    cancelAnimationFrame(animationFrameId); // Stop the loop
}

function drawGame() {
    console.log('Drawing game frame...');
    ctx.fillStyle = '#fafafa';  // softer off-white background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGhost(ghost.x, ghost.y, ghost.width, ghost.height);
    for (const obs of obstacles) {
        drawSpikes(obs.x, obs.y, obs.width, obs.height); // Changed to draw spikes
    }
    updateParticles();
    drawParticles();
}

function gameLoop() {
    if (gameActive) {
        updateGame();
        drawGame();
        animationFrameId = requestAnimationFrame(gameLoop); // Continue loop
    }
}

// --- Input Handling ---
// Ensure the game starts properly on the first interaction
function handleInput() {
    if (!gameActive) {
        resetGame(); // Start/Restart game
    } else {
        if (ghost.velocity >= 0 || ghost.y + ghost.height >= canvas.height / 2 + GHOST_HEIGHT / 2 - 2) {
            ghost.velocity = FLAP_STRENGTH; // Apply flap strength
            spawnParticles(ghost.x, ghost.y); // Spawn particles
        }
    }
}

// Ensure event listeners are properly set up
window.addEventListener('click', handleInput);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        handleInput();
    }
});
window.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent potential zooming/scrolling on touch devices
    handleInput();
}, { passive: false });

// Add event listener for window resize
window.addEventListener('resize', resizeCanvas);

// Fix the initial setup to ensure the game starts on the first input
function initializeGame() {
    gameContainer.classList.remove('game-active');
    gameContainer.classList.remove('game-over');
    messageDisplay.textContent = 'Click or Press Space to Start';
    gameActive = false; // Ensure the game is inactive initially
    obstacles = []; // Reset obstacles
    ghost = {
        x: canvas.width / 2 - GHOST_WIDTH / 2, // Center horizontally
        y: canvas.height / 2, // Center vertically
        width: GHOST_WIDTH,
        height: GHOST_HEIGHT,
        velocity: 0
    }; // Initialize ghost object
    score = 0; // Reset score
    scoreDisplay.textContent = `Score: ${score}`; // Reset score display

    // Ensure canvas is resized only once during initialization
    if (!canvas.width || !canvas.height) {
        resizeCanvas();
    }
}

// Call initializeGame to set up the initial state
initializeGame();

// Debugging: Log when the script is loaded
console.log('Script loaded and initialized.');