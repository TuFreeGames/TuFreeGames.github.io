'use strict';

const config = {
  hp: 3,
  invulnSec: 0.35,
  telegraphSec: 0.35,
  boltFlashSec: 0.18,
  powerRate: 95,
  maxPower: 100,
  playerRadius: 18,
  playerSpeedLerp: 0.22,
  baseBolts: 2,
  extraBoltsByPower: 4,
  waveDelayBaseMs: 140,
  waveDelayJitterMs: 210,
  moveBoundPadding: 24,
  scorePerSecond: 1,
  waveScoreBase: 10
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hpEl = document.getElementById('hp');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const powerWrap = document.getElementById('powerWrap');
const powerFill = document.getElementById('powerFill');
const overlay = document.getElementById('overlay');
const startPanel = document.getElementById('startPanel');
const gameOverPanel = document.getElementById('gameOverPanel');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreEl = document.getElementById('finalScore');
const finalTimeEl = document.getElementById('finalTime');
const finalBestEl = document.getElementById('finalBest');

let state = 'start';
let w = 0;
let h = 0;
let groundY = 0;
let nowSec = 0;
let lastTs = 0;
let timeAcc = 0;
let secondTick = 0;

const player = {
  x: 0,
  y: 0,
  targetX: 0,
  radius: config.playerRadius,
  invulnTimer: 0
};

const game = {
  hp: config.hp,
  score: 0,
  timeSec: 0,
  best: 0,
  power: 0,
  charging: false,
  pointerActive: false,
  bolts: [],
  pendingTimers: []
};

function safeLoadBest() {
  try {
    const raw = localStorage.getItem('oneKeyTribulationBest');
    return raw ? Number(raw) || 0 : 0;
  } catch (_err) {
    return 0;
  }
}

function safeSaveBest(value) {
  try {
    localStorage.setItem('oneKeyTribulationBest', String(value));
  } catch (_err) {
    // ignore storage write issues
  }
}

function resize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  groundY = h * 0.82;
  player.y = groundY - player.radius;
  player.x = clamp(player.x || w * 0.5, minX(), maxX());
  player.targetX = clamp(player.targetX || player.x, minX(), maxX());
}

function minX() {
  return config.moveBoundPadding + player.radius;
}

function maxX() {
  return w - config.moveBoundPadding - player.radius;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resetRound() {
  clearAllTimers();
  game.hp = config.hp;
  game.score = 0;
  game.timeSec = 0;
  game.power = 0;
  game.charging = false;
  game.pointerActive = false;
  game.bolts = [];

  player.invulnTimer = 0;
  player.x = w * 0.5;
  player.targetX = player.x;

  secondTick = 0;
  timeAcc = 0;
  updateHud();
  powerWrap.hidden = true;
  setPower(0);
}

function startGame() {
  resetRound();
  state = 'playing';
  overlay.style.display = 'none';
  gameOverPanel.hidden = true;
  startPanel.hidden = true;
}

function endGame() {
  state = 'gameover';
  clearAllTimers();
  game.charging = false;
  game.pointerActive = false;
  powerWrap.hidden = true;

  if (game.score > game.best) {
    game.best = game.score;
    safeSaveBest(game.best);
  }

  finalScoreEl.textContent = String(game.score);
  finalTimeEl.textContent = game.timeSec.toFixed(1);
  finalBestEl.textContent = String(game.best);

  overlay.style.display = 'grid';
  startPanel.hidden = true;
  gameOverPanel.hidden = false;
}

function updateHud() {
  hpEl.textContent = '❤️'.repeat(game.hp) + '🖤'.repeat(Math.max(0, config.hp - game.hp));
  scoreEl.textContent = String(game.score);
  timeEl.textContent = game.timeSec.toFixed(1);
  bestEl.textContent = String(game.best);
}

function setPower(v) {
  game.power = clamp(v, 0, config.maxPower);
  powerFill.style.width = `${game.power}%`;
}

function schedule(fn, ms) {
  const id = window.setTimeout(() => {
    game.pendingTimers = game.pendingTimers.filter((tid) => tid !== id);
    fn();
  }, ms);
  game.pendingTimers.push(id);
}

function clearAllTimers() {
  for (const tid of game.pendingTimers) {
    clearTimeout(tid);
  }
  game.pendingTimers = [];
}

function spawnWave(power) {
  const boltCount =
    config.baseBolts + Math.round((config.extraBoltsByPower * power) / config.maxPower);
  const reward = Math.round(config.waveScoreBase * (1 + power / config.maxPower));

  for (let i = 0; i < boltCount; i += 1) {
    const delay = config.waveDelayBaseMs * i + Math.random() * config.waveDelayJitterMs;
    const x = clamp(Math.random() * w, minX(), maxX());

    schedule(() => {
      if (state !== 'playing') {
        return;
      }

      const bolt = {
        x,
        phase: 'telegraph',
        timer: config.telegraphSec
      };
      game.bolts.push(bolt);

      schedule(() => {
        if (state !== 'playing') {
          return;
        }
        bolt.phase = 'strike';
        bolt.timer = config.boltFlashSec;
        maybeDamagePlayer(bolt.x);
      }, config.telegraphSec * 1000);
    }, delay);
  }

  game.score += reward;
  updateHud();
}

function maybeDamagePlayer(boltX) {
  if (player.invulnTimer > 0 || state !== 'playing') {
    return;
  }

  const dx = Math.abs(player.x - boltX);
  const hitRange = player.radius + 14;
  if (dx <= hitRange) {
    game.hp -= 1;
    player.invulnTimer = config.invulnSec;
    updateHud();
    if (game.hp <= 0) {
      endGame();
    }
  }
}

function onPointerDown(ev) {
  if (state !== 'playing') {
    return;
  }
  ev.preventDefault();
  game.pointerActive = true;
  game.charging = true;
  powerWrap.hidden = false;
  movePlayer(ev.clientX);
}

function onPointerMove(ev) {
  if (state !== 'playing') {
    return;
  }
  if (!game.pointerActive) {
    return;
  }
  ev.preventDefault();
  movePlayer(ev.clientX);
}

function onPointerUp(ev) {
  if (state !== 'playing' || !game.pointerActive) {
    return;
  }
  ev.preventDefault();
  game.pointerActive = false;
  game.charging = false;
  powerWrap.hidden = true;

  const usedPower = game.power;
  setPower(0);
  spawnWave(usedPower);
}

function movePlayer(pointerX) {
  player.targetX = clamp(pointerX, minX(), maxX());
}

function update(dt) {
  if (state !== 'playing') {
    return;
  }

  if (game.charging) {
    setPower(game.power + config.powerRate * dt);
  }

  player.x += (player.targetX - player.x) * config.playerSpeedLerp;

  if (player.invulnTimer > 0) {
    player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  }

  timeAcc += dt;
  game.timeSec += dt;

  secondTick += dt;
  if (secondTick >= 1) {
    secondTick -= 1;
    game.score += config.scorePerSecond;
  }

  for (let i = game.bolts.length - 1; i >= 0; i -= 1) {
    const bolt = game.bolts[i];
    bolt.timer -= dt;
    if (bolt.timer <= 0) {
      game.bolts.splice(i, 1);
    }
  }

  updateHud();
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#071237');
  grad.addColorStop(1, '#02040d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(173, 202, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();
}

function drawPlayer() {
  ctx.save();
  const blinking = player.invulnTimer > 0 && Math.floor(nowSec * 22) % 2 === 0;
  if (blinking) {
    ctx.globalAlpha = 0.4;
  }

  ctx.fillStyle = '#7eb2ff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d7e9ff';
  ctx.fillRect(player.x - 4, player.y - player.radius - 18, 8, 14);
  ctx.restore();
}

function drawBolts() {
  for (const bolt of game.bolts) {
    if (bolt.phase === 'telegraph') {
      ctx.strokeStyle = 'rgba(255, 86, 86, 0.95)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bolt.x, 0);
      ctx.lineTo(bolt.x, groundY);
      ctx.stroke();
      continue;
    }

    ctx.strokeStyle = 'rgba(207, 236, 255, 0.95)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    let y = 0;
    let x = bolt.x;
    ctx.moveTo(x, y);
    while (y < groundY) {
      y += 26;
      x += (Math.random() - 0.5) * 22;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(171, 220, 255, 0.35)';
    ctx.fillRect(bolt.x - 18, groundY - 8, 36, 8);
  }
}

function render() {
  drawBackground();
  drawBolts();
  drawPlayer();
}

function loop(ts) {
  if (!lastTs) {
    lastTs = ts;
  }
  const dt = Math.min(0.033, (ts - lastTs) / 1000);
  lastTs = ts;
  nowSec += dt;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

function bindEvents() {
  window.addEventListener('resize', resize);

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('pointercancel', onPointerUp, { passive: false });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
}

function init() {
  game.best = safeLoadBest();
  updateHud();
  resize();
  bindEvents();

  overlay.style.display = 'grid';
  startPanel.hidden = false;
  gameOverPanel.hidden = true;

  requestAnimationFrame(loop);
}

init();
