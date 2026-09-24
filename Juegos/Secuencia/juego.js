<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#ffb703" />
  <meta name="description" content="Abeja Programadora: juego educativo para aprender pensamiento computacional." />
  <title>🐝 Abeja Programadora – Juego Educativo</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="styles.css" />
</head>
<body>

  <!-- ============ DECORACIÓN DE FONDO ============ -->
  <div class="bg-decor" aria-hidden="true">
    <span class="cloud cloud-1">☁️</span>
    <span class="cloud cloud-2">☁️</span>
    <span class="cloud cloud-3">☁️</span>
    <span class="flower flower-1">🌻</span>
    <span class="flower flower-2">🌼</span>
    <span class="flower flower-3">🌷</span>
    <span class="flower flower-4">🌸</span>
    <span class="bee-decor bee-decor-1">🐝</span>
    <span class="bee-decor bee-decor-2">🐝</span>
  </div>

  <div class="game-wrapper">

    <!-- ============ HEADER ============ -->
    <header class="game-header">
      <div class="logo">
        <div class="logo-badge">
          <span class="logo-emoji">🐝</span>
        </div>
        <div class="logo-text">
          <h1>Abeja <span>Programadora</span></h1>
          <p>¡Aprende a programar jugando!</p>
        </div>
      </div>

      <div class="hud">
        <div class="hud-card hud-level">
          <span class="hud-icon">🏆</span>
          <div class="hud-info">
            <span class="hud-label">Nivel</span>
            <span class="hud-value" id="levelValue">1</span>
          </div>
        </div>

        <div class="hud-card hud-stars">
          <span class="hud-icon">⭐</span>
          <div class="hud-info">
            <span class="hud-label">Estrellas</span>
            <span class="hud-value" id="starsValue">0</span>
          </div>
        </div>

        <div class="hud-card hud-moves">
          <span class="hud-icon">👣</span>
          <div class="hud-info">
            <span class="hud-label">Pasos</span>
            <span class="hud-value" id="movesValue">0</span>
          </div>
        </div>

        <button class="icon-btn" id="btnHelp" type="button" aria-label="Ayuda">
          <span>❓</span>
        </button>
        <button class="icon-btn" id="btnSound" type="button" aria-label="Activar o desactivar sonido">
          <span>🔊</span>
        </button>
      </div>
    </header>

    <!-- ============ MAIN ============ -->
    <main class="game-main">

      <!-- ---------- TABLERO ---------- -->
      <section class="board-panel" aria-label="Tablero de juego">
        <div class="board-top">
          <h2 class="board-heading">
            <span class="board-heading-icon">🌸</span>
            Lleva a la abeja hasta la flor
          </h2>
          <div class="status-bar" id="statusBar" role="status" aria-live="polite">
            ¡Programa el camino de la abeja!
          </div>
        </div>

        <div class="board-wrap">
          <div class="grid" id="grid" role="grid" aria-label="Tablero 6 por 6"></div>
        </div>

        <div class="board-legend" aria-hidden="true">
          <span class="legend-item"><span class="legend-dot legend-bee">🐝</span> Abeja</span>
          <span class="legend-item"><span class="legend-dot legend-flower">🌸</span> Meta</span>
          <span class="legend-item"><span class="legend-dot legend-visited"></span> Visitado</span>
        </div>
      </section>

      <!-- ---------- PANEL DE CONTROLES ---------- -->
      <aside class="control-panel" aria-label="Panel de programación">

        <!-- Controles de movimiento -->
        <div class="panel-section">
          <div class="section-head">
            <h3 class="panel-title">🎮 Controles</h3>
            <span class="section-tip">Toca para programar</span>
          </div>

          <div class="dpad" role="group" aria-label="Controles de la abeja">
            <button class="cmd-btn cmd-forward" data-cmd="forward" type="button" aria-label="Adelante">
              <span class="cmd-icon">⬆️</span>
              <span class="cmd-text">Adelante</span>
            </button>

            <button class="cmd-btn cmd-left" data-cmd="left" type="button" aria-label="Girar a la izquierda">
              <span class="cmd-icon">↩️</span>
              <span class="cmd-text">Izquierda</span>
            </button>

            <button class="cmd-btn cmd-right" data-cmd="right" type="button" aria-label="Girar a la derecha">
              <span class="cmd-icon">↪️</span>
              <span class="cmd-text">Derecha</span>
            </button>

            <button class="cmd-btn cmd-backward" data-cmd="backward" type="button" aria-label="Atrás">
              <span class="cmd-icon">⬇️</span>
              <span class="cmd-text">Atrás</span>
            </button>
          </div>
        </div>

        <!-- Memoria / Secuencia -->
        <div class="panel-section panel-sequence">
          <div class="section-head">
            <h3 class="panel-title">🧠 Memoria</h3>
            <span class="chip-counter" id="chipCounter">0 pasos</span>
          </div>
          <div class="sequence-box" id="sequenceBox">
            <div class="seq-empty">
              <span class="seq-empty-icon">✨</span>
              <span>Aquí aparecen tus pasos…</span>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="panel-section panel-actions">
          <button class="action-btn action-go" id="btnGo" type="button">
            <span class="action-icon">▶️</span>
            <span>¡Vamos!</span>
          </button>

          <div class="action-row">
            <button class="action-btn action-pause" id="btnPause" type="button" disabled>
              <span class="action-icon">⏸️</span>
              <span>Pausa</span>
            </button>
            <button class="action-btn action-clear" id="btnClear" type="button">
              <span class="action-icon">🗑️</span>
              <span>Borrar</span>
            </button>
          </div>

          <button class="action-btn action-new" id="btnNew" type="button">
            <span class="action-icon">🔄</span>
            <span>Nuevo reto</span>
          </button>
        </div>
      </aside>
    </main>
  </div>

  <!-- ============ OVERLAY: INICIO ============ -->
  <div class="overlay" id="startOverlay">
    <div class="overlay-card">
      <div class="overlay-emoji">🐝</div>
      <h2>¡Bienvenido a Abeja Programadora!</h2>
      <p class="overlay-sub">
        Ayuda a la abeja a llegar a la flor programando sus movimientos paso a paso.
      </p>
      <ul class="overlay-list">
        <li><span>1️⃣</span> Elige los movimientos con los botones</li>
        <li><span>2️⃣</span> Mira la secuencia en <strong>Memoria</strong></li>
        <li><span>3️⃣</span> Pulsa <strong>¡Vamos!</strong> y observa</li>
      </ul>
      <button class="primary-btn" id="btnStart" type="button">🚀 ¡Empezar a jugar!</button>
    </div>
  </div>

  <!-- ============ OVERLAY: AYUDA ============ -->
  <div class="overlay" id="helpOverlay">
    <div class="overlay-card">
      <button class="close-btn" id="btnCloseHelp" type="button" aria-label="Cerrar ayuda">✕</button>
      <div class="overlay-emoji">❓</div>
      <h2>¿Cómo se juega?</h2>

      <div class="help-grid">
        <div class="help-item">
          <span class="help-icon">⬆️</span>
          <strong>Adelante</strong>
          <span>Avanza una casilla en la dirección en la que mira la abeja.</span>
        </div>
        <div class="help-item">
          <span class="help-icon">⬇️</span>
          <strong>Atrás</strong>
          <span>Retrocede una casilla sin girar.</span>
        </div>
        <div class="help-item">
          <span class="help-icon">↩️</span>
          <strong>Girar izquierda</strong>
          <span>Gira 90° sin moverse.</span>
        </div>
        <div class="help-item">
          <span class="help-icon">↪️</span>
          <strong>Girar derecha</strong>
          <span>Gira 90° sin moverse.</span>
        </div>
      </div>

      <p class="help-tip">💡 Consejo: programa la ruta completa antes de pulsar <strong>¡Vamos!</strong></p>
      <button class="primary-btn" id="btnCloseHelp2" type="button">¡Entendido!</button>
    </div>
  </div>

  <!-- ============ OVERLAY: NIVEL COMPLETADO ============ -->
  <div class="overlay" id="winOverlay">
    <div class="overlay-card win-card">
      <div class="win-stars" id="winStars">
        <span class="win-star">⭐</span>
        <span class="win-star">⭐</span>
        <span class="win-star">⭐</span>
      </div>
      <div class="overlay-emoji">🎉</div>
      <h2>¡Nivel completado!</h2>
      <p class="win-msg" id="winMsg">¡La abeja llegó a la flor!</p>

      <div class="win-stats">
        <div class="win-stat">
          <span class="win-stat-label">Pasos usados</span>
          <span class="win-stat-value" id="winSteps">0</span>
        </div>
        <div class="win-stat">
          <span class="win-stat-label">Nivel</span>
          <span class="win-stat-value" id="winLevel">1</span>
        </div>
      </div>

      <button class="primary-btn" id="btnNextLevel" type="button">🌟 Siguiente nivel</button>
    </div>
  </div>

  <!-- ============ FEEDBACK TOAST ============ -->
  <div class="feedback-toast" id="feedback" role="alert" aria-live="assertive">
    <span class="feedback-emoji" id="feedbackEmoji">🎉</span>
    <span class="feedback-msg" id="feedbackMsg">¡Muy bien!</span>
  </div>

  <!-- ============ CAPA DE CONFETI ============ -->
  <div class="confetti-layer" id="confettiLayer" aria-hidden="true"></div>

  <script src="script.js" defer></script>
</body>
</html>