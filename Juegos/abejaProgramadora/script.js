// ============================================================
//  ABEJA PROGRAMADORA – Juego educativo de pensamiento computacional
//  Versión mejorada con estrellas, niveles y persistencia
// ============================================================

'use strict';

// ---------- Constantes ----------
const GRID_SIZE = 6;
const DIRS = [
  [-1, 0],  // 0 = arriba
  [0, 1],   // 1 = derecha
  [1, 0],   // 2 = abajo
  [0, -1]   // 3 = izquierda
];
const ROT_DEG = [0, 90, 180, 270]; // rotación visual según dirección
const CMD_LABELS = {
  forward:  { icon: '⬆️', text: 'Adelante' },
  backward: { icon: '⬇️', text: 'Atrás' },
  left:     { icon: '↩️', text: 'Izq.' },
  right:    { icon: '↪️', text: 'Der.' }
};

const BEE_SVG = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Alas -->
    <ellipse cx="28" cy="34" rx="16" ry="26" fill="#fff9c4" opacity="0.9"
             transform="rotate(-25 28 34)">
      <animate attributeName="ry" values="26;18;26" dur="0.35s" repeatCount="indefinite"/>
    </ellipse>
    <ellipse cx="72" cy="34" rx="16" ry="26" fill="#fff9c4" opacity="0.9"
             transform="rotate(25 72 34)">
      <animate attributeName="ry" values="26;18;26" dur="0.35s" repeatCount="indefinite"/>
    </ellipse>
    <!-- Cuerpo -->
    <ellipse cx="50" cy="58" rx="27" ry="31" fill="#ffca28" stroke="#e0a800" stroke-width="1.5"/>
    <!-- Rayas -->
    <path d="M23 46 Q50 52 77 46" stroke="#3b2f2f" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M23 60 Q50 66 77 60" stroke="#3b2f2f" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M26 73 Q50 78 74 73" stroke="#3b2f2f" stroke-width="6" fill="none" stroke-linecap="round"/>
    <!-- Cabeza -->
    <circle cx="50" cy="27" r="17" fill="#ffca28" stroke="#e0a800" stroke-width="1.5"/>
    <!-- Ojos -->
    <circle cx="43" cy="25" r="4.5" fill="#3b2f2f"/>
    <circle cx="57" cy="25" r="4.5" fill="#3b2f2f"/>
    <circle cx="44" cy="23" r="1.7" fill="white"/>
    <circle cx="58" cy="23" r="1.7" fill="white"/>
    <!-- Mejillas -->
    <circle cx="38" cy="31" r="3" fill="#ff8fa3" opacity="0.75"/>
    <circle cx="62" cy="31" r="3" fill="#ff8fa3" opacity="0.75"/>
    <!-- Antenas -->
    <line x1="42" y1="12" x2="34" y2="2" stroke="#3b2f2f" stroke-width="2.6" stroke-linecap="round"/>
    <line x1="58" y1="12" x2="66" y2="2" stroke="#3b2f2f" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="34" cy="2" r="3" fill="#3b2f2f"/>
    <circle cx="66" cy="2" r="3" fill="#3b2f2f"/>
    <!-- Sonrisa -->
    <path d="M43 33 Q50 38 57 33" stroke="#3b2f2f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </svg>
`;

// ---------- Estado del juego ----------
const state = {
  bee:      { row: 5, col: 0, dir: 0 },
  goal:     { row: 0, col: 5 },
  sequence: [],
  running:  false,
  paused:   false,
  currentStep: 0,
  soundEnabled: true,
  level: 1,
  stars: 0,
  totalStars: 0,
  optimalSteps: 0,
  bestStars: {},
  dragging: false,
};

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const dom = {
  grid:          $('grid'),
  sequenceBox:   $('sequenceBox'),
  chipCounter:   $('chipCounter'),
  statusBar:     $('statusBar'),
  levelValue:    $('levelValue'),
  starsValue:    $('starsValue'),
  movesValue:    $('movesValue'),
  btnGo:         $('btnGo'),
  btnPause:      $('btnPause'),
  btnClear:      $('btnClear'),
  btnNew:        $('btnNew'),
  btnSound:      $('btnSound'),
  btnHelp:       $('btnHelp'),
  feedback:      $('feedback'),
  feedbackEmoji: $('feedbackEmoji'),
  feedbackMsg:   $('feedbackMsg'),
  confettiLayer: $('confettiLayer'),
  startOverlay:  $('startOverlay'),
  helpOverlay:   $('helpOverlay'),
  winOverlay:    $('winOverlay'),
  btnStart:      $('btnStart'),
  btnCloseHelp:  $('btnCloseHelp'),
  btnCloseHelp2: $('btnCloseHelp2'),
  btnNextLevel:  $('btnNextLevel'),
  winSteps:      $('winSteps'),
  winLevel:      $('winLevel'),
  winStars:      $('winStars'),
  winMsg:        $('winMsg'),
};

let beeEl = null;
let beeLayer = null;
let audioCtx = null;

// ============================================================
//  UTILIDADES
// ============================================================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function getCell(row, col) {
  return dom.grid.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

// ============================================================
//  AUDIO (Web Audio API – sin archivos)
// ============================================================
function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function tone(freq, dur, type = 'sine', vol = 0.15, when = 0) {
  if (!state.soundEnabled) return;
  ensureAudio();
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const sfx = {
  click:  () => tone(660, 0.07, 'triangle', 0.10),
  add:    () => { tone(520, 0.09, 'sine', 0.13); tone(780, 0.10, 'sine', 0.11, 0.07); },
  remove: () => { tone(320, 0.10, 'sine', 0.10); tone(220, 0.10, 'sine', 0.08, 0.05); },
  move:   () => tone(440, 0.11, 'sine', 0.13),
  turn:   () => { tone(330, 0.08, 'triangle', 0.11); tone(400, 0.09, 'triangle', 0.10, 0.06); },
  go:     () => { tone(523, 0.10, 'sine', 0.14); tone(659, 0.10, 'sine', 0.14, 0.09); tone(784, 0.14, 'sine', 0.14, 0.18); },
  pause:  () => tone(400, 0.14, 'triangle', 0.11),
  clear:  () => { tone(300, 0.08, 'sawtooth', 0.07); tone(200, 0.14, 'sawtooth', 0.06, 0.07); },
  error:  () => { tone(200, 0.18, 'triangle', 0.11); tone(160, 0.26, 'triangle', 0.09, 0.14); },
  star:   (i) => tone(660 + i * 220, 0.22, 'sine', 0.16),
  win:    () => {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((f, i) => tone(f, 0.25, 'sine', 0.15, i * 0.11));
    tone(1568, 0.4, 'sine', 0.13, notes.length * 0.11);
  },
};

// ============================================================
//  TABLERO
// ============================================================
function buildGrid() {
  dom.grid.innerHTML = '';

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('role', 'gridcell');
      dom.grid.appendChild(cell);
    }
  }

  // Capa para la abeja (para poder animarla suavemente)
  beeLayer = document.createElement('div');
  beeLayer.className = 'bee-layer';
  Object.assign(beeLayer.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '6',
    overflow: 'visible'
  });
  dom.grid.appendChild(beeLayer);

  // Abeja
  beeEl = document.createElement('div');
  beeEl.className = 'bee';
  beeEl.innerHTML = BEE_SVG;
  Object.assign(beeEl.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    transformOrigin: '50% 55%',
    transition: 'left .45s cubic-bezier(.34,1.4,.64,1), top .45s cubic-bezier(.34,1.4,.64,1), transform .45s cubic-bezier(.34,1.4,.64,1)',
    willChange: 'left, top, transform'
  });
  beeLayer.appendChild(beeEl);
}

function positionBee(animate = true) {
  if (!beeEl) return;
  const cell = getCell(state.bee.row, state.bee.col);
  if (!cell) return;

  const gridRect = dom.grid.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();

  const x = cellRect.left - gridRect.left + cellRect.width  / 2;
  const y = cellRect.top  - gridRect.top  + cellRect.height / 2;

  const w = cellRect.width  * 0.88;
  const h = cellRect.height * 0.88;

  if (!animate) {
    beeEl.style.transition = 'none';
    requestAnimationFrame(() => {
      beeEl.style.transition = '';
    });
  }

  beeEl.style.width  = w + 'px';
  beeEl.style.height = h + 'px';
  beeEl.style.left   = x + 'px';
  beeEl.style.top    = y + 'px';
  beeEl.style.transform = `translate(-50%, -55%) rotate(${ROT_DEG[state.bee.dir]}deg)`;
}

// ============================================================
//  NIVELES
// ============================================================
// Definición de niveles: dificultad progresiva.
// Sin obstáculos por ahora; las distancias crecen con el nivel.
function levelConfig(level) {
  // Niveles fijos iniciales
  const presets = [
    { bee: { row: 3, col: 0, dir: 1 }, goal: { row: 3, col: 3 } }, // 1 – misma fila
    { bee: { row: 5, col: 0, dir: 0 }, goal: { row: 2, col: 0 } }, // 2 – misma columna
    { bee: { row: 5, col: 5, dir: 0 }, goal: { row: 1, col: 2 } }, // 3
    { bee: { row: 0, col: 0, dir: 1 }, goal: { row: 4, col: 5 } }, // 4
    { bee: { row: 2, col: 4, dir: 2 }, goal: { row: 5, col: 1 } }, // 5
  ];
  if (level <= presets.length) return presets[level - 1];

  // Generación aleatoria para niveles avanzados
  const bee = {
    row: Math.floor(Math.random() * 2) === 0 ? 0 : 5,
    col: Math.floor(Math.random() * GRID_SIZE),
    dir: 2,
  };
  const goal = {
    row: 2 + Math.floor(Math.random() * 4),
    col: Math.floor(Math.random() * GRID_SIZE),
  };
  if (bee.row === 0) bee.dir = 2; else bee.dir = 0;
  return { bee, goal };
}

function computeOptimalSteps(bee, goal) {
  const dr = goal.row - bee.row;
  const dc = goal.col - bee.col;

  // Direcciones objetivo necesarias
  // 0=arriba, 1=derecha, 2=abajo, 3=izquierda
  let neededDir;
  if (Math.abs(dr) >= Math.abs(dc)) {
    neededDir = dr >= 0 ? 2 : 0;
  } else {
    neededDir = dc >= 0 ? 1 : 3;
  }

  const moves = Math.abs(dr) + Math.abs(dc);

  // Giros mínimos (0, 1 o 2)
  let diff = (neededDir - bee.dir + 4) % 4;
  const turns = diff <= 2 ? diff : 0; // si necesita 3, mejor girar al otro lado (1 giro? no, sería 1 también)

  // En realidad si diff === 3, es más óptimo girar al otro lado: 1 giro equivale a 3 giros en sentido contrario
  // Así que el número mínimo de giros es min(diff, 4-diff)
  const minTurns = Math.min(diff, 4 - diff);

  // Pero solo necesitamos girar UNA VEZ hacia la dirección inicial, luego caminar.
  // Como mucho 2 giros son necesarios (una vez al inicio).
  // Simplificamos: giros mínimos al inicio.
  return minTurns + moves;
}

// ============================================================
//  SECUENCIA
// ============================================================
function updateSequenceUI() {
  dom.sequenceBox.innerHTML = '';
  dom.chipCounter.textContent = `${state.sequence.length} paso${state.sequence.length === 1 ? '' : 's'}`;
  dom.movesValue.textContent = state.sequence.length;

  if (state.sequence.length === 0) {
    dom.sequenceBox.innerHTML = `
      <div class="seq-empty">
        <span class="seq-empty-icon">✨</span>
        <span>Aquí aparecen tus pasos…</span>
      </div>`;
    return;
  }

  state.sequence.forEach((cmd, i) => {
    const chip = document.createElement('div');
    chip.className = 'seq-chip';
    if (state.running) {
      if (i < state.currentStep) chip.classList.add('done');
      else if (i === state.currentStep) chip.classList.add('executing');
    }
    chip.innerHTML = `
      <span class="chip-icon">${CMD_LABELS[cmd].icon}</span>
      <span class="chip-label">${CMD_LABELS[cmd].text}</span>`;
    dom.sequenceBox.appendChild(chip);
  });

  // Autoscroll al chip activo o al final
  const target = dom.sequenceBox.querySelector('.seq-chip.executing') ||
                 dom.sequenceBox.querySelector('.seq-chip:last-child');
  if (target) {
    dom.sequenceBox.scrollTo({
      left: target.offsetLeft - dom.sequenceBox.clientWidth / 2 + target.clientWidth / 2,
      behavior: 'smooth'
    });
  }
}

function addCommand(cmd) {
  if (state.running) return;
  if (state.sequence.length >= 60) return; // límite amable
  state.sequence.push(cmd);
  updateSequenceUI();
  sfx.add();
  setStatus(`➕ ${CMD_LABELS[cmd].text}`, 'info', 700);
}

function clearSequence() {
  if (state.running) return;
  state.sequence = [];
  updateSequenceUI();
  sfx.clear();
  setStatus('Memoria borrada ✨', 'info', 1200);
}

function setStatus(text, type = 'info', duration = 0) {
  clearTimeout(setStatus._t);
  dom.statusBar.textContent = text;
  dom.statusBar.classList.remove('running', 'error');
  if (type === 'running') dom.statusBar.classList.add('running');
  if (type === 'error')   dom.statusBar.classList.add('error');

  if (duration) {
    setStatus._t = setTimeout(() => {
      dom.statusBar.textContent = '¡Programa el camino de la abeja!';
      dom.statusBar.classList.remove('running', 'error');
    }, duration);
  }
}

// ============================================================
//  EJECUCIÓN
// ============================================================
async function runSequence() {
  if (state.running || state.sequence.length === 0) return;

  state.running = true;
  state.paused = false;
  state.currentStep = 0;

  lockControls(true);
  sfx.go();
  setStatus('🚀 ¡La abeja está volando!', 'running');
  updateSequenceUI();

  // Limpiar marcas previas
  document.querySelectorAll('.cell.highlight, .cell.visited')
    .forEach(c => c.classList.remove('highlight', 'visited'));

  const startCell = getCell(state.bee.row, state.bee.col);
  if (startCell) startCell.classList.add('visited');

  for (let i = 0; i < state.sequence.length; i++) {
    if (!state.running) break;

    state.currentStep = i;
    updateSequenceUI();

    while (state.paused && state.running) await sleep(120);
    if (!state.running) break;

    await executeCommand(state.sequence[i]);
    await sleep(340);
  }

  if (state.running) finishRun();
}

function finishRun() {
  state.running = false;
  state.paused = false;
  lockControls(false);
  dom.statusBar.classList.remove('running');

  const arrived = state.bee.row === state.goal.row && state.bee.col === state.goal.col;

  updateSequenceUI();

  if (arrived) {
    win();
  } else {
    sfx.error();
    setStatus('La abeja no llegó a la flor. ¡Intenta otra vez!', 'error');
    showToast('😅', 'Casi… ¡prueba otra vez!', true);
  }
}

async function executeCommand(cmd) {
  if (cmd === 'forward' || cmd === 'backward') {
    const dirIdx = cmd === 'forward' ? state.bee.dir : (state.bee.dir + 2) % 4;
    const [dr, dc] = DIRS[dirIdx];
    const nr = state.bee.row + dr;
    const nc = state.bee.col + dc;

    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
      state.bee.row = nr;
      state.bee.col = nc;
      positionBee(true);
      sfx.move();

      const cell = getCell(nr, nc);
      cell.classList.add('highlight');
      setTimeout(() => cell.classList.remove('highlight'), 420);
      cell.classList.add('visited');
      await sleep(460);
    } else {
      // Borde: rebote
      sfx.error();
      if (beeEl) {
        beeEl.style.filter = 'drop-shadow(0 5px 5px rgba(0,0,0,.25)) hue-rotate(-25deg)';
        beeEl.animate(
          [
            { transform: `translate(-50%, -55%) rotate(${ROT_DEG[state.bee.dir]}deg) translateX(0)` },
            { transform: `translate(-50%, -55%) rotate(${ROT_DEG[state.bee.dir]}deg) translateX(-8px)` },
            { transform: `translate(-50%, -55%) rotate(${ROT_DEG[state.bee.dir]}deg) translateX(0)` },
          ],
          { duration: 380, easing: 'ease-out' }
        );
        setTimeout(() => { beeEl.style.filter = ''; }, 420);
      }
      await sleep(400);
    }
  } else if (cmd === 'left' || cmd === 'right') {
    state.bee.dir = (state.bee.dir + (cmd === 'right' ? 1 : 3)) % 4;
    positionBee(true);
    sfx.turn();
    if (beeEl) {
      beeEl.classList.add('turning');
      setTimeout(() => beeEl.classList.remove('turning'), 500);
    }
    await sleep(380);
  }
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;

  if (state.paused) {
    dom.btnPause.innerHTML = '<span class="action-icon">▶️</span><span>Seguir</span>';
    setStatus('⏸️ En pausa…');
    sfx.pause();
  } else {
    dom.btnPause.innerHTML = '<span class="action-icon">⏸️</span><span>Pausa</span>';
    setStatus('🚀 ¡La abeja está volando!', 'running');
    sfx.go();
  }
}

function lockControls(lock) {
  dom.btnGo.disabled     = lock;
  dom.btnPause.disabled  = !lock;
  dom.btnClear.disabled  = lock;
  dom.btnNew.disabled    = lock;
  document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = lock);
}

// ============================================================
//  VICTORIA Y NIVELES
// ============================================================
function win() {
  const usedSteps = state.sequence.length;
  const optimal = state.optimalSteps;

  // Estrellas según eficiencia
  let stars = 1;
  if (usedSteps <= optimal + 1) stars = 3;
  else if (usedSteps <= optimal + 4) stars = 2;

  state.stars = stars;
  state.totalStars += stars;

  // Mejor marca del nivel
  const key = `bee_level_${state.level}`;
  const prevBest = state.bestStars[key] || 0;
  if (stars > prevBest) state.bestStars[key] = stars;

  // Persistir
  persist();

  // Actualizar HUD
  dom.starsValue.textContent = state.totalStars;

  // Animación abeja
  if (beeEl) {
    beeEl.classList.add('celebrating');
    setTimeout(() => beeEl.classList.remove('celebrating'), 2400);
  }

  sfx.win();
  // Pequeños ding para cada estrella
  for (let i = 0; i < stars; i++) setTimeout(() => sfx.star(i), 500 + i * 260);

  launchConfetti();

  // Mostrar overlay
  dom.winSteps.textContent = usedSteps;
  dom.winLevel.textContent = state.level;
  dom.winMsg.textContent = stars === 3
    ? '¡Ruta perfecta! Eres un genio programando 🧠'
    : stars === 2
    ? '¡Muy bien! Puedes hacerlo aún más corto 💪'
    : '¡Lo lograste! Intenta usar menos pasos 🌟';

  // Estrellas
  const starEls = dom.winStars.querySelectorAll('.win-star');
  starEls.forEach((s, i) => {
    s.classList.toggle('hidden', i >= stars);
  });

  setTimeout(() => showOverlay(dom.winOverlay), 900);
}

function nextLevel() {
  state.level++;
  startLevel(state.level);
  hideOverlay(dom.winOverlay);
}

// ============================================================
//  INICIO DE NIVEL
// ============================================================
function startLevel(level) {
  const config = levelConfig(level);

  state.bee = { ...config.bee };
  state.goal = { ...config.goal };
  state.sequence = [];
  state.currentStep = 0;
  state.running = false;
  state.paused = false;

  lockControls(false);

  // Limpiar celdas
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('goal', 'highlight', 'visited');
  });

  // Meta
  const goalCell = getCell(state.goal.row, state.goal.col);
  if (goalCell) goalCell.classList.add('goal');

  // Abeja
  positionBee(false);

  // Óptimo para estrellas
  state.optimalSteps = computeOptimalSteps(state.bee, state.goal);

  // HUD
  dom.levelValue.textContent = state.level;
  dom.starsValue.textContent = state.totalStars;

  updateSequenceUI();
  setStatus('¡Programa el camino de la abeja!');
}

// ============================================================
//  OVERLAYS Y TOAST
// ============================================================
function showOverlay(el) {
  el.classList.add('show');
}
function hideOverlay(el) {
  el.classList.remove('show');
}

function showToast(emoji, msg, isError = false) {
  dom.feedbackEmoji.textContent = emoji;
  dom.feedbackMsg.textContent = msg;
  dom.feedback.classList.toggle('error', isError);
  dom.feedback.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => dom.feedback.classList.remove('show'), 2600);
}

// ============================================================
//  CONFETI
// ============================================================
function launchConfetti() {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9ff3', '#feca57', '#ff8fa3', '#b28bea'];
  const count = 70;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    const size = 8 + Math.random() * 10;
    c.style.left = (Math.random() * 100) + 'vw';
    c.style.width = size + 'px';
    c.style.height = (size * (0.6 + Math.random() * 0.8)) + 'px';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = (Math.random() * 0.5) + 's';
    c.style.animationDuration = (1.8 + Math.random() * 1.2) + 's';
    if (Math.random() > 0.5) c.style.borderRadius = '50%';
    dom.confettiLayer.appendChild(c);
    setTimeout(() => c.remove(), 3400);
  }
}

// ============================================================
//  PERSISTENCIA
// ============================================================
function persist() {
  try {
    localStorage.setItem('abeja_state', JSON.stringify({
      level: state.level,
      totalStars: state.totalStars,
      bestStars: state.bestStars,
      sound: state.soundEnabled,
    }));
  } catch (_) {}
}

function restore() {
  try {
    const raw = localStorage.getItem('abeja_state');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.level === 'number')      state.level = data.level;
    if (typeof data.totalStars === 'number') state.totalStars = data.totalStars;
    if (data.bestStars && typeof data.bestStars === 'object') state.bestStars = data.bestStars;
    if (typeof data.sound === 'boolean') {
      state.soundEnabled = data.sound;
      dom.btnSound.textContent = state.soundEnabled ? '🔊' : '🔇';
      dom.btnSound.classList.toggle('muted', !state.soundEnabled);
    }
  } catch (_) {}
}

// ============================================================
//  EVENTOS
// ============================================================
function bindEvents() {
  // Botones de comando (con manejo táctil y click)
  document.querySelectorAll('.cmd-btn').forEach(btn => {
    const handler = (e) => {
      e.preventDefault();
      if (state.running) return;
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 130);
      sfx.click();
      addCommand(btn.dataset.cmd);
    };
    btn.addEventListener('click', handler);
  });

  // GO
  dom.btnGo.addEventListener('click', (e) => {
    e.preventDefault();
    dom.btnGo.classList.add('pressed');
    setTimeout(() => dom.btnGo.classList.remove('pressed'), 130);
    runSequence();
  });

  // PAUSA
  dom.btnPause.addEventListener('click', (e) => {
    e.preventDefault();
    dom.btnPause.classList.add('pressed');
    setTimeout(() => dom.btnPause.classList.remove('pressed'), 130);
    togglePause();
  });

  // BORRAR
  dom.btnClear.addEventListener('click', (e) => {
    e.preventDefault();
    dom.btnClear.classList.add('pressed');
    setTimeout(() => dom.btnClear.classList.remove('pressed'), 130);
    clearSequence();
  });

  // NUEVO RETO
  dom.btnNew.addEventListener('click', (e) => {
    e.preventDefault();
    dom.btnNew.classList.add('pressed');
    setTimeout(() => dom.btnNew.classList.remove('pressed'), 130);
    if (state.running) return;
    sfx.click();
    startLevel(state.level);
    setStatus('¡Nuevo reto! Programa el camino 🐝', 'info', 1600);
  });

  // SONIDO
  dom.btnSound.addEventListener('click', (e) => {
    e.preventDefault();
    state.soundEnabled = !state.soundEnabled;
    dom.btnSound.textContent = state.soundEnabled ? '🔊' : '🔇';
    dom.btnSound.classList.toggle('muted', !state.soundEnabled);
    if (state.soundEnabled) sfx.click();
    persist();
  });

  // AYUDA
  dom.btnHelp.addEventListener('click', (e) => {
    e.preventDefault();
    sfx.click();
    showOverlay(dom.helpOverlay);
  });
  dom.btnCloseHelp.addEventListener('click', () => hideOverlay(dom.helpOverlay));
  dom.btnCloseHelp2.addEventListener('click', () => hideOverlay(dom.helpOverlay));

  // INICIO
  dom.btnStart.addEventListener('click', () => {
    sfx.click();
    ensureAudio();
    hideOverlay(dom.startOverlay);
    startLevel(state.level);
  });

  // SIGUIENTE NIVEL
  dom.btnNextLevel.addEventListener('click', () => {
    sfx.click();
    nextLevel();
  });

  // Cerrar overlay al hacer clic fuera de la tarjeta (solo ayuda)
  dom.helpOverlay.addEventListener('click', (e) => {
    if (e.target === dom.helpOverlay) hideOverlay(dom.helpOverlay);
  });

  // Reposicionar abeja al cambiar tamaño / orientación
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => positionBee(false), 120);
  });

  // AudioContext en la primera interacción (política de navegadores)
  const initAudioOnce = () => {
    ensureAudio();
    window.removeEventListener('pointerdown', initAudioOnce);
    window.removeEventListener('keydown', initAudioOnce);
  };
  window.addEventListener('pointerdown', initAudioOnce, { once: true });
  window.addEventListener('keydown', initAudioOnce, { once: true });

  // Atajos de teclado
  window.addEventListener('keydown', (e) => {
    if (state.running) return;
    switch (e.key) {
      case 'ArrowUp':    e.preventDefault(); addCommand('forward'); break;
      case 'ArrowDown':  e.preventDefault(); addCommand('backward'); break;
      case 'ArrowLeft':  e.preventDefault(); addCommand('left'); break;
      case 'ArrowRight': e.preventDefault(); addCommand('right'); break;
      case 'Enter':      e.preventDefault(); runSequence(); break;
      case 'Backspace':  e.preventDefault(); clearSequence(); break;
      case 'Escape':     e.preventDefault(); hideOverlay(dom.helpOverlay); break;
    }
  });
}

// ============================================================
//  INICIALIZACIÓN
// ============================================================
function init() {
  buildGrid();
  bindEvents();
  restore();

  // Mostrar overlay de inicio tras un pequeño delay
  setTimeout(() => showOverlay(dom.startOverlay), 350);

  // Pintar estado inicial por si el overlay tarda
  dom.levelValue.textContent = state.level;
  dom.starsValue.textContent = state.totalStars;

  // Nivel de fondo por si acaso (el botón Start llama a startLevel)
  startLevel(state.level);
}

// Arranque
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}