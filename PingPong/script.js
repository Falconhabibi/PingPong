// Game variables
const gameContainer = document.getElementById('gameContainer');
const ball = document.getElementById('ball');
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const score1Display = document.getElementById('score1');
const score2Display = document.getElementById('score2');
const gameOverScreen = document.getElementById('gameOver');
const introScreen = document.getElementById('introScreen');
const gameScreen = document.getElementById('gameScreen');
const difficultyDisplay = document.getElementById('difficultyDisplay');

let score1 = 0;
let score2 = 0;
let gameRunning = true;
let currentDifficulty = 'medium';

// Game constants - will be adjusted based on difficulty
const CONTAINER_WIDTH = 800;
const CONTAINER_HEIGHT = 400;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const WIN_SCORE = 5;

// Difficulty settings - EXTREME mode is now incredibly hard!
const difficultySettings = {
    easy: {
        paddleSpeed: 3.5,
        initialBallSpeed: 2.5,
        maxBallSpeed: 5,
        aiAccuracy: 0.45,
        aiResponseDelay: 100,
        ballSpeedIncrement: 0.15,
        aiPaddleHeight: 80,
        name: 'EASY'
    },
    medium: {
        paddleSpeed: 6,
        initialBallSpeed: 4,
        maxBallSpeed: 8,
        aiAccuracy: 0.75,
        aiResponseDelay: 20,
        ballSpeedIncrement: 0.25,
        aiPaddleHeight: 80,
        name: 'MEDIUM'
    },
    hard: {
        paddleSpeed: 8,
        initialBallSpeed: 5.5,
        maxBallSpeed: 12,
        aiAccuracy: 0.92,
        aiResponseDelay: 5,
        ballSpeedIncrement: 0.35,
        aiPaddleHeight: 80,
        name: 'HARD'
    },
    extreme: {
        paddleSpeed: 10,
        initialBallSpeed: 8,
        maxBallSpeed: 16,
        aiAccuracy: 0.99,
        aiResponseDelay: 0,
        ballSpeedIncrement: 0.5,
        aiPaddleHeight: 70,
        name: 'EXTREME'
    }
};

let gameSettings = difficultySettings.medium;

// Ball object
let ballObj = {
    x: CONTAINER_WIDTH / 2 - BALL_SIZE / 2,
    y: CONTAINER_HEIGHT / 2 - BALL_SIZE / 2,
    vx: gameSettings.initialBallSpeed,
    vy: gameSettings.initialBallSpeed,
    speed: gameSettings.initialBallSpeed
};

// Paddle objects
let paddle1Obj = {
    x: 10,
    y: CONTAINER_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: gameSettings.paddleSpeed
};

let paddle2Obj = {
    x: CONTAINER_WIDTH - PADDLE_WIDTH - 10,
    y: CONTAINER_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: gameSettings.paddleSpeed
};

// Input handling
let mouseY = CONTAINER_HEIGHT / 2;
let keys = {};

document.addEventListener('mousemove', (e) => {
    const rect = gameContainer.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Start game with selected difficulty
function startGame(difficulty) {
    currentDifficulty = difficulty;
    gameSettings = difficultySettings[difficulty];
    
    // Update UI
    introScreen.classList.remove('active');
    gameScreen.classList.add('active');
    difficultyDisplay.textContent = gameSettings.name;
    
    // Add extreme mode styling
    if (difficulty === 'extreme') {
        difficultyDisplay.classList.add('extreme-mode');
        ball.classList.add('extreme-mode');
    } else {
        difficultyDisplay.classList.remove('extreme-mode');
        ball.classList.remove('extreme-mode');
    }
    
    // Initialize game
    resetGame();
}

// Back to menu
function backToMenu() {
    gameRunning = false;
    gameScreen.classList.remove('active');
    introScreen.classList.add('active');
    score1 = 0;
    score2 = 0;
    gameOverScreen.style.display = 'none';
    difficultyDisplay.classList.remove('extreme-mode');
    ball.classList.remove('extreme-mode');
}

// Update paddle positions
function updatePaddles() {
    // Player paddle (left) - follows mouse or arrow keys
    let targetY = mouseY - PADDLE_HEIGHT / 2;

    if (keys['ArrowUp']) {
        targetY = Math.max(0, targetY - gameSettings.paddleSpeed);
    }
    if (keys['ArrowDown']) {
        targetY = Math.min(CONTAINER_HEIGHT - PADDLE_HEIGHT, targetY + gameSettings.paddleSpeed);
    }

    paddle1Obj.y = Math.max(0, Math.min(CONTAINER_HEIGHT - PADDLE_HEIGHT, targetY));

    // Computer paddle (right) - EXTREME AI for hard mode!
    let computerTargetY = ballObj.y - (gameSettings.aiPaddleHeight / 2);
    
    // On EXTREME mode: AI is nearly perfect
    if (currentDifficulty === 'extreme') {
        // AI has perfect prediction on extreme
        if (Math.random() > 0.01) {
            // 99% accuracy - only occasionally misses
            computerTargetY = ballObj.y - (gameSettings.aiPaddleHeight / 2);
        } else {
            // Rare mistake
            computerTargetY += (Math.random() - 0.5) * 30;
        }
    } else {
        // Standard AI accuracy for other difficulties
        if (Math.random() > gameSettings.aiAccuracy) {
            computerTargetY += (Math.random() - 0.5) * 100;
        }
    }

    // Add response delay for easier difficulty
    if (Math.random() > (gameSettings.aiResponseDelay / 100)) {
        // Move AI paddle
        const aiSpeed = currentDifficulty === 'extreme' ? gameSettings.paddleSpeed * 1.3 : gameSettings.paddleSpeed;
        
        if (computerTargetY < paddle2Obj.y) {
            paddle2Obj.y = Math.max(0, paddle2Obj.y - aiSpeed);
        } else if (computerTargetY > paddle2Obj.y) {
            paddle2Obj.y = Math.min(CONTAINER_HEIGHT - gameSettings.aiPaddleHeight, paddle2Obj.y + aiSpeed);
        }
    }

    // Ensure paddles stay within bounds
    paddle1Obj.y = Math.max(0, Math.min(CONTAINER_HEIGHT - PADDLE_HEIGHT, paddle1Obj.y));
    paddle2Obj.y = Math.max(0, Math.min(CONTAINER_HEIGHT - gameSettings.aiPaddleHeight, paddle2Obj.y));

    paddle1.style.top = paddle1Obj.y + 'px';
    paddle2.style.top = paddle2Obj.y + 'px';
    paddle2.style.height = gameSettings.aiPaddleHeight + 'px';
}

// Ball physics
function updateBall() {
    ballObj.x += ballObj.vx;
    ballObj.y += ballObj.vy;

    // Wall collision (top and bottom) - with acceleration on extreme
    if (ballObj.y <= 0 || ballObj.y + BALL_SIZE >= CONTAINER_HEIGHT) {
        ballObj.vy *= -1;
        ballObj.y = Math.max(0, Math.min(CONTAINER_HEIGHT - BALL_SIZE, ballObj.y));
        
        // On extreme mode, ball gets slightly faster on wall bounces
        if (currentDifficulty === 'extreme') {
            ballObj.speed = Math.min(ballObj.speed + 0.1, gameSettings.maxBallSpeed);
            ballObj.vx = (ballObj.vx > 0 ? 1 : -1) * ballObj.speed;
        }
    }

    // Paddle collision detection
    checkPaddleCollision(paddle1Obj, true);
    checkPaddleCollision(paddle2Obj, false);

    // Out of bounds - scoring
    if (ballObj.x < 0) {
        score2++;
        resetBall();
    } else if (ballObj.x > CONTAINER_WIDTH) {
        score1++;
        resetBall();
    }

    ball.style.left = ballObj.x + 'px';
    ball.style.top = ballObj.y + 'px';
}

// Paddle collision detection
function checkPaddleCollision(paddle, isPlayer) {
    const ballRight = ballObj.x + BALL_SIZE;
    const ballBottom = ballObj.y + BALL_SIZE;
    const paddleRight = paddle.x + paddle.width;
    const paddleBottom = paddle.y + paddle.height;

    // Check if ball overlaps with paddle
    if (ballObj.x < paddleRight &&
        ballRight > paddle.x &&
        ballObj.y < paddleBottom &&
        ballBottom > paddle.y) {

        // Reflect ball
        ballObj.vx *= -1;

        // Add spin based on where ball hits paddle
        const paddleCenter = paddle.y + paddle.height / 2;
        const ballCenter = ballObj.y + BALL_SIZE / 2;
        const distFromCenter = ballCenter - paddleCenter;
        
        // On EXTREME mode: increased spin effect
        const maxSpin = currentDifficulty === 'extreme' ? 5 : 3;
        ballObj.vy = (distFromCenter / (paddle.height / 2)) * maxSpin;

        // Increase ball speed based on difficulty
        ballObj.speed = Math.min(ballObj.speed + gameSettings.ballSpeedIncrement, gameSettings.maxBallSpeed);
        ballObj.vx = (ballObj.vx > 0 ? 1 : -1) * ballObj.speed;
        ballObj.vy = ballObj.vy * (ballObj.speed / gameSettings.initialBallSpeed);

        // Move ball outside paddle to prevent multiple collisions
        if (isPlayer) {
            ballObj.x = paddle.x + paddle.width;
        } else {
            ballObj.x = paddle.x - BALL_SIZE;
        }
    }
}

// Reset ball to center
function resetBall() {
    ballObj.x = CONTAINER_WIDTH / 2 - BALL_SIZE / 2;
    ballObj.y = CONTAINER_HEIGHT / 2 - BALL_SIZE / 2;
    ballObj.speed = gameSettings.initialBallSpeed;
    ballObj.vx = (Math.random() > 0.5 ? 1 : -1) * ballObj.speed;
    ballObj.vy = (Math.random() - 0.5) * 5;

    // Check for winner
    if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) {
        endGame();
    }
}

// End game
function endGame() {
    gameRunning = false;
    const winner = score1 > score2 ? 'You WIN! 🎉' : 'Computer WINS! 🤖';
    
    let winMessage = `Player ${score1} - Computer ${score2}\n\nDifficulty: ${gameSettings.name}`;
    
    if (currentDifficulty === 'extreme' && score1 > score2) {
        winMessage += '\n\n🌟 INCREDIBLE! You defeated EXTREME mode! 🌟';
    } else if (currentDifficulty === 'extreme') {
        winMessage += '\n\n💀 The AI reigns supreme on EXTREME mode!';
    }
    
    document.getElementById('gameOverTitle').textContent = winner;
    document.getElementById('gameOverMessage').textContent = winMessage;
    gameOverScreen.style.display = 'block';
}

// Reset game
function resetGame() {
    score1 = 0;
    score2 = 0;
    gameRunning = true;
    gameOverScreen.style.display = 'none';
    
    // Reset paddles with current difficulty speed
    paddle1Obj.speed = gameSettings.paddleSpeed;
    paddle2Obj.speed = gameSettings.paddleSpeed;
    paddle2Obj.height = gameSettings.aiPaddleHeight;
    
    ballObj = {
        x: CONTAINER_WIDTH / 2 - BALL_SIZE / 2,
        y: CONTAINER_HEIGHT / 2 - BALL_SIZE / 2,
        vx: gameSettings.initialBallSpeed,
        vy: gameSettings.initialBallSpeed,
        speed: gameSettings.initialBallSpeed
    };

    paddle1Obj.y = CONTAINER_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    paddle2Obj.y = CONTAINER_HEIGHT / 2 - gameSettings.aiPaddleHeight / 2;

    score1Display.textContent = '0';
    score2Display.textContent = '0';

    gameLoop();
}

// Update scoreboard
function updateScore() {
    score1Display.textContent = score1;
    score2Display.textContent = score2;
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;

    updatePaddles();
    updateBall();
    updateScore();

    requestAnimationFrame(gameLoop);
}