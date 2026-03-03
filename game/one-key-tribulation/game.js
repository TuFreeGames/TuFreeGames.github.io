'use strict';

const config = {
  initialHp: 10,
  initialBoltDamage: 5,
  maxDamageRatio: 0.6,
  hitInvulnSec: 0.35,
  hitFlashSec: 0.14,
  enableVibration: true,
  hitRadius: 30,
  hitBreakGain: 8,
  stageBreakGain: 4,
  stageHealBase: 1,
  stageDamageUpEvery: 10,
  realmBreakthroughMaxHpUp: 2,
  realmBreakthroughDamageUp: 1,
  baseBoltWidth: 20,
  playerRadius: 20,
  moveBoundPadding: 24,
  playerFollowSpeed: 0.22,
  scorePerStage: 100,
  spritePath: './assets/sprites/hero-walk-spritesheet.png',
  spriteCols: 6,
  spriteRows: 5,
  spriteTotalFrames: 30,
  spriteScale: 0.56,
  spriteFps: 12,
  boltZigzagSegments: 19,
  realmConfigPath: './realm_config.json'
};

const storageKeys = {
  bestScore: 'oktt_best_score',
  bestStage: 'oktt_best_stage',
  bestRealm: 'oktt_best_realm'
};

const fallbackRealmConfig = {
  realms: [
    {
      id: 'qi',
      name: '練氣',
      max_stage: 3,
      stages: [
        { stage: 1, need_break: 40 },
        { stage: 2, need_break: 70 },
        { stage: 3, need_break: 120 }
      ],
      next_id: 'foundation'
    },
    {
      id: 'foundation',
      name: '築基',
      max_stage: 3,
      stages: [
        { stage: 1, need_break: 180 },
        { stage: 2, need_break: 260 },
        { stage: 3, need_break: 380 }
      ],
      next_id: 'core'
    },
    {
      id: 'core',
      name: '金丹',
      max_stage: 3,
      stages: [
        { stage: 1, need_break: 520 },
        { stage: 2, need_break: 720 },
        { stage: 3, need_break: 1000 }
      ],
      next_id: 'nascent'
    },
    {
      id: 'nascent',
      name: '元嬰',
      max_stage: 3,
      stages: [
        { stage: 1, need_break: 1400 },
        { stage: 2, need_break: 1900 },
        { stage: 3, need_break: 2600 }
      ],
      next_id: 'spirit'
    },
    {
      id: 'spirit',
      name: '化神',
      max_stage: 3,
      stages: [
        { stage: 1, need_break: 3500 },
        { stage: 2, need_break: 4700 },
        { stage: 3, need_break: 6200 }
      ],
      next_id: 'void'
    },
    {
      id: 'void',
      name: '煉虛',
      max_stage: 3,
      stages: [
        { stage: 1, need_break: 8000 },
        { stage: 2, need_break: 10500 },
        { stage: 3, need_break: 13500 }
      ],
      next_id: 'fusion'
    },
    {
      id: 'fusion',
      name: '合體',
      max_stage: 3,
      stages: [
        { stage: 1, need_break: 17000 },
        { stage: 2, need_break: 21500 },
        { stage: 3, need_break: 27000 }
      ],
      next_id: 'tribulation'
    },
    {
      id: 'tribulation',
      name: '渡劫',
      max_stage: 3,
      stages: [
        { stage: 1, need_break: 34000 },
        { stage: 2, need_break: 42000 },
        { stage: 3, need_break: 52000 }
      ],
      next_id: ''
    }
  ]
};

const buffDefs = [
  {
    id: 'hp2',
    name: '護體',
    desc: 'maxHP +2',
    maxStacks: 5,
    weight: 16,
    icon: '護'
  },
  {
    id: 'hp5_risk',
    name: '煉體',
    desc: 'maxHP +5，baseBoltDamage +1',
    maxStacks: 3,
    weight: 11,
    icon: '煉'
  },
  {
    id: 'heal1',
    name: '回春',
    desc: '每劫回血額外 +1',
    maxStacks: 3,
    weight: 14,
    icon: '春'
  },
  {
    id: 'heal2_bolts',
    name: '血戰',
    desc: '每劫回血額外 +2，且每波雷數 +1',
    maxStacks: 2,
    weight: 8,
    icon: '戰'
  },
  {
    id: 'break25',
    name: '悟道',
    desc: '突破值獲取 +25%',
    maxStacks: 4,
    weight: 10,
    icon: '悟'
  }
];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hpEl = document.getElementById('hp');
const boltDamageEl = document.getElementById('boltDamage');
const stageEl = document.getElementById('stage');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const realmEl = document.getElementById('realm');
const breakFillEl = document.getElementById('breakFill');
const breakTextEl = document.getElementById('breakText');
const buffsEl = document.getElementById('buffs');

const overlay = document.getElementById('overlay');
const startPanel = document.getElementById('startPanel');
const buffPickPanel = document.getElementById('buffPickPanel');
const buffTitleEl = document.getElementById('buffTitle');
const buffGrid = document.getElementById('buffGrid');
const gameOverPanel = document.getElementById('gameOverPanel');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const finalScoreEl = document.getElementById('finalScore');
const finalStageEl = document.getElementById('finalStage');
const finalRealmEl = document.getElementById('finalRealm');
const finalTimeEl = document.getElementById('finalTime');
const finalBestEl = document.getElementById('finalBest');

let state = 'menu';
let w = 0;
let h = 0;
let groundY = 0;
let nowSec = 0;
let lastTs = 0;

const player = {
  x: 0,
  y: 0,
  targetX: 0,
  baseRadius: config.playerRadius,
  radius: config.playerRadius,
  invulnTimer: 0,
  facing: -1
};

const sprite = {
  image: new Image(),
  loaded: false,
  frameW: 0,
  frameH: 0,
  frame: 0,
  timer: 0
};

const realm = {
  config: fallbackRealmConfig,
  byId: new Map(),
  currentId: 'qi',
  stage: 1,
  breakValue: 0,
  needBreak: 1,
  pendingBuffPicks: 0
};

const game = {
  hp: config.initialHp,
  maxHp: config.initialHp,
  baseMaxHp: config.initialHp,
  boltDamage: config.initialBoltDamage,
  baseBoltDamage: config.initialBoltDamage,
  stage: 0,
  score: 0,
  timeSec: 0,
  bonusScore: 0,
  bestScore: 0,
  bestStage: 0,
  bestRealmText: '練氣 1',
  pointerActive: false,
  bolts: [],
  waveActive: false,
  waveGapTimer: 0,
  pendingWave: null,
  buffOptions: [],
  buffStacks: {},
  hitFlashTimer: 0,
  stats: {
    followSpeed: config.playerFollowSpeed,
    telegraphBonusSec: 0,
    radiusMultiplier: 1,
    hitBreakGain: config.hitBreakGain,
    stageHeal: config.stageHealBase,
    breakGainMultiplier: 1,
    extraBoltsPerWave: 0,
    lureChance: 0,
    stageBonus: 0,
    trackChance: 0,
    doubleChance: 0,
    boltWidthMultiplier: 1
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function minX() {
  return config.moveBoundPadding + player.radius;
}

function maxX() {
  return w - config.moveBoundPadding - player.radius;
}

function getBuffStack(id) {
  return game.buffStacks[id] || 0;
}

function safeLoadBest() {
  try {
    return {
      score: Number(localStorage.getItem(storageKeys.bestScore) || 0),
      stage: Number(localStorage.getItem(storageKeys.bestStage) || 0),
      realmText: localStorage.getItem(storageKeys.bestRealm) || '練氣 1'
    };
  } catch (_err) {
    return { score: 0, stage: 0, realmText: '練氣 1' };
  }
}

function safeSaveBest() {
  try {
    localStorage.setItem(storageKeys.bestScore, String(game.bestScore));
    localStorage.setItem(storageKeys.bestStage, String(game.bestStage));
    localStorage.setItem(storageKeys.bestRealm, game.bestRealmText);
  } catch (_err) {
    // ignore storage issues
  }
}

function buildRealmIndex() {
  realm.byId = new Map();
  for (const item of realm.config.realms) {
    realm.byId.set(item.id, item);
  }
}

function currentRealm() {
  return realm.byId.get(realm.currentId);
}

function currentRealmStageData() {
  const r = currentRealm();
  if (!r) {
    return null;
  }
  return r.stages.find((item) => item.stage === realm.stage) || r.stages[r.stages.length - 1];
}

function updateNeedBreak() {
  const stageData = currentRealmStageData();
  const rawNeed = stageData ? stageData.need_break : 40;
  realm.needBreak = Math.max(1, Math.round(Math.sqrt(rawNeed) * 8 + realm.stage * 25));
}

function realmLabel() {
  const r = currentRealm();
  const stageNames = ['初期', '中期', '後期'];
  const stageName = stageNames[clamp(realm.stage, 1, 3) - 1] || '初期';
  return `${r ? r.name : '未知'}${stageName}`;
}

function clampBoltDamage() {
  const maxAllowed = Math.ceil(game.maxHp * config.maxDamageRatio);
  game.boltDamage = clamp(game.boltDamage, 3, maxAllowed);
}

function refreshDerivedStats() {
  const hp2 = getBuffStack('hp2');
  const hp5Risk = getBuffStack('hp5_risk');
  const heal1 = getBuffStack('heal1');
  const heal2Bolts = getBuffStack('heal2_bolts');
  const break25 = getBuffStack('break25');

  game.maxHp = game.baseMaxHp + hp2 * 2 + hp5Risk * 5;
  game.hp = clamp(game.hp, 0, game.maxHp);

  game.boltDamage = game.baseBoltDamage + hp5Risk;
  clampBoltDamage();

  game.stats.followSpeed = config.playerFollowSpeed;
  game.stats.telegraphBonusSec = 0;
  game.stats.radiusMultiplier = 1;
  game.stats.hitBreakGain = config.hitBreakGain;
  game.stats.stageHeal = config.stageHealBase + heal1 + heal2Bolts * 2;
  game.stats.breakGainMultiplier = 1 + break25 * 0.25;
  game.stats.extraBoltsPerWave = heal2Bolts;
  game.stats.lureChance = 0;
  game.stats.stageBonus = 0;

  player.radius = player.baseRadius * game.stats.radiusMultiplier;
  player.y = groundY - player.radius;
  player.x = clamp(player.x, minX(), maxX());
  player.targetX = clamp(player.targetX, minX(), maxX());

}

function buffSummaryText() {
  const result = [];
  for (const def of buffDefs) {
    const stack = getBuffStack(def.id);
    if (stack > 0) {
      result.push(`${def.icon}${stack}`);
    }
  }
  return result.length ? result.join(' ') : '無';
}

function recomputeScore() {
  game.score = game.stage * config.scorePerStage + Math.floor(game.timeSec) + game.bonusScore;
}

function updateHud() {
  hpEl.textContent = `${Math.floor(game.hp)}/${game.maxHp}`;
  boltDamageEl.textContent = String(game.boltDamage);
  stageEl.textContent = String(game.stage);
  scoreEl.textContent = String(game.score);
  timeEl.textContent = game.timeSec.toFixed(1);
  bestEl.textContent = String(game.bestScore);
  realmEl.textContent = realmLabel();

  const breakRatio = clamp(realm.breakValue / realm.needBreak, 0, 1);
  breakFillEl.style.width = `${breakRatio * 100}%`;
  breakTextEl.textContent = `${realm.breakValue}/${realm.needBreak}`;
  buffsEl.textContent = buffSummaryText();
}

function initSprite() {
  sprite.image.decoding = 'async';
  sprite.image.onload = () => {
    sprite.loaded = true;
    sprite.frameW = sprite.image.naturalWidth / config.spriteCols;
    sprite.frameH = sprite.image.naturalHeight / config.spriteRows;
  };
  sprite.image.onerror = () => {
    sprite.loaded = false;
  };
  sprite.image.src = config.spritePath;
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

function resetRealmProgress() {
  realm.currentId = 'qi';
  realm.stage = 1;
  realm.breakValue = 0;
  realm.pendingBuffPicks = 0;
  updateNeedBreak();
}

function resetRound() {
  game.hp = config.initialHp;
  game.maxHp = config.initialHp;
  game.baseMaxHp = config.initialHp;
  game.boltDamage = config.initialBoltDamage;
  game.baseBoltDamage = config.initialBoltDamage;
  game.stage = 0;
  game.score = 0;
  game.timeSec = 0;
  game.bonusScore = 0;
  game.pointerActive = false;
  game.bolts = [];
  game.waveActive = false;
  game.waveGapTimer = 0;
  game.pendingWave = null;
  game.buffOptions = [];
  game.buffStacks = {};
  game.hitFlashTimer = 0;

  player.x = w * 0.5;
  player.targetX = player.x;
  player.invulnTimer = 0;
  player.facing = -1;

  sprite.frame = 0;
  sprite.timer = 0;

  resetRealmProgress();
  refreshDerivedStats();
  recomputeScore();
  updateHud();
}

function calcBoltsByStage(stage) {
  let bolts = Math.min(10, 1 + Math.floor(stage / 4));
  bolts += game.stats.extraBoltsPerWave;
  bolts += Math.floor(game.timeSec / 45);
  if (Math.random() < game.stats.lureChance) {
    bolts += 1;
  }
  return Math.min(10, bolts);
}

function calcWaveGap(stage) {
  const timeFactor = 1 + Math.floor(game.timeSec / 30) * 0.08;
  return Math.max(0.35, 1.1 - stage * 0.02) / timeFactor;
}

function calcTelegraph(stage) {
  const timeFactor = 1 + Math.floor(game.timeSec / 30) * 0.08;
  const base = Math.max(0.22, 0.55 - stage * 0.006) + game.stats.telegraphBonusSec;
  return base / timeFactor;
}

function classifyBolt(stage) {
  void stage;
  return 'normal';
}

function makeWavePlan() {
  const stage = Math.max(1, game.stage + 1);
  const count = calcBoltsByStage(stage);
  const telegraph = calcTelegraph(stage);
  const waveGap = calcWaveGap(stage);
  const boltWidth = config.baseBoltWidth;
  const bolts = [];

  for (let i = 0; i < count; i += 1) {
    const kind = classifyBolt(stage);
    const x = randRange(minX(), maxX());
    bolts.push({
      x,
      width: boltWidth,
      kind,
      phase: 'queued',
      timer: i * 0.11 + Math.random() * 0.12,
      telegraphSec: telegraph,
      hitAwarded: false,
      secondDone: false
    });
  }

  return { waveGap, bolts };
}

function prepareNextWave() {
  if (state !== 'playing') {
    return;
  }

  game.pendingWave = makeWavePlan();
  game.waveGapTimer = game.pendingWave.waveGap;
}

function startPendingWave() {
  if (!game.pendingWave) {
    return;
  }

  game.bolts = game.pendingWave.bolts.map((bolt) => ({ ...bolt }));
  game.pendingWave = null;
  game.waveActive = true;
}

function movePlayer(pointerX) {
  if (pointerX > player.x + 0.5) {
    player.facing = 1;
  } else if (pointerX < player.x - 0.5) {
    player.facing = -1;
  }
  player.targetX = clamp(pointerX, minX(), maxX());
}

function awardBreak(value) {
  realm.breakValue += value;
  updateHud();
}

function applyHitFeedback() {
  game.hitFlashTimer = config.hitFlashSec;
  if (config.enableVibration && navigator.vibrate) {
    navigator.vibrate(45);
  }
}

function resolveNearOrHit(bolt) {
  const dx = Math.abs(player.x - bolt.x);
  const hitRadius = config.hitRadius * game.stats.radiusMultiplier + player.radius * 0.6;

  if (player.invulnTimer <= 0 && dx <= hitRadius) {
    game.hp = Math.max(0, game.hp - game.boltDamage);
    player.invulnTimer = config.hitInvulnSec;
    applyHitFeedback();

    if (!bolt.hitAwarded) {
      awardBreak(Math.round(game.stats.hitBreakGain * game.stats.breakGainMultiplier));
      bolt.hitAwarded = true;
    }

    if (game.hp <= 0) {
      endGame();
    }
  }
}

function buildBoltPath(boltX, segments) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const y = t * groundY;
    const envelope = Math.sin(Math.PI * t);
    let x = boltX;

    if (i !== 0 && i !== segments) {
      const dir = i % 2 === 0 ? -1 : 1;
      const amp = 18;
      x += dir * amp * envelope;
    }

    points.push({ x, y });
  }
  return points;
}

function drawBoltPath(points, strokeStyle, lineWidth) {
  if (!points || points.length < 2) {
    return;
  }

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function tryBreakthrough() {
  let didAdvance = false;

  while (realm.breakValue >= realm.needBreak) {
    const current = currentRealm();
    if (!current) {
      break;
    }

    realm.breakValue -= realm.needBreak;

    if (realm.stage < current.max_stage) {
      realm.stage += 1;
    } else if (current.next_id) {
      realm.currentId = current.next_id;
      realm.stage = 1;
    } else {
      realm.breakValue = Math.max(0, realm.needBreak - 1);
      break;
    }

    didAdvance = true;
    realm.pendingBuffPicks += 1;

    game.baseMaxHp += config.realmBreakthroughMaxHpUp;
    game.baseBoltDamage += config.realmBreakthroughDamageUp;

    refreshDerivedStats();
    game.hp = game.maxHp;
    clampBoltDamage();
    updateNeedBreak();
  }

  if (didAdvance && state === 'playing') {
    enterBuffPick();
  }
}

function finishWave() {
  game.waveActive = false;
  game.stage += 1;

  game.hp = Math.min(game.maxHp, game.hp + game.stats.stageHeal);

  game.baseBoltDamage += 1;

  game.bonusScore += game.stats.stageBonus;

  refreshDerivedStats();
  awardBreak(Math.round(config.stageBreakGain * game.stats.breakGainMultiplier));
  tryBreakthrough();

  if (state === 'playing') {
    prepareNextWave();
  }

  recomputeScore();
  updateHud();
}

function updateWave(dt) {
  if (state !== 'playing') {
    return;
  }

  if (!game.waveActive) {
    game.waveGapTimer -= dt;
    if (game.waveGapTimer <= 0) {
      startPendingWave();
    }
    return;
  }

  for (let i = game.bolts.length - 1; i >= 0; i -= 1) {
    const bolt = game.bolts[i];
    bolt.timer -= dt;

    if (bolt.phase === 'queued' && bolt.timer <= 0) {
      bolt.phase = 'telegraph';
      bolt.timer = bolt.telegraphSec;
      continue;
    }

    if (bolt.phase === 'telegraph' && bolt.timer <= 0) {
      bolt.phase = 'strike';
      bolt.timer = 0.12;
      bolt.path = buildBoltPath(bolt.x, config.boltZigzagSegments);
      resolveNearOrHit(bolt);
      if (state !== 'playing') {
        return;
      }
      continue;
    }

    if (bolt.phase === 'strike' && bolt.timer <= 0) {
      game.bolts.splice(i, 1);
    }
  }

  if (game.waveActive && game.bolts.length === 0) {
    finishWave();
  }
}

function weightedPickUnique(pool, count) {
  const picked = [];
  const source = pool.slice();

  while (picked.length < count && source.length > 0) {
    let weightSum = 0;
    for (const item of source) {
      weightSum += item.weight;
    }

    let roll = Math.random() * weightSum;
    let chosenIndex = 0;
    for (let i = 0; i < source.length; i += 1) {
      roll -= source[i].weight;
      if (roll <= 0) {
        chosenIndex = i;
        break;
      }
    }

    picked.push(source[chosenIndex]);
    source.splice(chosenIndex, 1);
  }

  return picked;
}

function rollBuffOptions() {
  const available = buffDefs.filter((def) => getBuffStack(def.id) < def.maxStacks);
  const pool = available.length >= 3 ? available : buffDefs;
  game.buffOptions = weightedPickUnique(pool, 3);
}

function renderBuffOptions() {
  buffGrid.innerHTML = '';
  for (const buff of game.buffOptions) {
    const stack = getBuffStack(buff.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'buff-card';
    btn.dataset.buffId = buff.id;
    btn.innerHTML = `
      <h3>${buff.icon} ${buff.name}</h3>
      <p>${buff.desc}</p>
      <div class="buff-lv">目前等級 ${stack}/${buff.maxStacks}</div>
    `;
    buffGrid.appendChild(btn);
  }
}

function enterBuffPick() {
  state = 'buff_pick';
  overlay.style.display = 'grid';
  startPanel.hidden = true;
  gameOverPanel.hidden = true;
  buffPickPanel.hidden = false;

  buffTitleEl.textContent = `突破 ${realmLabel()}！選擇一個天賦`;
  rollBuffOptions();
  renderBuffOptions();
}

function applyBuff(buffId) {
  const def = buffDefs.find((item) => item.id === buffId);
  if (!def) {
    return;
  }

  const current = getBuffStack(buffId);
  if (current >= def.maxStacks) {
    return;
  }

  game.buffStacks[buffId] = current + 1;
  refreshDerivedStats();

  if (buffId === 'hp2') {
    game.hp = Math.min(game.maxHp, game.hp + 2);
  }
  if (buffId === 'hp5_risk') {
    game.hp = Math.min(game.maxHp, game.hp + 5);
  }

  recomputeScore();
  updateHud();
}

function onBuffPickClick(ev) {
  const btn = ev.target.closest('.buff-card');
  if (!btn) {
    return;
  }

  applyBuff(btn.dataset.buffId);

  realm.pendingBuffPicks = Math.max(0, realm.pendingBuffPicks - 1);

  if (realm.pendingBuffPicks > 0) {
    buffTitleEl.textContent = `再突破！選擇一個天賦（剩 ${realm.pendingBuffPicks}）`;
    rollBuffOptions();
    renderBuffOptions();
    return;
  }

  buffPickPanel.hidden = true;
  overlay.style.display = 'none';
  state = 'playing';
  prepareNextWave();
}

function startGame() {
  resetRound();
  state = 'playing';
  overlay.style.display = 'none';
  startPanel.hidden = true;
  buffPickPanel.hidden = true;
  gameOverPanel.hidden = true;
  prepareNextWave();
}

function endGame() {
  state = 'gameover';
  game.waveActive = false;
  game.waveGapTimer = 0;
  game.pendingWave = null;
  game.bolts = [];

  if (game.score > game.bestScore) {
    game.bestScore = game.score;
  }
  if (game.stage > game.bestStage) {
    game.bestStage = game.stage;
  }
  game.bestRealmText = realmLabel();
  safeSaveBest();

  finalScoreEl.textContent = String(game.score);
  finalStageEl.textContent = String(game.stage);
  finalRealmEl.textContent = realmLabel();
  finalTimeEl.textContent = game.timeSec.toFixed(1);
  finalBestEl.textContent = `${game.bestScore}（劫 ${game.bestStage} / ${game.bestRealmText}）`;

  overlay.style.display = 'grid';
  startPanel.hidden = true;
  buffPickPanel.hidden = true;
  gameOverPanel.hidden = false;
}

function onPointerDown(ev) {
  if (state !== 'playing' && state !== 'buff_pick') {
    return;
  }
  ev.preventDefault();
  game.pointerActive = true;
  movePlayer(ev.clientX);
}

function onPointerMove(ev) {
  if (state !== 'playing' && state !== 'buff_pick') {
    return;
  }

  const allowMove = ev.pointerType === 'mouse' || game.pointerActive;
  if (!allowMove) {
    return;
  }

  ev.preventDefault();
  movePlayer(ev.clientX);
}

function onPointerUp(ev) {
  if (state !== 'playing' && state !== 'buff_pick') {
    return;
  }
  ev.preventDefault();
  game.pointerActive = false;
}

function updateSprite(dt) {
  if (!sprite.loaded) {
    return;
  }

  const frameDuration = 1 / config.spriteFps;
  sprite.timer += dt;
  while (sprite.timer >= frameDuration) {
    sprite.timer -= frameDuration;
    sprite.frame = (sprite.frame + 1) % config.spriteTotalFrames;
  }
}

function update(dt) {
  if (state !== 'playing' && state !== 'buff_pick') {
    return;
  }

  const prevX = player.x;
  player.x += (player.targetX - player.x) * game.stats.followSpeed;
  player.x = clamp(player.x, minX(), maxX());

  const moveDx = player.x - prevX;
  if (moveDx > 0.1) {
    player.facing = 1;
  } else if (moveDx < -0.1) {
    player.facing = -1;
  }

  updateSprite(dt);

  if (player.invulnTimer > 0) {
    player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  }

  if (state === 'playing') {
    game.timeSec += dt;
    updateWave(dt);
    recomputeScore();
    tryBreakthrough();
    updateHud();
  }

  if (game.hitFlashTimer > 0) {
    game.hitFlashTimer = Math.max(0, game.hitFlashTimer - dt);
  }
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

function drawFallbackPlayer() {
  ctx.fillStyle = '#7eb2ff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d7e9ff';
  ctx.fillRect(player.x - 4, player.y - player.radius - 18, 8, 14);
}

function drawSpritePlayer() {
  const frameCol = sprite.frame % config.spriteCols;
  const frameRow = Math.floor(sprite.frame / config.spriteCols);
  const srcX = frameCol * sprite.frameW;
  const srcY = frameRow * sprite.frameH;
  const drawW = sprite.frameW * config.spriteScale;
  const drawH = sprite.frameH * config.spriteScale;
  const drawX = player.x - drawW * 0.5;
  const drawY = groundY - drawH;

  if (player.facing === 1) {
    ctx.drawImage(
      sprite.image,
      srcX,
      srcY,
      sprite.frameW,
      sprite.frameH,
      drawX + drawW,
      drawY,
      -drawW,
      drawH
    );
    return;
  }

  ctx.drawImage(sprite.image, srcX, srcY, sprite.frameW, sprite.frameH, drawX, drawY, drawW, drawH);
}

function drawPlayer() {
  ctx.save();
  const blinking = player.invulnTimer > 0 && Math.floor(nowSec * 24) % 2 === 0;
  if (blinking) {
    ctx.globalAlpha = 0.45;
  }

  if (sprite.loaded) {
    drawSpritePlayer();
  } else {
    drawFallbackPlayer();
  }

  ctx.restore();
}

function drawBolts() {
  for (const bolt of game.bolts) {
    if (bolt.phase === 'queued') {
      continue;
    }

    if (bolt.phase === 'telegraph') {
      const markerHeight = 36;
      const markerY = groundY - markerHeight;
      const markerW = bolt.width;
      ctx.fillStyle = 'rgba(255,88,88,0.9)';
      ctx.beginPath();
      ctx.moveTo(bolt.x - markerW * 0.5, groundY);
      ctx.lineTo(bolt.x + markerW * 0.5, groundY);
      ctx.lineTo(bolt.x, markerY);
      ctx.closePath();
      ctx.fill();
      continue;
    }

    if (!bolt.path) {
      bolt.path = buildBoltPath(bolt.x, config.boltZigzagSegments);
    }

    drawBoltPath(bolt.path, 'rgba(140, 206, 255, 0.48)', Math.max(8, bolt.width * 0.68));
    drawBoltPath(bolt.path, 'rgba(226, 246, 255, 0.98)', Math.max(3, bolt.width * 0.3));

    ctx.fillStyle = 'rgba(171, 220, 255, 0.4)';
    ctx.fillRect(bolt.x - bolt.width * 0.5, groundY - 8, bolt.width, 8);
  }
}

function drawHitFlash() {
  if (game.hitFlashTimer <= 0) {
    return;
  }

  const alpha = game.hitFlashTimer / config.hitFlashSec;
  ctx.fillStyle = `rgba(255,255,255,${0.35 * alpha})`;
  ctx.fillRect(0, 0, w, h);
}

function render() {
  drawBackground();
  drawBolts();
  drawPlayer();
  drawHitFlash();
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
  buffGrid.addEventListener('click', onBuffPickClick);
}

async function loadRealmConfig() {
  try {
    const res = await fetch(config.realmConfigPath, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('realm config fetch failed');
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.realms) || data.realms.length === 0) {
      throw new Error('realm config invalid');
    }
    realm.config = data;
  } catch (_err) {
    realm.config = fallbackRealmConfig;
  }
  buildRealmIndex();
}

async function init() {
  const best = safeLoadBest();
  game.bestScore = best.score;
  game.bestStage = best.stage;
  game.bestRealmText = best.realmText;

  await loadRealmConfig();

  initSprite();
  resize();
  resetRound();
  bindEvents();

  overlay.style.display = 'grid';
  startPanel.hidden = false;
  buffPickPanel.hidden = true;
  gameOverPanel.hidden = true;

  requestAnimationFrame(loop);
}

init();
