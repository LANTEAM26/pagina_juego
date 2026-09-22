// =========================================================
// LLUVIA DE PÉTALOS — GAME.JS (v13)
// - Compatible con HTML v13 (fondo global, vidas en columna)
// - Abeja con relación de aspecto correcta (¡no más aplastada!)
// - Hitbox coherente con el dibujo real
// - AudioContext robusto
// =========================================================

/* =========================================================
   1. CONFIGURACIÓN GLOBAL
   ========================================================= */
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const R = 'Recurso/';

const LEVELS = [
    {
        number: 1, goal: 100, time: 70,
        spawnInterval: 1200,
        fallSpeed: 1.8,
        speedVariance: 0.6,
        rainChance: 0, goldenChance: 0, wind: 0,
        clockMin: 1, clockMax: 2, clockChance: 0.06
    },
    {
        number: 2, goal: 250, time: 50,
        spawnInterval: 1000,
        fallSpeed: 2.6,
        speedVariance: 0.9,
        rainChance: 0.28, goldenChance: 0.05, wind: 0,
        clockMin: 3, clockMax: 5, clockChance: 0.07
    },
    {
        number: 3, goal: 450, time: 40,
        spawnInterval: 850,
        fallSpeed: 3.4,
        speedVariance: 1.2,
        rainChance: 0.30, goldenChance: 0.12, wind: 2.2,
        clockMin: 3, clockMax: 5, clockChance: 0.08
    }
];

// =========================================================
// TAMAÑOS GRANDES — para niños pequeños
// =========================================================
const FLOWERS = [
    { src: R + 'flor1.png', points: 5,  weight: 0.50, key: 'flor1', size: 160 },
    { src: R + 'flor2.png', points: 10, weight: 0.30, key: 'flor2', size: 170 },
    { src: R + 'flor3.png', points: 15, weight: 0.20, key: 'flor3', size: 180 }
];

const GOLDEN_FLOWER = { src: R + 'flor-dorada.png', points: 30, size: 200 };
const RAIN_DROP     = { src: R + 'gota.png',        points: -10, size: 160 };
const CLOCK_ITEM    = { src: R + 'reloj.gif',       size: 170 };

const MAX_LIVES   = 4;
const BEE_SPEED   = 16;
const BEE_SIZE    = 300;          // tamaño máximo (lado mayor)
const BEE_Y       = CANVAS_H - 240;

// Duración de frames especiales
const FRAME_WINK_DURATION = 240;
const FRAME_SAD_DURATION  = 550;

// Frases visuales (globito)
const SPEECHES = {
    left: [
        "¡Giro a la izquierda!",
        "¡Giro izquierda!",
        "¡Voy girando a la izquierda!",
        "¡A la izquierda! ¡Zum!"
    ],
    right: [
        "¡Giro a la derecha!",
        "¡Giro derecha!",
        "¡Voy girando a la derecha!",
        "¡A la derecha! ¡Zum!"
    ]
};

// Palabras para la VOZ IA
const VOICE_WORDS = {
    left:  ["giro a la izquierda", "giro a la izquierda", "giro izquierda"],
    right: ["giro a la derecha",   "giro a la derecha",   "giro derecha"]
};

const SPEECH_COOLDOWN = 1600;
const SPEECH_DURATION = 1200;
const VOICE_COOLDOWN  = 1400;

const TIME_WARNING_THRESHOLD = 10;
const CLOCK_BONUS_MIN = 5;
const CLOCK_BONUS_MAX = 10;

/* =========================================================
   2. ESTADO
   ========================================================= */
const state = {
    score: 0,
    levelScore: 0,
    lives: MAX_LIVES,
    levelIndex: 0,
    selectedLevel: 0,
    flowersCollected: 0,
    dropsDodged: 0,
    objects: [],
    counters: { flor1: 0, flor2: 0, flor3: 0, golden: 0, rain: 0 },

    timeLeft: 70,
    clocksSpawned: 0,
    clocksTotalThisLevel: 0,

    bee: { x: CANVAS_W / 2, y: BEE_Y, dir: 0, frame: 'happy', drawW: BEE_SIZE, drawH: BEE_SIZE },
    keys: { left: false, right: false },
    currentWind: 0,
    lastSpawn: 0,
    lastSpeech: 0,
    lastVoice: 0,
    speechTimeout: null,
    frameTimeout: null,

    running: false,
    paused: false,
    lastTime: 0,
    timeWarningShown: false,

    soundEnabled: true,
    audioCtx: null
};

/* =========================================================
   3. CARGA DE IMÁGENES
   ========================================================= */
const images = {};
const IMAGE_LIST = [
    'beebot1.png', 'beebot2.png', 'abeja-triste.png',
    'flor1.png', 'flor2.png', 'flor3.png', 'flor-dorada.png',
    'gota.png', 'reloj.gif',
    'corazon.png', 'icono-flor.png', 'viento.png'
];

function loadImages() {
    return Promise.all(
        IMAGE_LIST.map(name => new Promise(resolve => {
            const img = new Image();
            img.onload  = () => { images[R + name] = img; resolve(); };
            img.onerror = () => { images[R + name] = null; resolve(); };
            img.src = R + name;
        }))
    );
}

/* =========================================================
   4. DOM
   ========================================================= */
const dom = {
    canvas: document.getElementById('game-canvas'),
    ctx:    null,

    hudLevel:      document.getElementById('hud-level-value'),
    hudScore:      document.getElementById('hud-score-value'),
    hudScore2:     document.getElementById('hud-score-value-2'),
    hudGoal2:      document.getElementById('hud-goal-value-2'),
    hudTimerValue: document.getElementById('hud-timer-value'),
    hudTimerBox:   document.getElementById('hud-timer-box'),
    livesContainer: document.getElementById('lives-container'),

    progressFill: document.getElementById('progress-fill'),

    countFlor1:  document.getElementById('count-flor1'),
    countFlor2:  document.getElementById('count-flor2'),
    countFlor3:  document.getElementById('count-flor3'),
    countGolden: document.getElementById('count-golden'),
    countRain:   document.getElementById('count-rain'),

    scorePopups: document.getElementById('score-popups'),

    btnLeft:  document.getElementById('btn-left'),
    btnRight: document.getElementById('btn-right'),
    btnPause: document.getElementById('btn-pause'),
    btnQuit:  document.getElementById('btn-quit'),
    btnMute:  document.getElementById('btn-mute'),

    speech:     document.getElementById('bee-speech'),
    speechText: document.getElementById('bee-speech-text'),
    toast:      document.getElementById('level-up-toast'),
    toastText:  document.getElementById('level-up-text'),
    timeWarning:     document.getElementById('time-warning'),
    timeGainedToast: document.getElementById('time-gained-toast'),
    timeGainedText:  document.getElementById('time-gained-text'),
    windIndicator:   document.getElementById('wind-indicator'),
    windDirection:   document.getElementById('wind-direction'),

    pauseOverlay: document.getElementById('pause-overlay'),
    btnResume:    document.getElementById('btn-resume'),
    btnPauseMenu: document.getElementById('btn-pause-menu'),

    introModal:   document.getElementById('intro-modal'),
    btnSkipIntro: document.getElementById('btn-skip-intro'),
    introPanels:  document.querySelectorAll('.intro-panel'),
    dots:         document.querySelectorAll('.dot'),
    nextBtns:     document.querySelectorAll('.modal-next'),
    prevBtns:     document.querySelectorAll('.modal-prev'),

    levelBtns: document.querySelectorAll('.level-btn'),
    btnStart:  document.getElementById('btn-start'),

    endModal:   document.getElementById('end-modal'),
    endTitle:   document.getElementById('end-title'),
    endScore:   document.getElementById('end-score'),
    endLevel:   document.getElementById('end-level'),
    endFlowers: document.getElementById('end-flowers'),
    endDodged:  document.getElementById('end-dodged'),
    endMessage: document.getElementById('end-message'),
    endBeeImg:  document.getElementById('end-bee-img'),
    btnRetry:   document.getElementById('btn-retry'),
    btnMenu:    document.getElementById('btn-menu')
};

/* =========================================================
   5. UTILIDADES
   ========================================================= */
const rand    = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const choice  = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp   = (v, a, b) => Math.max(a, Math.min(b, v));

function weightedFlower() {
    const r = Math.random();
    let acc = 0;
    for (const f of FLOWERS) {
        acc += f.weight;
        if (r <= acc) return f;
    }
    return FLOWERS[0];
}

/* =========================================================
   6. AUDIO (Web Audio API)
   ========================================================= */
function initAudio() {
    if (state.audioCtx) {
        if (state.audioCtx.state === 'suspended') {
            state.audioCtx.resume().catch(() => {});
        }
        return;
    }
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        state.audioCtx = new Ctx();
        if (state.audioCtx.state === 'suspended') {
            state.audioCtx.resume().catch(() => {});
        }
    } catch (e) {
        console.warn('AudioContext no disponible:', e);
        state.audioCtx = null;
    }
}

function playTone(freq, duration = 0.15, type = 'sine', volume = 0.15, delay = 0) {
    if (!state.soundEnabled || !state.audioCtx) return;
    const ctx = state.audioCtx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
}

function playSweep(freqStart, freqEnd, duration = 0.3, type = 'sine', volume = 0.18, delay = 0) {
    if (!state.soundEnabled || !state.audioCtx) return;
    const ctx = state.audioCtx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
}

function playArpeggio(freqs, spacing = 0.08, noteDuration = 0.18, type = 'triangle', volume = 0.14) {
    if (!state.soundEnabled || !state.audioCtx) return;
    freqs.forEach((f, i) => {
        playTone(f, noteDuration, type, volume, i * spacing);
    });
}

function playSound(name) {
    if (!state.soundEnabled) return;
    if (!state.audioCtx) initAudio();
    if (!state.audioCtx) return;

    switch (name) {
        case 'flor1':
            playTone(523.25, 0.10, 'sine', 0.14);
            playTone(659.25, 0.12, 'sine', 0.10, 0.05);
            break;
        case 'flor2':
            playTone(659.25, 0.12, 'triangle', 0.15);
            playTone(783.99, 0.15, 'triangle', 0.12, 0.06);
            break;
        case 'flor3':
            playTone(783.99, 0.12, 'triangle', 0.15);
            playTone(987.77, 0.16, 'triangle', 0.12, 0.06);
            break;
        case 'golden':
            playArpeggio([523.25, 659.25, 783.99, 1046.50], 0.07, 0.22, 'triangle', 0.13);
            break;
        case 'gota':
            playSweep(392.00, 130.81, 0.40, 'sawtooth', 0.14);
            playTone(196.00, 0.20, 'sine', 0.10, 0.15);
            break;
        case 'reloj':
            playTone(880.00, 0.05, 'square', 0.10);
            playTone(880.00, 0.05, 'square', 0.10, 0.12);
            playTone(1318.51, 0.20, 'sine', 0.14, 0.26);
            break;
        case 'btnLeft':
            playTone(440.00, 0.09, 'square', 0.10);
            break;
        case 'btnRight':
            playTone(587.33, 0.09, 'square', 0.10);
            break;
        case 'levelUp':
            playArpeggio([523.25, 659.25, 783.99, 1046.50], 0.10, 0.28, 'triangle', 0.15);
            break;
        case 'gameOver':
            playTone(392.00, 0.25, 'sine', 0.15, 0);
            playTone(349.23, 0.25, 'sine', 0.15, 0.22);
            playTone(293.66, 0.35, 'sine', 0.15, 0.44);
            playTone(261.63, 0.55, 'sine', 0.15, 0.70);
            break;
        case 'start':
            playArpeggio([392.00, 523.25, 659.25], 0.08, 0.20, 'triangle', 0.13);
            break;
        case 'click':
            playTone(700.00, 0.06, 'square', 0.08);
            break;
    }
}

/* =========================================================
   7. VOZ IA (SpeechSynthesis)
   ========================================================= */
function initVoice() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

function speak(text) {
    if (!state.soundEnabled) return;
    if (!('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang   = 'es-ES';
        u.rate   = 1.05;
        u.pitch  = 1.5;
        u.volume = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('es'));
        if (esVoice) u.voice = esVoice;
        window.speechSynthesis.speak(u);
    } catch (e) { /* silencioso */ }
}

function speakDirection(direction) {
    const now = performance.now();
    if (now - state.lastVoice < VOICE_COOLDOWN) return;
    state.lastVoice = now;
    const word = choice(direction < 0 ? VOICE_WORDS.left : VOICE_WORDS.right);
    speak(word);
}

/* =========================================================
   8. HUD
   ========================================================= */
function updateHUD() {
    const level = LEVELS[state.levelIndex];
    if (dom.hudLevel)  dom.hudLevel.textContent  = level.number;
    if (dom.hudScore)  dom.hudScore.textContent  = state.score;
    if (dom.hudScore2) dom.hudScore2.textContent = state.score;
    if (dom.hudGoal2)  dom.hudGoal2.textContent  = level.goal;
    renderLives();
    renderProgress();
    renderTimer();
}

function renderLives() {
    if (!dom.livesContainer) return;
    dom.livesContainer.innerHTML = '';
    for (let i = 0; i < MAX_LIVES; i++) {
        const img = document.createElement('img');
        img.src = R + 'corazon.png';
        img.alt = 'Vida';
        img.onerror = () => { img.style.visibility = 'hidden'; };
        if (i >= state.lives) img.classList.add('lost');
        dom.livesContainer.appendChild(img);
    }
}

function renderProgress() {
    if (!dom.progressFill) return;
    const level = LEVELS[state.levelIndex];
    const pct = clamp((state.levelScore / level.goal) * 100, 0, 100);
    dom.progressFill.style.width = pct + '%';
}

function renderTimer() {
    if (!dom.hudTimerValue) return;
    const t = Math.max(0, Math.ceil(state.timeLeft));
    dom.hudTimerValue.textContent = t;
    if (t <= TIME_WARNING_THRESHOLD) {
        dom.hudTimerBox.classList.add('critical');
    } else {
        dom.hudTimerBox.classList.remove('critical');
    }
}

/* =========================================================
   9. CONTADORES
   ========================================================= */
const counterMap = () => ({
    flor1:  dom.countFlor1,
    flor2:  dom.countFlor2,
    flor3:  dom.countFlor3,
    golden: dom.countGolden,
    rain:   dom.countRain
});

function updateCounter(key, value) {
    const el = counterMap()[key];
    if (!el) return;
    el.textContent = value;
    const row = el.closest('.counter-row');
    if (row) {
        row.classList.remove('pulse');
        void row.offsetWidth;
        row.classList.add('pulse');
    }
}

function updateAllCounters() {
    const map = counterMap();
    for (const k of Object.keys(state.counters)) {
        if (map[k]) map[k].textContent = state.counters[k];
    }
}

/* =========================================================
   10. POPUPS DE PUNTAJE
   ========================================================= */
function createPopup(text, xPercent, yPercent, type) {
    if (!dom.scorePopups) return;
    const el = document.createElement('div');
    el.className = 'score-popup' + (type ? ' ' + type : '');
    el.textContent = text;
    el.style.left = xPercent + '%';
    el.style.top  = yPercent + '%';
    dom.scorePopups.appendChild(el);
    setTimeout(() => el.remove(), 1150);
}

/* =========================================================
   11. VOZ (texto + IA)
   ========================================================= */
function beeSay(text) {
    if (!dom.speech || !dom.speechText) return;
    dom.speechText.textContent = text;
    dom.speech.classList.remove('hidden');
    dom.speech.classList.add('visible');
    if (state.speechTimeout) clearTimeout(state.speechTimeout);
    state.speechTimeout = setTimeout(() => {
        dom.speech.classList.remove('visible');
        dom.speech.classList.add('hidden');
    }, SPEECH_DURATION);
}

function maybeSpeak(direction) {
    const now = performance.now();
    if (now - state.lastSpeech >= SPEECH_COOLDOWN) {
        state.lastSpeech = now;
        beeSay(choice(direction < 0 ? SPEECHES.left : SPEECHES.right));
    }
    speakDirection(direction);
}

/* =========================================================
   12. FRAMES DE LA ABEJA
   ========================================================= */
function winkBee() {
    state.bee.frame = 'wink';
    if (state.frameTimeout) clearTimeout(state.frameTimeout);
    state.frameTimeout = setTimeout(() => {
        state.bee.frame = 'happy';
    }, FRAME_WINK_DURATION);
}

function sadBee() {
    state.bee.frame = 'sad';
    if (state.frameTimeout) clearTimeout(state.frameTimeout);
    state.frameTimeout = setTimeout(() => {
        state.bee.frame = 'happy';
    }, FRAME_SAD_DURATION);
}

/* =========================================================
   13. SPAWN
   ========================================================= */
function rollClocksTotal() {
    const level = LEVELS[state.levelIndex];
    state.clocksTotalThisLevel = randInt(level.clockMin, level.clockMax);
    state.clocksSpawned = 0;
}

function spawnObject() {
    const level = LEVELS[state.levelIndex];
    const r = Math.random();
    let obj;

    const clockAllowed =
        state.clocksSpawned < state.clocksTotalThisLevel &&
        Math.random() < level.clockChance;

    if (clockAllowed) {
        obj = { type: 'clock', src: CLOCK_ITEM.src, points: 0, size: CLOCK_ITEM.size };
        state.clocksSpawned++;
    } else if (r < level.goldenChance) {
        obj = { type: 'golden', src: GOLDEN_FLOWER.src, points: GOLDEN_FLOWER.points, size: GOLDEN_FLOWER.size };
    } else if (r < level.goldenChance + level.rainChance) {
        obj = { type: 'rain', src: RAIN_DROP.src, points: RAIN_DROP.points, size: RAIN_DROP.size };
    } else {
        const f = weightedFlower();
        obj = { type: 'flower', src: f.src, points: f.points, size: f.size, key: f.key };
    }

    const margin = 160;
    obj.x = rand(margin, CANVAS_W - margin);
    obj.y = -200;
    obj.vy = level.fallSpeed + rand(-level.speedVariance, level.speedVariance);
    obj.rot = rand(0, Math.PI * 2);
    obj.rotSpeed = rand(-0.035, 0.035);
    obj.swayPhase = rand(0, Math.PI * 2);

    state.objects.push(obj);
}

/* =========================================================
   14. UPDATE
   ========================================================= */
function update(dt) {
    const level = LEVELS[state.levelIndex];
    const bee = state.bee;
    const now = performance.now();
    const f = dt / 16.67;

    state.timeLeft -= dt / 1000;
    renderTimer();

    if (state.timeLeft <= TIME_WARNING_THRESHOLD && !state.timeWarningShown) {
        state.timeWarningShown = true;
        if (dom.timeWarning) {
            dom.timeWarning.classList.remove('hidden');
            setTimeout(() => dom.timeWarning.classList.add('hidden'), 3000);
        }
    }

    if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        renderTimer();
        endGame(false, 'time');
        return;
    }

    let dir = 0;
    if (state.keys.left)  dir -= 1;
    if (state.keys.right) dir += 1;

    if (dir !== 0) {
        bee.x += dir * BEE_SPEED * f;
        if (bee.dir !== dir) {
            bee.dir = dir;
            maybeSpeak(dir);
        }
    }

    const halfBee = bee.drawW / 2;
    bee.x = clamp(bee.x, halfBee, CANVAS_W - halfBee);

    if (level.wind > 0) {
        const windDir = Math.sin(now / 2000) > 0 ? 1 : -1;
        state.currentWind = windDir * level.wind;
        if (dom.windDirection) dom.windDirection.textContent = windDir > 0 ? '→' : '←';
    } else {
        state.currentWind = 0;
    }

    if (now - state.lastSpawn > level.spawnInterval) {
        state.lastSpawn = now;
        spawnObject();
    }

    // Hitbox de la abeja basada en su tamaño REAL dibujado
    const beeTop   = bee.y - bee.drawH * 0.42;
    const beeBot   = bee.y + bee.drawH * 0.32;
    const beeLeft  = bee.x - bee.drawW * 0.42;
    const beeRight = bee.x + bee.drawW * 0.42;

    for (let i = state.objects.length - 1; i >= 0; i--) {
        const o = state.objects[i];

        o.vy += 0.04 * f;
        o.y  += o.vy * f;
        o.x  += (state.currentWind + Math.sin(now / 800 + o.swayPhase) * 0.6) * f;
        o.rot += o.rotSpeed * f;

        if (o.x < 70)            { o.x = 70;            o.swayPhase += Math.PI; }
        if (o.x > CANVAS_W - 70) { o.x = CANVAS_W - 70; o.swayPhase += Math.PI; }

        const halfO = o.size / 2;
        const overlapX = (o.x + halfO > beeLeft) && (o.x - halfO < beeRight);
        const overlapY = (o.y + halfO > beeTop)  && (o.y - halfO < beeBot);

        if (overlapX && overlapY) {
            handleCatch(o);
            state.objects.splice(i, 1);
            continue;
        }

        if (o.y > CANVAS_H + 200) {
            if (o.type === 'rain') state.dropsDodged++;
            state.objects.splice(i, 1);
        }
    }

    if (state.levelScore >= level.goal) {
        levelUp();
    }
}

/* =========================================================
   15. CAPTURA
   ========================================================= */
function handleCatch(obj) {
    const xPct = (obj.x / CANVAS_W) * 100;
    const yPct = (obj.y / CANVAS_H) * 100;

    // GOTA
    if (obj.type === 'rain') {
        state.lives--;
        state.counters.rain++;
        const penalty = Math.abs(RAIN_DROP.points);
        state.score = Math.max(0, state.score - penalty);
        state.levelScore = Math.max(0, state.levelScore - penalty);
        sadBee();
        updateHUD();
        updateCounter('rain', state.counters.rain);
        createPopup('-' + penalty, xPct, yPct, 'rain');
        flashRed();
        playSound('gota');
        if (state.lives <= 0) endGame(false, 'lives');
        return;
    }

    // RELOJ
    if (obj.type === 'clock') {
        const bonus = randInt(CLOCK_BONUS_MIN, CLOCK_BONUS_MAX);
        state.timeLeft += bonus;
        showTimeGained(bonus);
        createPopup('+' + bonus + 's ⏱', xPct, yPct, 'clock');
        renderTimer();
        playSound('reloj');
        return;
    }

    // FLOR DORADA
    if (obj.type === 'golden') {
        const pts = GOLDEN_FLOWER.points * 3;
        state.score += pts;
        state.levelScore += pts;
        state.flowersCollected++;
        state.counters.golden++;
        updateCounter('golden', state.counters.golden);
        createPopup('+' + pts, xPct, yPct, 'golden');
        winkBee();
        updateHUD();
        playSound('golden');
        return;
    }

    // FLOR NORMAL
    const pts = obj.points;
    state.score += pts;
    state.levelScore += pts;
    state.flowersCollected++;
    state.counters[obj.key]++;
    updateCounter(obj.key, state.counters[obj.key]);
    createPopup('+' + pts, xPct, yPct, '');
    winkBee();
    updateHUD();
    playSound(obj.key);
}

function showTimeGained(seconds) {
    if (!dom.timeGainedToast || !dom.timeGainedText) return;
    dom.timeGainedText.textContent = `+${seconds}s ⏱`;
    dom.timeGainedToast.classList.remove('hidden');
    dom.timeGainedToast.classList.add('visible');
    setTimeout(() => {
        dom.timeGainedToast.classList.remove('visible');
        dom.timeGainedToast.classList.add('hidden');
    }, 1200);
}

function flashRed() {
    if (!dom.canvas) return;
    dom.canvas.style.transition = 'filter 0.1s ease-in';
    dom.canvas.style.filter = 'brightness(1.5) saturate(2) hue-rotate(-30deg)';
    setTimeout(() => {
        dom.canvas.style.transition = 'filter 0.4s ease-out';
        dom.canvas.style.filter = '';
    }, 100);
}

/* =========================================================
   16. SUBIR NIVEL
   ========================================================= */
function levelUp() {
    state.running = false;

    if (state.levelIndex >= LEVELS.length - 1) {
        endGame(true, 'complete');
        return;
    }

    playSound('levelUp');

    if (dom.toastText) dom.toastText.textContent = `¡Nivel ${LEVELS[state.levelIndex].number} superado! 🌸`;
    if (dom.toast) {
        dom.toast.classList.remove('hidden');
        dom.toast.classList.add('visible');
    }

    setTimeout(() => {
        if (dom.toast) {
            dom.toast.classList.remove('visible');
            dom.toast.classList.add('hidden');
        }

        state.levelIndex++;
        state.levelScore = 0;
        state.objects = [];
        state.bee.x = CANVAS_W / 2;
        state.bee.dir = 0;
        state.bee.frame = 'happy';
        state.lastSpawn = 0;
        state.timeLeft = LEVELS[state.levelIndex].time;
        state.timeWarningShown = false;
        rollClocksTotal();

        if (LEVELS[state.levelIndex].wind > 0 && dom.windIndicator) {
            dom.windIndicator.classList.remove('hidden');
        }

        updateHUD();

        state.running = true;
        state.lastTime = performance.now();
        requestAnimationFrame(loop);

        beeSay(`¡Nivel ${LEVELS[state.levelIndex].number}!`);
    }, 2200);
}

/* =========================================================
   17. PAUSA
   ========================================================= */
function pauseGame() {
    if (state.paused || !state.running) return;
    state.paused = true;
    state.running = false;
    if (dom.pauseOverlay) dom.pauseOverlay.classList.remove('hidden');
    playSound('click');
}

function resumeGame() {
    if (!state.paused) return;
    state.paused = false;
    if (dom.pauseOverlay) dom.pauseOverlay.classList.add('hidden');
    state.running = true;
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
    playSound('click');
}

function togglePause() {
    if (state.paused) resumeGame();
    else pauseGame();
}

function quitToMenu() {
    state.running = false;
    state.paused = false;
    state.objects = [];

    if (dom.pauseOverlay)  dom.pauseOverlay.classList.add('hidden');
    if (dom.windIndicator) dom.windIndicator.classList.add('hidden');
    if (dom.toast)         { dom.toast.classList.add('hidden'); dom.toast.classList.remove('visible'); }
    if (dom.speech)        { dom.speech.classList.add('hidden'); dom.speech.classList.remove('visible'); }
    if (dom.timeWarning)   dom.timeWarning.classList.add('hidden');
    if (dom.timeGainedToast) { dom.timeGainedToast.classList.add('hidden'); dom.timeGainedToast.classList.remove('visible'); }
    if (dom.endModal)      dom.endModal.classList.add('hidden');
    if (dom.introModal)    dom.introModal.classList.remove('hidden');

    showIntroPanel(1);
    playSound('click');
}

/* =========================================================
   18. FIN DEL JUEGO
   ========================================================= */
function endGame(won, reason) {
    state.running = false;
    state.paused = false;

    if (won) {
        if (dom.endTitle) dom.endTitle.textContent = '¡Primavera completada! 🌷';
        if (dom.endBeeImg) dom.endBeeImg.src = R + 'beebot1.png';
        playSound('levelUp');
    } else if (reason === 'time') {
        if (dom.endTitle) dom.endTitle.textContent = '¡Se acabó el tiempo! ⏱';
        if (dom.endBeeImg) dom.endBeeImg.src = R + 'abeja-triste.png';
        playSound('gameOver');
    } else {
        if (dom.endTitle) dom.endTitle.textContent = '¡Sin vidas! 🌧️';
        if (dom.endBeeImg) dom.endBeeImg.src = R + 'abeja-triste.png';
        playSound('gameOver');
    }

    if (dom.endBeeImg) {
        dom.endBeeImg.onerror = () => { dom.endBeeImg.src = R + 'beebot1.png'; };
    }

    if (dom.endScore)   dom.endScore.textContent   = state.score;
    if (dom.endLevel)   dom.endLevel.textContent   = LEVELS[state.levelIndex].number;
    if (dom.endFlowers) dom.endFlowers.textContent = state.flowersCollected;
    if (dom.endDodged)  dom.endDodged.textContent  = state.dropsDodged;

    if (dom.endMessage) {
        if (won) {
            dom.endMessage.textContent = '¡Eres una abeja maestra! Recolectaste toda la primavera 🌻';
        } else if (state.score >= 300) {
            dom.endMessage.textContent = '¡Casi lo logras! Las flores te esperan 🌸';
        } else if (state.score >= 150) {
            dom.endMessage.textContent = '¡Muy bien! Sigue practicando 🌱';
        } else {
            dom.endMessage.textContent = '¡Buen intento! Vuelve a intentarlo 🌷';
        }
    }

    if (dom.endModal) dom.endModal.classList.remove('hidden');
}

/* =========================================================
   19. RENDER
   ========================================================= */
function render() {
    const ctx = dom.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // ----- Objetos (flores, gotas, relojes…) -----
    for (const o of state.objects) {
        const img = images[o.src];
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot);

        if (o.type === 'clock' || o.type === 'golden') {
            const halo = o.type === 'clock'
                ? 'rgba(120, 200, 255, 0.6)'
                : 'rgba(255, 215, 0, 0.6)';
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, o.size * 0.9);
            grd.addColorStop(0, halo);
            grd.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(0, 0, o.size * 0.9, 0, Math.PI * 2);
            ctx.fill();
        }

        if (img) {
            ctx.drawImage(img, -o.size / 2, -o.size / 2, o.size, o.size);
        } else {
            ctx.fillStyle = o.type === 'rain'   ? '#6CB4E8'
                          : o.type === 'golden' ? '#F4B400'
                          : o.type === 'clock'  ? '#A8E6FF'
                          :                       '#FF9DC4';
            ctx.beginPath();
            ctx.arc(0, 0, o.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // ----- Abeja (con relación de aspecto correcta) -----
    const bee = state.bee;
    let beeSrc = 'beebot1.png';
    if (bee.frame === 'wink') beeSrc = 'beebot2.png';
    if (bee.frame === 'sad')  beeSrc = 'abeja-triste.png';
    const beeImg = images[R + beeSrc];

    ctx.save();
    ctx.translate(bee.x, bee.y);

    // Sombra bajo la abeja
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, bee.drawH * 0.48, bee.drawW * 0.55, bee.drawH * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (bee.dir < 0) ctx.scale(-1, 1);

    if (beeImg && beeImg.naturalWidth && beeImg.naturalHeight) {
        // ⭐ CLAVE: preservar relación de aspecto real de la imagen
        const aspect = beeImg.naturalHeight / beeImg.naturalWidth;
        let dw = BEE_SIZE;
        let dh = BEE_SIZE * aspect;

        // Si la imagen es más alta que ancha, ajustamos
        if (dh > BEE_SIZE) {
            dh = BEE_SIZE;
            dw = BEE_SIZE / aspect;
        }

        // Guardamos dimensiones reales para la hitbox
        bee.drawW = dw;
        bee.drawH = dh;

        ctx.drawImage(beeImg, -dw / 2, -dh / 2, dw, dh);
    } else {
        // Fallback dibujado
        bee.drawW = BEE_SIZE;
        bee.drawH = BEE_SIZE;
        ctx.fillStyle = '#F4B400';
        ctx.beginPath();
        ctx.arc(0, 0, BEE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

/* =========================================================
   20. LOOP
   ========================================================= */
function loop(timestamp) {
    if (!state.running) return;

    const dt = Math.min(timestamp - (state.lastTime || timestamp), 50);
    state.lastTime = timestamp;

    update(dt);
    render();

    if (state.running) requestAnimationFrame(loop);
}

/* =========================================================
   21. INPUT
   ========================================================= */
function bindMoveButton(btn, side) {
    if (!btn) return;

    const press = (e) => {
        e.preventDefault();
        initAudio();

        state.keys[side] = true;
        btn.classList.add('pressed');
        const dir = side === 'left' ? -1 : 1;

        playSound(side === 'left' ? 'btnLeft' : 'btnRight');

        if (state.bee.dir !== dir) {
            state.bee.dir = dir;
            maybeSpeak(dir);
        }
    };
    const release = (e) => {
        if (e) e.preventDefault();
        state.keys[side] = false;
        btn.classList.remove('pressed');
    };

    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('contextmenu', e => e.preventDefault());
    btn.addEventListener('dragstart',   e => e.preventDefault());
}

function setupInput() {
    window.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a') {
            if (!state.keys.left) {
                state.keys.left = true;
                initAudio();
                playSound('btnLeft');
                if (state.bee.dir !== -1) {
                    state.bee.dir = -1;
                    maybeSpeak(-1);
                }
            }
            e.preventDefault();
        }
        if (k === 'arrowright' || k === 'd') {
            if (!state.keys.right) {
                state.keys.right = true;
                initAudio();
                playSound('btnRight');
                if (state.bee.dir !== 1) {
                    state.bee.dir = 1;
                    maybeSpeak(1);
                }
            }
            e.preventDefault();
        }
        if (k === 'p' || k === 'escape') togglePause();
    });

    window.addEventListener('keyup', e => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft'  || k === 'a') state.keys.left  = false;
        if (k === 'arrowright' || k === 'd') state.keys.right = false;
    });

    bindMoveButton(dom.btnLeft,  'left');
    bindMoveButton(dom.btnRight, 'right');
}

/* =========================================================
   22. MODAL DE INTRODUCCIÓN
   ========================================================= */
function showIntroPanel(n) {
    dom.introPanels.forEach(p => {
        p.classList.toggle('active', parseInt(p.dataset.panel) === n);
    });
    dom.dots.forEach(d => {
        d.classList.toggle('active', parseInt(d.dataset.dot) === n);
    });
}

function setupIntroModal() {
    dom.nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            showIntroPanel(parseInt(btn.dataset.next, 10));
        });
    });

    dom.prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            showIntroPanel(parseInt(btn.dataset.prev, 10));
        });
    });

    dom.dots.forEach(d => {
        d.addEventListener('click', () => {
            playSound('click');
            showIntroPanel(parseInt(d.dataset.dot, 10));
        });
    });

    if (dom.btnSkipIntro) {
        dom.btnSkipIntro.addEventListener('click', () => {
            initAudio();
            playSound('start');
            dom.introModal.classList.add('hidden');
            startGame();
        });
    }
}

/* =========================================================
   23. SELECTOR DE NIVEL
   ========================================================= */
function setupLevelSelector() {
    dom.levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            dom.levelBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selectedLevel = parseInt(btn.dataset.level, 10);
        });
    });
}

/* =========================================================
   24. MUTE
   ========================================================= */
function setupMuteButton() {
    if (!dom.btnMute) return;

    dom.btnMute.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;

        if (state.soundEnabled) {
            dom.btnMute.textContent = '🔊';
            dom.btnMute.classList.remove('muted');
            dom.btnMute.title = 'Silenciar sonidos';
            playSound('click');
        } else {
            dom.btnMute.textContent = '🔇';
            dom.btnMute.classList.add('muted');
            dom.btnMute.title = 'Activar sonidos';
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        }
    });
}

/* =========================================================
   25. START GAME
   ========================================================= */
function startGame() {
    dom.introModal.classList.add('hidden');
    dom.endModal.classList.add('hidden');

    state.score = 0;
    state.levelScore = 0;
    state.lives = MAX_LIVES;
    state.levelIndex = state.selectedLevel;
    state.flowersCollected = 0;
    state.dropsDodged = 0;
    state.objects = [];
    state.counters = { flor1: 0, flor2: 0, flor3: 0, golden: 0, rain: 0 };
    updateAllCounters();

    state.bee.x = CANVAS_W / 2;
    state.bee.y = BEE_Y;
    state.bee.dir = 0;
    state.bee.frame = 'happy';
    state.keys.left = false;
    state.keys.right = false;
    state.currentWind = 0;
    state.lastSpawn = 0;
    state.lastSpeech = 0;
    state.lastVoice = 0;
    state.paused = false;
    state.timeWarningShown = false;

    state.timeLeft = LEVELS[state.levelIndex].time;
    rollClocksTotal();

    if (dom.windIndicator)   dom.windIndicator.classList.add('hidden');
    if (dom.toast)           { dom.toast.classList.add('hidden'); dom.toast.classList.remove('visible'); }
    if (dom.speech)          { dom.speech.classList.add('hidden'); dom.speech.classList.remove('visible'); }
    if (dom.pauseOverlay)    dom.pauseOverlay.classList.add('hidden');
    if (dom.timeWarning)     dom.timeWarning.classList.add('hidden');
    if (dom.timeGainedToast) { dom.timeGainedToast.classList.add('hidden'); dom.timeGainedToast.classList.remove('visible'); }

    if (LEVELS[state.levelIndex].wind > 0 && dom.windIndicator) {
        dom.windIndicator.classList.remove('hidden');
    }

    updateHUD();
    updateAllCounters();

    dom.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    playSound('start');

    state.running = true;
    state.lastTime = performance.now();
    requestAnimationFrame(loop);

    setTimeout(() => beeSay('¡A recolectar flores!'), 400);
}

/* =========================================================
   26. INIT
   ========================================================= */
async function init() {
    dom.ctx = dom.canvas.getContext('2d');
    dom.canvas.width  = CANVAS_W;
    dom.canvas.height = CANVAS_H;

    setupInput();
    setupIntroModal();
    setupLevelSelector();
    setupMuteButton();

    if (dom.btnStart) {
        dom.btnStart.addEventListener('click', () => {
            initAudio();
            playSound('start');
            startGame();
        });
    }

    if (dom.btnRetry) {
        dom.btnRetry.addEventListener('click', () => {
            playSound('click');
            startGame();
        });
    }

    if (dom.btnMenu)    dom.btnMenu.addEventListener('click', quitToMenu);
    if (dom.btnPause)   dom.btnPause.addEventListener('click', pauseGame);
    if (dom.btnResume)  dom.btnResume.addEventListener('click', resumeGame);
    if (dom.btnPauseMenu) dom.btnPauseMenu.addEventListener('click', quitToMenu);
    if (dom.btnQuit)    dom.btnQuit.addEventListener('click', quitToMenu);

    showIntroPanel(1);
    initVoice();

    await loadImages();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}