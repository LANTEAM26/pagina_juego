/* ============================================================
   CIUDAD SEGURA · script.js
   Semáforo automático · Autos · Lucas con giros · 5 niveles · DUA
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================
     1. REFERENCIAS AL DOM
  ========================================================== */
  const $ = id => document.getElementById(id);

  const panels = {
    start: $('panel-start'),
    how:   $('panel-how'),
    game:  $('panel-game'),
    win:   $('panel-win'),
    lose:  $('panel-lose'),
    help:  $('panel-help'),
  };

  const btnPlay       = $('btn-play');
  const btnHow        = $('btn-how');
  const btnBack       = $('btn-back');
  const btnGo         = $('btn-go');
  const btnHelp       = $('btn-help');
  const btnHelpClose  = $('btn-help-close');
  const btnHome       = $('btn-home');
  const btnSound      = $('btn-sound');
  const iconSound     = $('icon-sound');

  const hudLevel      = $('hud-level');
  const hudLives      = $('hud-lives');
  const hudPoints     = $('hud-points');
  const hudCrossings  = $('hud-crossings');
  const topbarLevel   = $('topbar-level');

  const ctrlBtns      = document.querySelectorAll('.ctrl');
  const levelCards    = document.querySelectorAll('.level-card');

  const signal        = $('signal');
  const lightRed      = $('light-red');
  const lightYellow   = $('light-yellow');
  const lightGreen    = $('light-green');
  const signalStatus  = $('signal-status');
  const signalHint    = $('signal-hint');
  const signalTimerBar= $('signal-timer-bar');

  const boardGrid     = $('board-grid');

  const feedback      = $('feedback');
  const feedbackIcon  = $('feedback-icon');
  const feedbackText  = $('feedback-text');

  const winStars      = document.querySelectorAll('#win-stars .star');
  const winLevel      = $('win-level');
  const winCrossings  = $('win-crossings');
  const winPoints     = $('win-points');
  const winMessage    = $('win-message');
  const winFamily     = $('win-family');
  const btnWinNext    = $('btn-win-next');
  const btnWinAgain   = $('btn-win-again');
  const btnWinHome    = $('btn-win-home');

  const loseStars     = document.querySelectorAll('#lose-stars .star');
  const loseLevel     = $('lose-level');
  const loseCrossings = $('lose-crossings');
  const losePoints    = $('lose-points');
  const loseMessage   = $('lose-message');
  const loseTip       = $('lose-tip');
  const btnLoseAgain  = $('btn-lose-again');
  const btnLoseHome   = $('btn-lose-home');

  const sfx = {
    click:   $('sfx-click'),
    correct: $('sfx-correct'),
    wrong:   $('sfx-wrong'),
    win:     $('sfx-win'),
    lose:    $('sfx-lose'),
    step:    $('sfx-step'),
    crash:   $('sfx-crash'),
  };

  /* ==========================================================
     2. CONFIGURACIÓN DE NIVELES
        Mapa por filas (arriba → abajo). Letras:
          B = edificio
          . = acera
          = = calle horizontal
          | = calle vertical
          @ = inicio (acera)
          G = meta (casa + familia)
  ========================================================== */
  const LEVELS = [
    {
      name: 'Calle tranquila',
      map: [
        'BBBBBBB',
        'B.....G',
        'B.B.B.B',
        'B=====B',
        'B.B.B.B',
        'B.....B',
        'B@....B',
      ],
      cars: [
        { row: 3, dir: 1,  speed: 0.0020, pos: 0.00 },
        { row: 3, dir: -1, speed: 0.0018, pos: 0.65 },
      ],
      signal: { green: 5500, yellow: 1800, red: 6500 },
    },
    {
      name: 'Cruce ocupado',
      map: [
        'BBBBBBB',
        'B.....G',
        'B.B.B.B',
        'B=====B',
        'B.B.B.B',
        'B.....B',
        'B@....B',
      ],
      cars: [
        { row: 3, dir: 1,  speed: 0.0024, pos: 0.00 },
        { row: 3, dir: -1, speed: 0.0022, pos: 0.55 },
        { row: 3, dir: 1,  speed: 0.0020, pos: 0.85 },
      ],
      signal: { green: 5000, yellow: 1600, red: 6000 },
    },
    {
      name: 'Hora punta',
      map: [
        'BBBBBBB',
        'B.....G',
        'B=====B',
        'B.B.B.B',
        'B=====B',
        'B.....B',
        'B@....B',
      ],
      cars: [
        { row: 2, dir: 1,  speed: 0.0028, pos: 0.00 },
        { row: 2, dir: -1, speed: 0.0024, pos: 0.55 },
        { row: 4, dir: 1,  speed: 0.0030, pos: 0.20 },
        { row: 4, dir: -1, speed: 0.0022, pos: 0.75 },
      ],
      signal: { green: 4500, yellow: 1500, red: 5500 },
    },
    {
      name: 'Doble vía',
      map: [
        'BBBBBBB',
        'B.....G',
        'B=====B',
        'B=====B',
        'B.B.B.B',
        'B.....B',
        'B@....B',
      ],
      cars: [
        { row: 2, dir: 1,  speed: 0.0032, pos: 0.00 },
        { row: 2, dir: -1, speed: 0.0030, pos: 0.50 },
        { row: 3, dir: 1,  speed: 0.0034, pos: 0.30 },
        { row: 3, dir: -1, speed: 0.0028, pos: 0.80 },
        { row: 3, dir: 1,  speed: 0.0024, pos: 0.60 },
      ],
      signal: { green: 4200, yellow: 1400, red: 5200 },
    },
    {
      name: 'Gran ciudad',
      map: [
        'BBBBBBB',
        'B.....G',
        'B=====B',
        'B=====B',
        'B=====B',
        'B.....B',
        'B@....B',
      ],
      cars: [
        { row: 2, dir: 1,  speed: 0.0036, pos: 0.00 },
        { row: 2, dir: -1, speed: 0.0034, pos: 0.55 },
        { row: 3, dir: 1,  speed: 0.0040, pos: 0.25 },
        { row: 3, dir: -1, speed: 0.0032, pos: 0.75 },
        { row: 4, dir: 1,  speed: 0.0038, pos: 0.10 },
        { row: 4, dir: -1, speed: 0.0036, pos: 0.65 },
      ],
      signal: { green: 4000, yellow: 1300, red: 5000 },
    },
  ];

  /* ==========================================================
     3. ESTADO Y CONSTANTES
  ========================================================== */
  const DIR_DELTA  = [
    { dx: 0,  dy: -1 }, // 0 arriba
    { dx: 1,  dy: 0  }, // 1 derecha
    { dx: 0,  dy: 1  }, // 2 abajo
    { dx: -1, dy: 0  }, // 3 izquierda
  ];
  const DIR_LABELS = ['⬆️', '➡️', '⬇️', '⬅️'];
  const DIR_NAMES  = ['arriba', 'derecha', 'abajo', 'izquierda'];
  const CAR_EMOJIS = ['🚗', '🚙', '🚕', '🚌', '🚓', '🚐'];
  const BUILDING_EMOJIS = ['🏢', '🏬', '🏦', '🏨', '🏪'];
  const BUILDING_COLORS = ['pink', 'yellow', 'blue', 'green', 'lilac'];

  const STORAGE_KEY = 'ciudad-segura-progress';

  const state = {
    selectedLevel: 1,
    levelIdx:      0,
    lives:         3,
    points:        0,
    crossings:     0,
    lucas:         { x: 1, y: 6, dir: 0 },
    start:         { x: 1, y: 6 },
    goal:          { x: 6, y: 1 },
    rows:          7,
    cols:          7,
    signal:        'green',
    playing:       false,
    sound:         true,
    moveLocked:    false,
    cars:          [],
    lucasEl:       null,
    carsLayer:     null,
    fxLayer:       null,
    signalTimeout: null,
    signalCountdown: null,
    carsRaf:       null,
    lastFrame:     0,
    maxLevelDone:  0,
  };

  /* ==========================================================
     4. UTILIDADES
  ========================================================== */
  function play(name) {
    if (!state.sound) return;
    const a = sfx[name];
    if (!a) return;
    try {
      a.currentTime = 0;
      a.volume = 0.55;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (_) {}
  }

  function showPanel(key) {
    Object.values(panels).forEach(p => p.classList.remove('panel--active'));
    if (panels[key]) panels[key].classList.add('panel--active');
  }

  function cellAt(x, y) {
    return boardGrid.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  }

  function cellType(x, y) {
    const c = cellAt(x, y);
    if (!c) return 'void';
    if (c.classList.contains('cell--building')) return 'building';
    if (c.classList.contains('cell--road'))     return 'road';
    if (c.classList.contains('cell--goal'))     return 'goal';
    if (c.classList.contains('cell--sidewalk')) return 'sidewalk';
    return 'unknown';
  }

  function resetStars(list) {
    list.forEach(s => s.classList.remove('is-on'));
  }

  function enableControls(on) {
    ctrlBtns.forEach(b => b.disabled = !on);
  }

  /* ==========================================================
     5. PROGRESO · localStorage
  ========================================================== */
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.maxLevelDone === 'number') {
        state.maxLevelDone = data.maxLevelDone;
      }
    } catch (_) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        maxLevelDone: state.maxLevelDone,
      }));
    } catch (_) {}
  }

  /* ==========================================================
     6. SONIDO
  ========================================================== */
  btnSound.addEventListener('click', () => {
    state.sound = !state.sound;
    btnSound.setAttribute('aria-pressed', String(state.sound));
    iconSound.textContent = state.sound ? '🔊' : '🔇';
    if (state.sound) play('click');
  });

  /* ==========================================================
     7. NAVEGACIÓN Y SELECTOR DE NIVEL
  ========================================================== */
  function goHome() {
    stopAll();
    play('click');
    showPanel('start');
  }

  function goHow() {
    play('click');
    showPanel('how');
  }

  function updateTopbarLevel(n) {
    const lv = LEVELS[n - 1];
    topbarLevel.textContent = `Nivel ${n} · ${lv ? lv.name : ''}`;
  }

  levelCards.forEach(card => {
    card.addEventListener('click', () => {
      const lv = parseInt(card.dataset.level, 10);
      state.selectedLevel = lv;
      levelCards.forEach(c => {
        const isMe = parseInt(c.dataset.level, 10) === lv;
        c.setAttribute('aria-checked', String(isMe));
      });
      play('click');
      updateTopbarLevel(lv);
    });
  });

  /* ==========================================================
     8. CONSTRUCCIÓN DEL TABLERO
  ========================================================== */
  function buildBoard(levelIdx) {
    const level = LEVELS[levelIdx];
    const map = level.map;
    const rows = map.length;
    const cols = map[0].length;

    state.rows = rows;
    state.cols = cols;

    // Limpiar
    boardGrid.innerHTML = '';
    boardGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardGrid.style.gridTemplateRows    = `repeat(${rows}, 1fr)`;

    let startX = 1, startY = rows - 1;
    let goalX  = cols - 1, goalY = 1;

    // Crear casillas
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ch = map[y][x];
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;

        if (ch === 'B') {
          cell.classList.add('cell--building');
          cell.dataset.color = BUILDING_COLORS[(x + y) % BUILDING_COLORS.length];
          const emoji = BUILDING_EMOJIS[(x * 3 + y) % BUILDING_EMOJIS.length];
          cell.innerHTML = `<span>${emoji}</span>`;
        } else if (ch === '=') {
          cell.classList.add('cell--road', 'cell--road--h');
          cell.setAttribute('aria-label', 'Calle');
        } else if (ch === '|') {
          cell.classList.add('cell--road', 'cell--road--v');
          cell.setAttribute('aria-label', 'Calle');
        } else if (ch === 'G') {
          cell.classList.add('cell--goal');
          cell.innerHTML =
            '<span class="cell__house">🏠</span>' +
            '<span class="cell__family">👨‍👩‍👧</span>' +
            '<span class="cell__label">META</span>';
          goalX = x;
          goalY = y;
        } else if (ch === '@') {
          cell.classList.add('cell--sidewalk', 'cell--start');
          startX = x;
          startY = y;
        } else {
          cell.classList.add('cell--sidewalk');
        }

        boardGrid.appendChild(cell);
      }
    }

    // Capa de autos
    const carsLayer = document.createElement('div');
    carsLayer.className = 'cars-layer';
    carsLayer.id = 'cars-layer';
    boardGrid.appendChild(carsLayer);

    // Ficha de Lucas
    const lucasEl = document.createElement('div');
    lucasEl.className = 'lucas';
    lucasEl.id = 'lucas';
    lucasEl.setAttribute('aria-label', 'Lucas');
    lucasEl.innerHTML =
      '<span class="lucas__char" aria-hidden="true">🧒</span>' +
      '<span class="lucas__dir" id="lucas-dir" aria-hidden="true">⬆️</span>' +
      '<span class="lucas__shadow" aria-hidden="true"></span>';
    boardGrid.appendChild(lucasEl);

    // Capa de efectos
    const fxLayer = document.createElement('div');
    fxLayer.className = 'fx-layer';
    fxLayer.id = 'fx-layer';
    boardGrid.appendChild(fxLayer);

    // Autos
    state.cars = level.cars.map((c, i) => {
      const el = document.createElement('div');
      el.className = 'car';
      el.textContent = CAR_EMOJIS[i % CAR_EMOJIS.length];
      carsLayer.appendChild(el);
      return {
        row:   c.row,
        dir:   c.dir,
        speed: c.speed,
        pos:   c.pos,
        el,
      };
    });

    state.lucasEl   = lucasEl;
    state.carsLayer = carsLayer;
    state.fxLayer   = fxLayer;
    state.start = { x: startX, y: startY };
    state.goal  = { x: goalX,  y: goalY };
  }

  /* ==========================================================
     9. POSICIONAMIENTO
  ========================================================== */
  function positionLucas() {
    if (!state.lucasEl) return;
    const cell = cellAt(state.lucas.x, state.lucas.y);
    if (!cell) return;
    const gr = boardGrid.getBoundingClientRect();
    const cr = cell.getBoundingClientRect();
    const lw = state.lucasEl.offsetWidth  || 40;
    const lh = state.lucasEl.offsetHeight || 40;
    const x = cr.left - gr.left + (cr.width  - lw) / 2;
    const y = cr.top  - gr.top  + (cr.height - lh) / 2;
    state.lucasEl.style.transform = `translate(${x}px, ${y}px)`;
    state.lucasEl.style.setProperty('--lx', x + 'px');
    state.lucasEl.style.setProperty('--ly', y + 'px');
  }

  function positionCars() {
    const gr = boardGrid.getBoundingClientRect();
    if (!gr.width || !gr.height) return;
    const cellW = gr.width  / state.cols;
    const cellH = gr.height / state.rows;

    for (const car of state.cars) {
      const el = car.el;
      if (!el) continue;
      const rowY = cellH * car.row + cellH / 2;
      const leftPx = car.pos * gr.width;

      el.style.left = leftPx + 'px';
      el.style.top  = rowY + 'px';
      el.style.transform =
        `translate(-50%, -50%) ${car.dir > 0 ? 'scaleX(-1)' : ''}`;
    }
  }

  function updateDirUI() {
    const el = state.lucasEl ? state.lucasEl.querySelector('.lucas__dir') : null;
    if (el) el.textContent = DIR_LABELS[state.lucas.dir];
    if (state.lucasEl) {
      state.lucasEl.setAttribute(
        'aria-label',
        `Lucas, dirección ${DIR_NAMES[state.lucas.dir]}`
      );
    }
  }

  /* ==========================================================
     10. HUD / FEEDBACK / FX
  ========================================================== */
  function updateHUD() {
    hudLevel.textContent     = state.selectedLevel;
    hudLives.textContent     = '❤️'.repeat(Math.max(0, state.lives)) +
                               '🖤'.repeat(Math.max(0, 3 - state.lives));
    hudPoints.textContent    = state.points;
    hudCrossings.textContent = state.crossings;
    updateTopbarLevel(state.selectedLevel);
  }

  function setFeedback(type, icon, text) {
    feedback.classList.remove('is-correct', 'is-wrong');
    if (type === 'correct') feedback.classList.add('is-correct');
    if (type === 'wrong')   feedback.classList.add('is-wrong');
    feedbackIcon.textContent = icon;
    feedbackText.textContent = text;
  }

  function clearFeedback() {
    feedback.classList.remove('is-correct', 'is-wrong');
    feedbackIcon.textContent = '🏙️';
    feedbackText.textContent = '¡Prepárate para cruzar!';
  }

  function spawnFx(text, color) {
    if (!state.fxLayer || !state.lucasEl) return;
    const el = document.createElement('div');
    el.className = 'fx-float';
    el.textContent = text;
    el.style.color = color || '#143046';

    const lr = state.lucasEl.getBoundingClientRect();
    const fr = state.fxLayer.getBoundingClientRect();
    el.style.left = (lr.left - fr.left + lr.width  / 2 - 20) + 'px';
    el.style.top  = (lr.top  - fr.top  - 10) + 'px';

    state.fxLayer.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  /* ==========================================================
     11. SEMÁFORO AUTOMÁTICO
  ========================================================== */
  function setSignalColor(color, startCycle = true) {
    const prev = state.signal;
    state.signal = color;

    [lightRed, lightYellow, lightGreen].forEach(l => l.classList.remove('is-on'));
    if (color === 'red')    lightRed.classList.add('is-on');
    if (color === 'yellow') lightYellow.classList.add('is-on');
    if (color === 'green')  lightGreen.classList.add('is-on');

    signal.setAttribute('aria-label', `Semáforo en ${color}`);

    signalStatus.classList.remove('is-go', 'is-wait', 'is-stop');
    signalHint.classList.remove('is-go', 'is-stop');

    if (color === 'green') {
      signalStatus.textContent = '🚗 Autos circulando';
      signalStatus.classList.add('is-go');
      signalHint.textContent = 'Espera en la acera 🧍';
      if (state.playing) setFeedback('info', '🚗', 'Los autos circulan. Espera en la acera.');
    } else if (color === 'yellow') {
      signalStatus.textContent = '⚠️ Autos frenando';
      signalStatus.classList.add('is-wait');
      signalHint.textContent = 'Prepárate, aún no cruces';
      if (state.playing) setFeedback('info', '⚠️', 'Los autos frenan. Prepárate…');
    } else {
      signalStatus.textContent = '🛑 Autos detenidos';
      signalStatus.classList.add('is-stop');
      signalHint.classList.add('is-stop');
      signalHint.textContent = '¡Puedes cruzar! 🚶';
      if (state.playing) setFeedback('correct', '🛑', '¡Los autos están detenidos! Puedes cruzar.');
    }

    // Regla crítica: si pasa a VERDE y Lucas está en la calle → choque
    if (color === 'green' && prev === 'red' && state.playing) {
      if (cellType(state.lucas.x, state.lucas.y) === 'road') {
        hitByCar();
        return;
      }
    }

    // Si pasa a amarillo y Lucas está en la calle → advertencia
    if (color === 'yellow' && state.playing) {
      if (cellType(state.lucas.x, state.lucas.y) === 'road') {
        setFeedback('info', '⚠️', '¡Date prisa! El semáforo va a cambiar.');
      }
    }

    if (startCycle && state.playing) startSignalTimer();
  }

  function nextSignalColor() {
    if (state.signal === 'green')  return 'yellow';
    if (state.signal === 'yellow') return 'red';
    return 'green';
  }

  function startSignalTimer() {
    stopSignalTimer();

    const level = LEVELS[state.levelIdx];
    const duration = level.signal[state.signal];
    const startTime = Date.now();

    signalTimerBar.style.transition = 'none';
    signalTimerBar.style.width = '100%';
    void signalTimerBar.offsetWidth;
    signalTimerBar.style.transition = 'width .1s linear';

    state.signalCountdown = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      signalTimerBar.style.width = pct + '%';
    }, 50);

    state.signalTimeout = setTimeout(() => {
      clearInterval(state.signalCountdown);
      if (!state.playing) return;
      setSignalColor(nextSignalColor(), true);
    }, duration);
  }

  function stopSignalTimer() {
    clearTimeout(state.signalTimeout);
    clearInterval(state.signalCountdown);
    state.signalTimeout = null;
    state.signalCountdown = null;
  }

  /* ==========================================================
     12. AUTOS
  ========================================================== */
  function startCarsLoop() {
    state.lastFrame = performance.now();

    function tick(now) {
      const dt = Math.min(64, now - state.lastFrame);
      state.lastFrame = now;

      // En rojo los autos están detenidos. Verde y amarillo: se mueven.
      const canMove = (state.signal === 'green' || state.signal === 'yellow');

      if (canMove) {
        for (const car of state.cars) {
          const delta = car.speed * (dt / 16);
          if (car.dir > 0) {
            car.pos += delta;
            if (car.pos > 1.15) car.pos = -0.15;
          } else {
            car.pos -= delta;
            if (car.pos < -0.15) car.pos = 1.15;
          }
        }
      }

      positionCars();

      // Marcar brillo de frenado
      const braking = (state.signal === 'red');
      for (const car of state.cars) {
        car.el.classList.toggle('is-braking', braking);
      }

      state.carsRaf = requestAnimationFrame(tick);
    }

    cancelAnimationFrame(state.carsRaf);
    state.carsRaf = requestAnimationFrame(tick);
  }

  function stopCarsLoop() {
    cancelAnimationFrame(state.carsRaf);
    state.carsRaf = null;
  }

  /* ==========================================================
     13. CONTROLES DE LUCAS
  ========================================================== */
  function rotateLeft() {
    if (!state.playing) return;
    state.lucas.dir = (state.lucas.dir + 3) % 4;
    updateDirUI();
    play('step');
  }

  function rotateRight() {
    if (!state.playing) return;
    state.lucas.dir = (state.lucas.dir + 1) % 4;
    updateDirUI();
    play('step');
  }

  function moveForward() {
    if (!state.playing || state.moveLocked) return;

    const d  = DIR_DELTA[state.lucas.dir];
    const nx = state.lucas.x + d.dx;
    const ny = state.lucas.y + d.dy;

    // Fuera del mapa
    if (nx < 0 || nx >= state.cols || ny < 0 || ny >= state.rows) {
      setFeedback('info', '🚧', 'No puedes salir del mapa.');
      return;
    }

    const t = cellType(nx, ny);

    // Edificios bloquean
    if (t === 'building') {
      setFeedback('info', '🏢', '¡Edificio! Gira y busca otro camino.');
      play('wrong');
      return;
    }

    // Regla de la calle: solo se cruza en ROJO
    if (t === 'road') {
      if (state.signal !== 'red') {
        setFeedback('info', '🚗', '¡Espera! Solo cruza cuando el semáforo esté en ROJO.');
        play('wrong');
        return;
      }
      // Cruce válido
      state.crossings++;
      state.points += 5;
      setFeedback('correct', '🚶', '¡Muy bien! Cruzando con el semáforo en rojo.');
      play('correct');
    } else if (t === 'goal') {
      state.lucas.x = nx;
      state.lucas.y = ny;
      positionLucas();
      updateHUD();
      play('step');
      setTimeout(showWin, 500);
      return;
    } else {
      setFeedback('info', '🚶', 'Avanzando por la acera.');
    }

    // Mover
    state.lucas.x = nx;
    state.lucas.y = ny;
    state.moveLocked = true;
    positionLucas();
    play('step');
    updateHUD();

    setTimeout(() => { state.moveLocked = false; }, 320);
  }

  /* ==========================================================
     14. CHOQUE
  ========================================================== */
  function hitByCar() {
    if (!state.playing) return;
    state.playing = false;
    enableControls(false);

    play('crash');

    if (state.lucasEl) {
      state.lucasEl.classList.add('is-crash');
      setTimeout(() => state.lucasEl.classList.remove('is-crash'), 800);
    }

    spawnFx('💥', '#ff4d4d');
    state.lives--;
    updateHUD();

    setFeedback('wrong', '💥',
      '¡Un auto te golpeó! Recuerda: cruza SOLO con el semáforo en rojo.');

    setTimeout(() => {
      if (state.lives <= 0) {
        showLose();
      } else {
        // Reiniciar posición al inicio del nivel
        state.lucas.x = state.start.x;
        state.lucas.y = state.start.y;
        state.lucas.dir = 0;
        updateDirUI();
        positionLucas();
        state.playing = true;
        enableControls(true);
        setFeedback('info', '🧍', 'De vuelta al inicio. ¡Espera el rojo!');
      }
    }, 1500);
  }

  /* ==========================================================
     15. INICIO DEL JUEGO
  ========================================================== */
  function startGame() {
    play('click');
    state.levelIdx = state.selectedLevel - 1;
    resetGame();
    showPanel('game');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        positionLucas();
        positionCars();

        setTimeout(() => {
          state.playing = true;
          enableControls(true);
          setSignalColor('green', true);
          startCarsLoop();
        }, 350);
      });
    });
  }

  function resetGame() {
    stopAll();

    state.lives     = 3;
    state.points    = 0;
    state.crossings = 0;
    state.signal    = 'green';
    state.playing   = false;
    state.moveLocked= false;

    // Construir el tablero del nivel
    buildBoard(state.levelIdx);

    // Posición inicial de Lucas
    state.lucas.x = state.start.x;
    state.lucas.y = state.start.y;
    state.lucas.dir = 0;

    updateHUD();
    updateDirUI();
    clearFeedback();
    resetStars(winStars);
    resetStars(loseStars);
    enableControls(false);

    // Estado visual del semáforo (sin ciclo)
    setSignalColor('green', false);
  }

  function stopAll() {
    stopSignalTimer();
    stopCarsLoop();
    state.playing = false;
  }

  /* ==========================================================
     16. FIN DEL JUEGO
  ========================================================== */
  function calcStars() {
    if (state.lives === 3 && state.crossings >= 1) return 3;
    if (state.lives >= 2) return 2;
    return 1;
  }

  function paintStars(list, count) {
    list.forEach((s, i) => {
      s.classList.remove('is-on');
      if (i < count) {
        setTimeout(() => {
          s.classList.add('is-on');
          play('click');
        }, 320 * (i + 1));
      }
    });
  }

  function showWin() {
    stopAll();
    enableControls(false);
    play('win');

    if (state.lucasEl) state.lucasEl.classList.add('is-win');

    // Actualizar progreso
    if (state.selectedLevel > state.maxLevelDone) {
      state.maxLevelDone = state.selectedLevel;
      saveProgress();
    }

    winLevel.textContent     = state.selectedLevel;
    winCrossings.textContent = state.crossings;
    winPoints.textContent    = state.points;

    const stars = calcStars();
    paintStars(winStars, stars);

    if (stars === 3) {
      winMessage.textContent = '¡Perfecto! Lucas cruzó sin ningún choque. 🌟';
    } else if (stars === 2) {
      winMessage.textContent = '¡Muy bien! Lucas llegó seguro a casa. 🎉';
    } else {
      winMessage.textContent = '¡Lo lograste! Sigue practicando. 💪';
    }

    const preguntas = [
      '¿Por qué es importante cruzar solo con el semáforo en rojo?',
      '¿Qué pasa si cruzamos cuando los autos están circulando?',
      '¿Qué hacemos en casa para respetar el semáforo cuando salimos?',
      '¿Cómo cruzamos la calle cuando vamos de la mano?',
      '¿Qué otras señales de tránsito conoces?',
    ];
    winFamily.textContent = preguntas[Math.floor(Math.random() * preguntas.length)];

    // Mostrar botón "Siguiente nivel" solo si no es el último
    if (state.selectedLevel < LEVELS.length) {
      btnWinNext.style.display = '';
    } else {
      btnWinNext.style.display = 'none';
    }

    setTimeout(() => showPanel('win'), 900);
  }

  function showLose() {
    stopAll();
    enableControls(false);
    play('lose');

    loseLevel.textContent     = state.selectedLevel;
    loseCrossings.textContent = state.crossings;
    losePoints.textContent    = state.points;

    const stars = Math.max(0, calcStars() - 1);
    paintStars(loseStars, stars);

    loseMessage.textContent = 'Te quedaste sin vidas. ¡Inténtalo otra vez, tú puedes!';

    const tips = [
      'Cruza SOLO cuando el semáforo esté en rojo.',
      'En verde y amarillo los autos circulan. ¡Espera en la acera!',
      'Usa ↺ y ↻ para girar y buscar el camino.',
      'Los edificios bloquean el paso.',
      'Mira siempre antes de bajar a la calle.',
    ];
    loseTip.textContent = tips[Math.floor(Math.random() * tips.length)];

    showPanel('lose');
  }

  /* ==========================================================
     17. EVENTOS
  ========================================================== */
  btnPlay.addEventListener('click', startGame);
  btnHow.addEventListener('click', goHow);
  btnBack.addEventListener('click', goHome);
  btnGo.addEventListener('click', startGame);
  btnHome.addEventListener('click', goHome);

  btnHelp.addEventListener('click', () => {
    play('click');
    panels.help.classList.add('panel--active');
  });
  btnHelpClose.addEventListener('click', () => {
    play('click');
    panels.help.classList.remove('panel--active');
  });

  // Botones de control
  ctrlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.playing) return;
      play('click');
      const a = btn.dataset.action;
      if (a === 'left')    rotateLeft();
      if (a === 'right')   rotateRight();
      if (a === 'forward') moveForward();
    });
  });

  // Resultados
  btnWinAgain.addEventListener('click', startGame);
  btnWinNext.addEventListener('click', () => {
    state.selectedLevel = Math.min(LEVELS.length, state.selectedLevel + 1);
    levelCards.forEach(c => {
      c.setAttribute('aria-checked',
        String(parseInt(c.dataset.level, 10) === state.selectedLevel));
    });
    startGame();
  });
  btnWinHome.addEventListener('click', goHome);
  btnLoseAgain.addEventListener('click', startGame);
  btnLoseHome.addEventListener('click', goHome);

  // Teclado
  document.addEventListener('keydown', (e) => {
    const inStart = panels.start.classList.contains('panel--active');
    const inGame  = panels.game.classList.contains('panel--active');
    const inHelp  = panels.help.classList.contains('panel--active');

    if (e.key === 'Escape' && inHelp) {
      panels.help.classList.remove('panel--active');
      return;
    }
    if (e.key === 'Enter' && inStart) {
      startGame();
      return;
    }
    if (!inGame || !state.playing) return;

    const k = e.key.toLowerCase();
    if (k === 'a' || e.key === 'ArrowLeft')  rotateLeft();
    if (k === 'd' || e.key === 'ArrowRight') rotateRight();
    if (k === 'w' || e.key === 'ArrowUp')    moveForward();
  });

  // Reposicionar al cambiar tamaño
  window.addEventListener('resize', () => {
    if (panels.game.classList.contains('panel--active')) {
      positionLucas();
      positionCars();
    }
  });

  /* ==========================================================
     18. INICIALIZACIÓN
  ========================================================== */
  loadProgress();

  // Seleccionar nivel 1 por defecto
  levelCards.forEach(c => {
    c.setAttribute('aria-checked', String(parseInt(c.dataset.level, 10) === 1));
  });
  updateTopbarLevel(1);

  showPanel('start');
  clearFeedback();
  updateHUD();

  console.log('%c🏙️ Ciudad Segura listo.', 'color:#1aa3c9;font-weight:bold;font-size:14px;');
  console.log('Teclas: A/← girar izquierda · D/→ girar derecha · W/↑ avanzar · Enter empezar');
});