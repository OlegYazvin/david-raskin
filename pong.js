(() => {
  'use strict';

  const canvas = document.querySelector('#pong-canvas');
  const court = document.querySelector('#pong-court');
  if (!canvas || !court) return;
  const ctx = canvas.getContext('2d');
  const startButton = document.querySelector('#start-game');
  const resetButton = document.querySelector('#reset-game');
  const status = document.querySelector('#game-status');
  const playerScore = document.querySelector('#player-score');
  const cpuScore = document.querySelector('#cpu-score');
  const overlay = document.querySelector('#game-overlay');
  const overlayTitle = document.querySelector('#overlay-title');
  const overlayDescription = document.querySelector('#overlay-description');

  if (!ctx) {
    court.dataset.state = 'unavailable';
    startButton.disabled = true;
    resetButton.disabled = true;
    overlayTitle.textContent = 'PONG IS SITTING THIS ONE OUT.';
    overlayDescription.textContent = "This browser can't run the game. The Davids still work.";
    if (status) status.textContent = 'Pong is unavailable because this browser does not support canvas.';
    return;
  }

  const W = 960;
  let H = 520;
  const PADDLE_W = 12;
  let PADDLE_H = 104;
  const RADIUS = 8;
  const PLAYER_X = 40;
  const CPU_X = W - 40 - PADDLE_W;
  const WINNING_SCORE = 7;
  const keys = new Set();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  let state = 'ready';
  let playerY = (H - PADDLE_H) / 2;
  let cpuY = playerY;
  let score = [0, 0];
  let ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  let serveDelay = 0;
  let cpuError = 0;
  let lastFrame = 0;
  let frame = null;

  function announce(message) {
    if (status) status.textContent = message;
  }

  function showState(next, title, description) {
    state = next;
    court.dataset.state = next;
    court.style.touchAction = next === 'playing' ? 'none' : 'pan-y';
    overlay.hidden = next === 'playing';
    if (title) overlayTitle.textContent = title;
    if (description) overlayDescription.textContent = description;
    startButton.textContent = next === 'playing' ? 'Pause game' : next === 'paused' ? 'Resume game' : next === 'gameover' ? 'Play again' : 'Play Pong';
    startButton.setAttribute('aria-pressed', String(next === 'playing'));
    keys.clear();
  }

  function draw() {
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.fillStyle = '#f3f0e8';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#d2cec4';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, H - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#191919';
    ctx.fillRect(PLAYER_X, playerY, PADDLE_W, PADDLE_H);
    ctx.fillRect(CPU_X, cpuY, PADDLE_W, PADDLE_H);
    ctx.fillStyle = '#f56a47';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const width = bounds.width || W;
    const height = bounds.height || width * H / W;
    // Follow the actual CSS court shape so mobile paddles and balls stay undistorted.
    const nextHeight = W * height / width;
    const heightScale = nextHeight / H;
    playerY *= heightScale;
    cpuY *= heightScale;
    ball.y = clamp(ball.y * heightScale, RADIUS, nextHeight - RADIUS);
    ball.vy *= heightScale;
    cpuError *= heightScale;
    H = nextHeight;
    PADDLE_H = H / 5;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    draw();
  }

  function serve(direction) {
    const angle = (Math.random() - 0.5) * 0.9;
    ball = { x: W / 2, y: H / 2, vx: direction * Math.cos(angle) * 390, vy: Math.sin(angle) * 390 };
    serveDelay = 0.65;
    cpuError = (Math.random() - 0.5) * 72;
  }

  function cancelFrame() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastFrame = 0;
  }

  function reset() {
    cancelFrame();
    score = [0, 0];
    playerScore.textContent = '0';
    cpuScore.textContent = '0';
    playerY = cpuY = (H - PADDLE_H) / 2;
    ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
    showState('ready', 'READY WHEN YOU ARE', 'A website. Four photos. One chance at glory.');
    announce('Ready. First to 7 wins. Use W and S, the arrow keys, or move your pointer over the court.');
    draw();
  }

  function pause() {
    if (state !== 'playing') return;
    cancelFrame();
    showState('paused', 'TAKING A BREATHER?', 'Your moment of glory can wait.');
    announce('Game paused. Select Resume game or press Space while the court is focused.');
    draw();
  }

  function start() {
    if (state === 'playing') {
      pause();
      return;
    }
    if (state === 'gameover') reset();
    if (state === 'ready') serve(Math.random() < 0.5 ? -1 : 1);
    showState('playing');
    court.focus({ preventScroll: true });
    announce('Game on. First to 7 wins. Press Space to pause.');
    lastFrame = 0;
    frame = requestAnimationFrame(tick);
  }

  function point(winner) {
    score[winner] += 1;
    playerScore.textContent = String(score[0]);
    cpuScore.textContent = String(score[1]);
    if (score[winner] === WINNING_SCORE) {
      cancelFrame();
      showState('gameover', winner === 0 ? 'A VERY IMPORTANT VICTORY.' : 'THE COMPUTER GOT YOU.', winner === 0 ? 'You beat the website. David would be proud. Probably.' : 'Fortunately, this is not legally binding. Try again.');
      announce(`${winner === 0 ? 'You win' : 'Computer wins'}, ${score[0]} to ${score[1]}. Select Play again for a rematch.`);
      ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
      return;
    }
    announce(`${winner === 0 ? 'Point to you' : 'Point to computer'}. You ${score[0]}, computer ${score[1]}.`);
    serve(winner === 0 ? 1 : -1);
  }

  function bounce(paddleY, direction) {
    const hit = clamp((ball.y - (paddleY + PADDLE_H / 2)) / (PADDLE_H / 2), -1, 1);
    const speed = Math.min(Math.hypot(ball.vx, ball.vy) + 28, 760);
    const angle = hit * Math.PI / 3;
    ball.vx = direction * Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
    cpuError = (Math.random() - 0.5) * 72;
  }

  function update(dt) {
    const up = keys.has('ArrowUp') || keys.has('w');
    const down = keys.has('ArrowDown') || keys.has('s');
    const verticalScale = H / 520;
    playerY = clamp(playerY + (Number(down) - Number(up)) * 580 * verticalScale * dt, 10, H - PADDLE_H - 10);

    const target = ball.vx > 0 ? ball.y + cpuError : H / 2;
    const difference = target - (cpuY + PADDLE_H / 2);
    cpuY = clamp(cpuY + clamp(difference, -285 * verticalScale * dt, 285 * verticalScale * dt), 10, H - PADDLE_H - 10);

    if (serveDelay > 0) {
      serveDelay -= dt;
      return;
    }

    const previousX = ball.x;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.y < RADIUS) {
      ball.y = 2 * RADIUS - ball.y;
      ball.vy = Math.abs(ball.vy);
    } else if (ball.y > H - RADIUS) {
      ball.y = 2 * (H - RADIUS) - ball.y;
      ball.vy = -Math.abs(ball.vy);
    }

    if (ball.vx < 0 && previousX - RADIUS >= PLAYER_X + PADDLE_W && ball.x - RADIUS <= PLAYER_X + PADDLE_W && ball.y + RADIUS >= playerY && ball.y - RADIUS <= playerY + PADDLE_H) {
      ball.x = PLAYER_X + PADDLE_W + RADIUS;
      bounce(playerY, 1);
    } else if (ball.vx > 0 && previousX + RADIUS <= CPU_X && ball.x + RADIUS >= CPU_X && ball.y + RADIUS >= cpuY && ball.y - RADIUS <= cpuY + PADDLE_H) {
      ball.x = CPU_X - RADIUS;
      bounce(cpuY, -1);
    }

    if (ball.x < -RADIUS) point(1);
    else if (ball.x > W + RADIUS) point(0);
  }

  function tick(time) {
    frame = null;
    if (state !== 'playing') return;
    const dt = lastFrame ? Math.min((time - lastFrame) / 1000, 0.025) : 0;
    lastFrame = time;
    update(dt);
    draw();
    if (state === 'playing') frame = requestAnimationFrame(tick);
  }

  function focused() {
    return court === document.activeElement || court.contains(document.activeElement);
  }

  window.addEventListener('keydown', (event) => {
    if (!focused()) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === ' ' && !event.repeat) {
      event.preventDefault();
      start();
    } else if (state === 'playing' && ['ArrowUp', 'ArrowDown', 'w', 's'].includes(key)) {
      event.preventDefault();
      keys.add(key);
    } else if (key === 'Escape') {
      pause();
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
  court.addEventListener('focusout', () => keys.clear());

  function movePointer(event) {
    if (state !== 'playing') return;
    const bounds = canvas.getBoundingClientRect();
    playerY = clamp((event.clientY - bounds.top) / bounds.height * H - PADDLE_H / 2, 10, H - PADDLE_H - 10);
  }
  court.addEventListener('pointermove', movePointer);
  court.addEventListener('pointerdown', (event) => {
    if (state !== 'playing') return;
    court.focus({ preventScroll: true });
    court.setPointerCapture(event.pointerId);
    movePointer(event);
  });
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  startButton.addEventListener('click', start);
  resetButton.addEventListener('click', reset);
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);

  reset();
  resize();
})();
