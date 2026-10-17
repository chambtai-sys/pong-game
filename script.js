// Classic Neon Pong Game Logic

const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const difficultySelect = document.getElementById('difficulty');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const soundBtn = document.getElementById('soundBtn');
const gameOverlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySub = document.getElementById('overlaySub');
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');

// Game state variables
const WINNING_SCORE = 7;
let gameRunning = false;
let gamePaused = false;
let soundEnabled = true;
let animationFrameId = null;

// Sound Synthesizer using Web Audio API
class SoundEffects {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq, type, duration) {
    if (!soundEnabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio play error fallback
    }
  }

  paddleHit() {
    this.playTone(440, 'sine', 0.1);
  }

  wallHit() {
    this.playTone(220, 'square', 0.08);
  }

  scorePoint() {
    this.playTone(587.33, 'triangle', 0.25);
  }

  gameOverWin() {
    this.playTone(523.25, 'sine', 0.15);
    setTimeout(() => this.playTone(659.25, 'sine', 0.15), 150);
    setTimeout(() => this.playTone(783.99, 'sine', 0.3), 300);
  }

  gameOverLose() {
    this.playTone(300, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.3), 200);
  }
}

const sounds = new SoundEffects();

// Game Entities
const paddleWidth = 14;
const paddleHeight = 85;

const player = {
  x: 20,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: '#00f0ff',
  score: 0,
  speed: 7,
  dy: 0
};

const ai = {
  x: canvas.width - 20 - paddleWidth,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: '#ff007f',
  score: 0,
  speed: 5
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 8,
  speed: 6,
  dx: 6,
  dy: 0,
  color: '#ffffff',
  maxSpeed: 14
};

// Controls tracking
const keys = {
  w: false,
  s: false,
  ArrowUp: false,
  ArrowDown: false
};

let touchUpPressed = false;
let touchDownPressed = false;

// AI Difficulty Profiles
const DIFFICULTY_CONFIG = {
  easy: { speed: 4.2, errorMargin: 35, reactionDelay: 0.15 },
  medium: { speed: 5.8, errorMargin: 18, reactionDelay: 0.08 },
  hard: { speed: 7.5, errorMargin: 4, reactionDelay: 0.02 }
};

// Setup Event Listeners
function setupEventListeners() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'KeyW' || e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 'KeyS' || e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;

    if (e.code === 'Space') {
      e.preventDefault();
      togglePause();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'KeyW' || e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 'KeyS' || e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
  });

  // Mobile Touch Canvas Controls (Drag to move paddle directly)
  function handleTouchMove(e) {
    sounds.init();
    const rect = canvas.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    const scaleY = canvas.height / rect.height;
    const canvasY = touchY * scaleY;
    player.y = Math.max(0, Math.min(canvas.height - player.height, canvasY - player.height / 2));
  }

  canvas.addEventListener('touchstart', (e) => {
    handleTouchMove(e);
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    handleTouchMove(e);
  }, { passive: true });

  // Touch Buttons Controls
  btnUp.addEventListener('touchstart', (e) => {
    e.preventDefault();
    sounds.init();
    touchUpPressed = true;
  });
  btnUp.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchUpPressed = false;
  });
  btnDown.addEventListener('touchstart', (e) => {
    e.preventDefault();
    sounds.init();
    touchDownPressed = true;
  });
  btnDown.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchDownPressed = false;
  });

  // Mouse fallback for mobile touch buttons testing
  btnUp.addEventListener('mousedown', () => { touchUpPressed = true; });
  btnUp.addEventListener('mouseup', () => { touchUpPressed = false; });
  btnUp.addEventListener('mouseleave', () => { touchUpPressed = false; });
  btnDown.addEventListener('mousedown', () => { touchDownPressed = true; });
  btnDown.addEventListener('mouseup', () => { touchDownPressed = false; });
  btnDown.addEventListener('mouseleave', () => { touchDownPressed = false; });

  // UI Controls
  startBtn.addEventListener('click', () => {
    sounds.init();
    if (!gameRunning) {
      startGame();
    } else {
      togglePause();
    }
  });

  resetBtn.addEventListener('click', () => {
    sounds.init();
    resetGame();
  });

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊 Sound' : '🔇 Muted';
  });

  gameOverlay.addEventListener('click', () => {
    sounds.init();
    if (!gameRunning) {
      startGame();
    } else if (gamePaused) {
      togglePause();
    }
  });
}

// Game Functions
function resetBall(direction = 1) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speed = 6;
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // -30 to 30 deg
  ball.dx = direction * ball.speed * Math.cos(angle);
  ball.dy = ball.speed * Math.sin(angle);
}

function updatePlayer() {
  if (keys.w || keys.ArrowUp || touchUpPressed) {
    player.y -= player.speed;
  }
  if (keys.s || keys.ArrowDown || touchDownPressed) {
    player.y += player.speed;
  }
  // Keep player inside canvas
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function updateAI() {
  const config = DIFFICULTY_CONFIG[difficultySelect.value] || DIFFICULTY_CONFIG.medium;
  const aiCenter = ai.y + ai.height / 2;
  let targetY = ball.y;

  // Add slight prediction/error offset when ball moves away or towards AI
  if (ball.dx < 0) {
    targetY = canvas.height / 2; // Return towards center when ball is away
  } else {
    // Add difficulty-based tracking error
    targetY += (Math.sin(Date.now() / 200) * config.errorMargin);
  }

  const dy = targetY - aiCenter;
  if (Math.abs(dy) > 10) {
    if (dy > 0) {
      ai.y += Math.min(config.speed, dy);
    } else {
      ai.y -= Math.min(config.speed, -dy);
    }
  }

  // Keep AI inside canvas
  ai.y = Math.max(0, Math.min(canvas.height - ai.height, ai.y));
}

function updateBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collisions (Top & Bottom)
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.dy *= -1;
    sounds.wallHit();
  } else if (ball.y + ball.radius >= canvas.height) {
    ball.y = canvas.height - ball.radius;
    ball.dy *= -1;
    sounds.wallHit();
  }

  // Player Paddle Collision
  if (ball.x - ball.radius <= player.x + player.width &&
      ball.x + ball.radius >= player.x &&
      ball.y >= player.y && ball.y <= player.y + player.height) {

    if (ball.dx < 0) {
      sounds.paddleHit();
      ball.x = player.x + player.width + ball.radius;

      // Calculate hit angle relative to center of paddle
      const collidePoint = ball.y - (player.y + player.height / 2);
      const normalizedCollide = collidePoint / (player.height / 2);
      const hitAngle = normalizedCollide * (Math.PI / 3); // Max 60 deg

      ball.speed = Math.min(ball.maxSpeed, ball.speed + 0.4);
      ball.dx = ball.speed * Math.cos(hitAngle);
      ball.dy = ball.speed * Math.sin(hitAngle);
    }
  }

  // AI Paddle Collision
  if (ball.x + ball.radius >= ai.x &&
      ball.x - ball.radius <= ai.x + ai.width &&
      ball.y >= ai.y && ball.y <= ai.y + ai.height) {

    if (ball.dx > 0) {
      sounds.paddleHit();
      ball.x = ai.x - ball.radius;

      const collidePoint = ball.y - (ai.y + ai.height / 2);
      const normalizedCollide = collidePoint / (ai.height / 2);
      const hitAngle = normalizedCollide * (Math.PI / 3);

      ball.speed = Math.min(ball.maxSpeed, ball.speed + 0.4);
      ball.dx = -ball.speed * Math.cos(hitAngle);
      ball.dy = ball.speed * Math.sin(hitAngle);
    }
  }

  // Scoring
  if (ball.x + ball.radius < 0) {
    // AI Scores
    ai.score++;
    aiScoreEl.textContent = ai.score;
    sounds.scorePoint();
    checkGameOver() || resetBall(1);
  } else if (ball.x - ball.radius > canvas.width) {
    // Player Scores
    player.score++;
    playerScoreEl.textContent = player.score;
    sounds.scorePoint();
    checkGameOver() || resetBall(-1);
  }
}

function checkGameOver() {
  if (player.score >= WINNING_SCORE || ai.score >= WINNING_SCORE) {
    gameRunning = false;
    const playerWon = player.score >= WINNING_SCORE;
    overlayTitle.textContent = playerWon ? 'YOU WIN! 🎉' : 'GAME OVER 🤖';
    overlaySub.textContent = `Final Score: ${player.score} - ${ai.score}. Click to Play Again`;
    gameOverlay.classList.remove('hidden');
    startBtn.textContent = 'Play Again';

    if (playerWon) {
      sounds.gameOverWin();
    } else {
      sounds.gameOverLose();
    }
    return true;
  }
  return false;
}

function drawNet() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(p, glowColor) {
  ctx.fillStyle = p.color;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.width, p.height, 6);
  ctx.fill();
  ctx.shadowBlur = 0; // Reset
}

function drawBall() {
  ctx.fillStyle = ball.color;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function render() {
  // Clear canvas
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawNet();
  drawPaddle(player, '#00f0ff');
  drawPaddle(ai, '#ff007f');
  drawBall();
}

function gameLoop() {
  if (gameRunning && !gamePaused) {
    updatePlayer();
    updateAI();
    updateBall();
  }
  render();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
  if (!gameRunning) {
    if (player.score >= WINNING_SCORE || ai.score >= WINNING_SCORE) {
      resetGame();
    }
    gameRunning = true;
    gamePaused = false;
    gameOverlay.classList.add('hidden');
    startBtn.textContent = 'Pause';
    resetBall(Math.random() > 0.5 ? 1 : -1);
  }
}

function togglePause() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  if (gamePaused) {
    overlayTitle.textContent = 'PAUSED';
    overlaySub.textContent = 'Press Space or Click to Resume';
    gameOverlay.classList.remove('hidden');
    startBtn.textContent = 'Resume';
  } else {
    gameOverlay.classList.add('hidden');
    startBtn.textContent = 'Pause';
  }
}

function resetGame() {
  gameRunning = false;
  gamePaused = false;
  player.score = 0;
  ai.score = 0;
  playerScoreEl.textContent = '0';
  aiScoreEl.textContent = '0';
  player.y = canvas.height / 2 - paddleHeight / 2;
  ai.y = canvas.height / 2 - paddleHeight / 2;
  resetBall();
  overlayTitle.textContent = 'NEON PONG';
  overlaySub.textContent = 'Press Start or spacebar to play';
  gameOverlay.classList.remove('hidden');
  startBtn.textContent = 'Start Game';
}

// Initialize setup and first render
setupEventListeners();
render();
animationFrameId = requestAnimationFrame(gameLoop);
