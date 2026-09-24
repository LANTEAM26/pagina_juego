// ============================================================
//  🐝 BEEBOT - LÓGICA COMPLETA
//  Pantallas: Presentación · Cómo jugar · Selección · Juego
//  Cuadrículas: 4x4, 5x5, 5x7, 6x7
//  Recogida AUTOMÁTICA al pisar la flor · Solo 1 flor a la vez
// ============================================================

// ---------- DEFINICIÓN DE NIVELES POR DIFICULTAD ----------
const NIVELES_FACIL = [
    { flores: 1, obstaculos: 0 },
    { flores: 2, obstaculos: 0 },
    { flores: 3, obstaculos: 0 },
    { flores: 4, obstaculos: 0 },
    { flores: 5, obstaculos: 0 }
];

const NIVELES_MEDIO = [
    { flores: 1, obstaculos: 6 },
    { flores: 2, obstaculos: 8 },
    { flores: 3, obstaculos: 10 },
    { flores: 4, obstaculos: 12 },
    { flores: 5, obstaculos: 14 }
];

const NIVELES_DIFICIL = [
    { flores: 2, obstaculos: 10, movMax: 40 },
    { flores: 3, obstaculos: 14, movMax: 35 },
    { flores: 4, obstaculos: 18, movMax: 30 }
];

// ---------- ELEMENTOS DOM ----------
const canvas = document.getElementById('lienzo-juego');
const ctx = canvas.getContext('2d');

const floresRecogidasSpan = document.getElementById('cajas-recogidas');
const floresEntregadasSpan = document.getElementById('cajas-entregadas');
const totalFloresSpan = document.getElementById('total-cajas');
const contadorMovimientosSpan = document.getElementById('contador-movimientos');
const mensajeFlotante = document.getElementById('mensaje-flotante');
const cargaActualSpan = document.getElementById('carga-actual');
const orientacionSpan = document.getElementById('orientacion-texto');
const nivelActualSpan = document.getElementById('nivel-actual');
const totalNivelesSpan = document.getElementById('total-niveles');
const dificultadActualSpan = document.getElementById('dificultad-actual');
const temporizadorSpan = document.getElementById('temporizador');

const modalFin = document.getElementById('modal-fin');
const modalTitulo = document.getElementById('modal-titulo');
const modalMensaje = document.getElementById('modal-mensaje-refuerzo');
const modalRecogidas = document.getElementById('modal-recogidas');
const modalEntregadas = document.getElementById('modal-entregadas');
const modalMovimientos = document.getElementById('modal-movimientos');
const modalGiros = document.getElementById('modal-giros');
const modalErrores = document.getElementById('modal-errores');
const modalConsejo = document.getElementById('modal-consejo-texto');
const botonReiniciar = document.getElementById('boton-reiniciar');

// Pantallas
const pantallaPresentacion = document.getElementById('pantalla-presentacion');
const pantallaComoJugar = document.getElementById('pantalla-como-jugar');
const pantallaSeleccion = document.getElementById('pantalla-seleccion');
const pantallaJuego = document.getElementById('pantalla-juego');

// Botones de navegación
const btnComenzar = document.getElementById('btn-comenzar');
const btnJugarVolver = document.getElementById('btn-jugar-volver');
const btnJugarContinuar = document.getElementById('btn-jugar-continuar');
const btnSeleccionVolver = document.getElementById('btn-seleccion-volver');
const btnEmpezar = document.getElementById('btn-empezar');
const btnMenu = document.getElementById('btn-menu');
const btnReiniciarNivel = document.getElementById('btn-reiniciar-nivel');

// Dificultad y cuadrícula
const btnFacil = document.getElementById('btn-facil');
const btnMedio = document.getElementById('btn-medio');
const btnDificil = document.getElementById('btn-dificil');
const descripcionDificultad = document.getElementById('descripcion-dificultad');
const botonesCuadricula = document.querySelectorAll('.btn-cuadricula');

// Botones de movimiento (solo 4 ahora)
const btnArriba = document.getElementById('btn-arriba');
const btnAbajo = document.getElementById('btn-abajo');
const btnIzquierda = document.getElementById('btn-izquierda');
const btnDerecha = document.getElementById('btn-derecha');

// ---------- SELECCIONES ACTUALES ----------
let modoSeleccionado = 'facil';
let colsSeleccionado = 4;
let filasSeleccionado = 4;

// ---------- SISTEMA DE SONIDOS ----------
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration, type = 'sine', volume = 0.3) {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* silencio */ }
}

function sonidoMovimiento() { playTone(500, 0.08); }
function sonidoGiro() { playTone(700, 0.05); }
function sonidoError() { playTone(180, 0.3, 'sawtooth', 0.2); }
function sonidoRecoger() {
    playTone(523, 0.1);
    setTimeout(() => playTone(659, 0.1), 100);
    setTimeout(() => playTone(784, 0.15), 200);
}
function sonidoEntregar() {
    playTone(523, 0.12);
    setTimeout(() => playTone(659, 0.12), 120);
    setTimeout(() => playTone(784, 0.12), 240);
    setTimeout(() => playTone(1047, 0.25), 360);
}
function sonidoVictoriaNivel() {
    [523, 587, 659, 784, 880, 988].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.12, 'sine', 0.25), i * 100));
}
function sonidoVictoriaJuego() {
    [523, 587, 659, 784, 880, 988, 1047].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.15, 'sine', 0.3), i * 120));
}
function sonidoDerrota() {
    [440, 370, 330, 280].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.25, 'sawtooth', 0.2), i * 200));
}
function sonidoTiempoBajo() {
    playTone(1000, 0.1, 'square', 0.15);
    setTimeout(() => playTone(900, 0.1, 'square', 0.15), 200);
    setTimeout(() => playTone(800, 0.1, 'square', 0.15), 400);
}

// ---------- IMÁGENES ----------
const imgAbeja = new Image(); imgAbeja.src = 'abeja.png';
const imgFlor = new Image(); imgFlor.src = 'flor.png';
const imgPanal = new Image(); imgPanal.src = 'panal.png';
const imgCampo = new Image(); imgCampo.src = 'campo.png';
const imgObstaculo = new Image(); imgObstaculo.src = 'obstaculo.png';

// ---------- ESTADO DEL JUEGO ----------
let juego = {
    modo: null,
    cols: 5,
    filas: 5,
    nivelIndex: 0,
    abejaX: 0,
    abejaY: 0,
    direccion: 0,
    flores: [],
    obstaculos: [],
    cargaIndex: null,
    movimientos: 0,
    giros: 0,
    errores: 0,
    recogidas: 0,
    entregadas: 0,
    panalX: 0,
    panalY: 0,
    terminado: false,
    nivelCompletado: false,
    totalFloresNivel: 0,
    tiempoRestante: 0,
    tiempoMaximo: 30,
    intervaloId: null,
    movMax: 40,
    empezado: false
};

// ---------- NAVEGACIÓN ENTRE PANTALLAS ----------
function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(id).classList.add('activa');
}

// ---------- UTILIDADES ----------
function obtenerDelta(dir, retroceder = false) {
    const d = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }][dir];
    return retroceder ? { dx: -d.dx, dy: -d.dy } : { dx: d.dx, dy: d.dy };
}

function dentro(x, y, cols, filas) {
    return x >= 0 && x < cols && y >= 0 && y < filas;
}

function hayFlorEn(x, y, flores) {
    return flores.some(f => f.x === x && f.y === y && !f.recogida && !f.entregada);
}

function indiceFlorEn(x, y, flores) {
    return flores.findIndex(f => f.x === x && f.y === y && !f.recogida && !f.entregada);
}

function hayObstaculoEn(x, y, obstaculos) {
    return obstaculos.some(o => o.x === x && o.y === y);
}

// ---------- GEOMETRÍA DEL TABLERO ----------
function calcularGeometria(cols, filas) {
    const cellSize = Math.min(canvas.width / cols, canvas.height / filas);
    const ancho = cols * cellSize;
    const alto = filas * cellSize;
    return {
        cellSize,
        offsetX: (canvas.width - ancho) / 2,
        offsetY: (canvas.height - alto) / 2
    };
}

// ---------- BFS ----------
function hayCamino(inicioX, inicioY, destinoX, destinoY, cols, filas, obstaculos) {
    const visited = Array.from({ length: filas }, () => Array(cols).fill(false));
    const queue = [{ x: inicioX, y: inicioY }];
    visited[inicioY][inicioX] = true;

    while (queue.length > 0) {
        const { x, y } = queue.shift();
        if (x === destinoX && y === destinoY) return true;
        const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
        for (const d of dirs) {
            const nx = x + d.dx;
            const ny = y + d.dy;
            if (dentro(nx, ny, cols, filas) && !visited[ny][nx] && !hayObstaculoEn(nx, ny, obstaculos)) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny });
            }
        }
    }
    return false;
}

function verificarCaminos(flores, obstaculos, cols, filas, panalX, panalY, inicioX, inicioY) {
    for (const f of flores) {
        if (!hayCamino(f.x, f.y, panalX, panalY, cols, filas, obstaculos)) return false;
    }
    if (!hayCamino(inicioX, inicioY, panalX, panalY, cols, filas, obstaculos)) return false;
    return true;
}

// ---------- ESCALAR CONFIG SEGÚN CUADRÍCULA ----------
function escalarConfig(config, cols, filas) {
    const totalCells = cols * filas;
    const maxFlores = Math.max(1, Math.floor(totalCells / 5));
    const maxObs = Math.max(0, Math.floor(totalCells / 3));
    return {
        flores: Math.min(config.flores, maxFlores),
        obstaculos: Math.min(config.obstaculos, maxObs),
        movMax: config.movMax
    };
}

// ---------- GENERAR NIVEL VÁLIDO ----------
function generarNivelValido(config, cols, filas, inicioX, inicioY) {
    const panalX = cols - 1;
    const panalY = filas - 1;
    let intentos = 0;

    while (intentos < 200) {
        intentos++;
        const flores = [];
        const obstaculos = [];
        const ocupadas = new Set();
        ocupadas.add(`${inicioX},${inicioY}`);
        ocupadas.add(`${panalX},${panalY}`);

        // Obstáculos
        let obsColocados = 0;
        let obsIntentos = 0;
        while (obsColocados < config.obstaculos && obsIntentos < 500) {
            obsIntentos++;
            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * filas);
            const clave = `${x},${y}`;
            if (!ocupadas.has(clave)) {
                ocupadas.add(clave);
                obstaculos.push({ x, y });
                obsColocados++;
            }
        }

        // Flores
        let floresColocadas = 0;
        let florIntentos = 0;
        while (floresColocadas < config.flores && florIntentos < 500) {
            florIntentos++;
            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * filas);
            const clave = `${x},${y}`;
            if (!ocupadas.has(clave)) {
                ocupadas.add(clave);
                flores.push({ x, y, recogida: false, entregada: false });
                floresColocadas++;
            }
        }

        if (floresColocadas < config.flores) continue;
        if (verificarCaminos(flores, obstaculos, cols, filas, panalX, panalY, inicioX, inicioY)) {
            return { flores, obstaculos, panalX, panalY };
        }
    }
    throw new Error('No se pudo generar un nivel válido');
}

// ---------- INICIAR NIVEL ----------
function iniciarNivel(modo, cols, filas, nivelIndex) {
    if (juego.intervaloId) {
        clearInterval(juego.intervaloId);
        juego.intervaloId = null;
    }

    let configs, inicioX = 0, inicioY = 0, tiempoMax = 0;

    if (modo === 'facil') {
        configs = NIVELES_FACIL;
    } else if (modo === 'medio') {
        configs = NIVELES_MEDIO;
        tiempoMax = 30;
    } else if (modo === 'dificil') {
        configs = NIVELES_DIFICIL;
    }

    const configBase = configs[nivelIndex];
    const config = escalarConfig(configBase, cols, filas);
    const data = generarNivelValido(config, cols, filas, inicioX, inicioY);

    juego.modo = modo;
    juego.cols = cols;
    juego.filas = filas;
    juego.nivelIndex = nivelIndex;
    juego.abejaX = inicioX;
    juego.abejaY = inicioY;
    juego.direccion = 0;
    juego.flores = data.flores;
    juego.obstaculos = data.obstaculos;
    juego.cargaIndex = null;
    juego.movimientos = 0;
    juego.giros = 0;
    juego.errores = 0;
    juego.recogidas = 0;
    juego.entregadas = 0;
    juego.panalX = data.panalX;
    juego.panalY = data.panalY;
    juego.terminado = false;
    juego.nivelCompletado = false;
    juego.totalFloresNivel = config.flores;
    juego.empezado = true;
    juego.movMax = config.movMax || Infinity;

    // Temporizador (medio)
    if (modo === 'medio') {
        juego.tiempoMaximo = tiempoMax;
        juego.tiempoRestante = tiempoMax;
        temporizadorSpan.style.display = 'inline-block';
        temporizadorSpan.textContent = `⏱️ ${juego.tiempoRestante}s`;
        temporizadorSpan.style.color = 'white';

        juego.intervaloId = setInterval(() => {
            juego.tiempoRestante--;
            temporizadorSpan.textContent = `⏱️ ${juego.tiempoRestante}s`;
            if (juego.tiempoRestante <= 5) {
                sonidoTiempoBajo();
                temporizadorSpan.style.color = '#FFEE00';
            } else {
                temporizadorSpan.style.color = 'white';
            }
            if (juego.tiempoRestante <= 0) {
                clearInterval(juego.intervaloId);
                juego.intervaloId = null;
                juego.terminado = true;
                juego.nivelCompletado = false;
                sonidoDerrota();
                mostrarModal(false);
            }
        }, 1000);
    } else {
        temporizadorSpan.style.display = 'none';
        temporizadorSpan.textContent = '';
    }

    // UI
    totalFloresSpan.textContent = juego.totalFloresNivel;
    nivelActualSpan.textContent = nivelIndex + 1;
    const nombres = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };
    dificultadActualSpan.textContent = nombres[modo];
    totalNivelesSpan.textContent = configs.length;

    const nFlores = juego.totalFloresNivel;
    let msg = `🌸 Nivel ${nivelIndex + 1}: lleva ${nFlores} flor${nFlores > 1 ? 'es' : ''} al panal.`;
    if (modo !== 'facil') {
        msg = `🌿 Nivel ${nivelIndex + 1}: ${nFlores} flor${nFlores > 1 ? 'es' : ''}, ${config.obstaculos} obst.`;
    }
    if (modo === 'dificil') {
        msg += ` Límite ${juego.movMax} mov.`;
    }
    mensajeFlotante.textContent = msg;

    habilitarBotonesMovimiento(true);
    actualizarUI();
    dibujar();
}

// ---------- REINICIAR NIVEL ----------
function reiniciarNivel() {
    if (juego.modo && juego.empezado) {
        iniciarNivel(juego.modo, juego.cols, juego.filas, juego.nivelIndex);
    }
    modalFin.style.display = 'none';
}

// ---------- GIROS ----------
function girarIzquierda() {
    if (!juego.empezado || juego.terminado) return;
    juego.direccion = (juego.direccion + 3) % 4;
    juego.giros++;
    sonidoGiro();
    actualizarUI();
    dibujar();
}

function girarDerecha() {
    if (!juego.empezado || juego.terminado) return;
    juego.direccion = (juego.direccion + 1) % 4;
    juego.giros++;
    sonidoGiro();
    actualizarUI();
    dibujar();
}

// ---------- MOVIMIENTOS CON RECOGIDA AUTOMÁTICA ----------
function moverA(nx, ny, esAvance) {
    // Validar límites
    if (!dentro(nx, ny, juego.cols, juego.filas)) {
        mensajeFlotante.textContent = '🚫 ¡No salgas del prado!';
        sonidoError();
        return;
    }
    // Panal: bloquea el paso si NO es el destino final (se entrega al pisar, así que SÍ puede pisar)
    // → Decisión: al pisar el panal, se entrega automáticamente si lleva carga.
    // Si no lleva carga, el panal se comporta como casilla normal (puede pisar).
    // Pero si no lleva carga y pisa el panal, no pasa nada especial.

    // Obstáculo
    if (hayObstaculoEn(nx, ny, juego.obstaculos)) {
        mensajeFlotante.textContent = '🌿 ¡Hay un obstáculo! No puedes pasar.';
        sonidoError();
        return;
    }

    // Flor en la casilla destino
    const idxFlor = indiceFlorEn(nx, ny, juego.flores);

    if (idxFlor !== -1) {
        // Hay flor en la celda
        if (juego.cargaIndex === null) {
            // Recoger automáticamente
            juego.cargaIndex = idxFlor;
            juego.flores[idxFlor].recogida = true;
            juego.recogidas++;
            sonidoRecoger();
            mensajeFlotante.textContent = '🌼 ¡Flor recogida! Llévala al panal.';
        } else {
            // Ya lleva una flor → la segunda actúa como obstáculo
            mensajeFlotante.textContent = '🌸 ¡Ya llevas una flor! Esa flor bloquea el paso.';
            sonidoError();
            return;
        }
    }

    // Mover abeja (y carga)
    if (juego.cargaIndex !== null) {
        const f = juego.flores[juego.cargaIndex];
        f.x = nx;
        f.y = ny;
    }
    juego.abejaX = nx;
    juego.abejaY = ny;
    juego.movimientos++;
    sonidoMovimiento();

    if (idxFlor === -1) {
        mensajeFlotante.textContent = esAvance ? '✅ Avanzaste.' : '🔙 Retrocediste.';
    }

    actualizarUI();
    dibujar();

    // Entrega automática si está en el panal con carga
    if (juego.abejaX === juego.panalX && juego.abejaY === juego.panalY && juego.cargaIndex !== null) {
        entregarFlor();
    }

    verificarFinNivel();
}

function avanzar() {
    if (!juego.empezado || juego.terminado) return;
    const d = obtenerDelta(juego.direccion, false);
    moverA(juego.abejaX + d.dx, juego.abejaY + d.dy, true);
}

function retroceder() {
    if (!juego.empezado || juego.terminado) return;
    const d = obtenerDelta(juego.direccion, true);
    moverA(juego.abejaX + d.dx, juego.abejaY + d.dy, false);
}

// ---------- ENTREGAR FLOR ----------
function entregarFlor() {
    const idx = juego.cargaIndex;
    juego.flores[idx].entregada = true;
    juego.flores[idx].recogida = false;
    juego.entregadas++;
    juego.cargaIndex = null;
    sonidoEntregar();
    mensajeFlotante.textContent = '🍯 ¡Flor entregada en el panal! 🎉';

    if (juego.modo === 'medio') {
        juego.tiempoRestante = Math.min(juego.tiempoRestante + 10, juego.tiempoMaximo);
        temporizadorSpan.textContent = `⏱️ ${juego.tiempoRestante}s`;
        if (juego.tiempoRestante > 5) temporizadorSpan.style.color = 'white';
    }

    actualizarUI();
    dibujar();
}

// ---------- FIN DE NIVEL ----------
function verificarFinNivel() {
    if (juego.terminado) return;

    const todasEntregadas = juego.flores.every(f => f.entregada);
    if (todasEntregadas) {
        juego.terminado = true;
        juego.nivelCompletado = true;
        if (juego.intervaloId) {
            clearInterval(juego.intervaloId);
            juego.intervaloId = null;
        }
        const esUltimo = (juego.nivelIndex === getNivelesTotal(juego.modo) - 1);
        if (esUltimo) sonidoVictoriaJuego();
        else sonidoVictoriaNivel();
        mostrarModal(true);
        return;
    }

    if (juego.modo === 'dificil' && juego.movimientos >= juego.movMax) {
        juego.terminado = true;
        juego.nivelCompletado = false;
        if (juego.intervaloId) {
            clearInterval(juego.intervaloId);
            juego.intervaloId = null;
        }
        sonidoDerrota();
        mostrarModal(false);
    }
}

function getNivelesTotal(modo) {
    if (modo === 'facil') return NIVELES_FACIL.length;
    if (modo === 'medio') return NIVELES_MEDIO.length;
    if (modo === 'dificil') return NIVELES_DIFICIL.length;
    return 0;
}

// ---------- MODAL ----------
function mostrarModal(ganaste) {
    const esUltimoNivel = (juego.nivelIndex === getNivelesTotal(juego.modo) - 1);
    const nombres = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };

    if (ganaste) {
        if (esUltimoNivel) {
            modalTitulo.textContent = `🎉 ¡Ganaste el modo ${nombres[juego.modo]}!`;
            modalTitulo.style.color = '#1E7A5E';
            modalMensaje.textContent = '🐝 ¡BeeBot es una campeona! Has superado todos los niveles.';
            botonReiniciar.textContent = '🏠 Volver al menú';
        } else {
            modalTitulo.textContent = '🎉 ¡Nivel completado!';
            modalTitulo.style.color = '#1E7A5E';
            modalMensaje.textContent = `🐝 ¡BeeBot avanza al nivel ${juego.nivelIndex + 2}/${getNivelesTotal(juego.modo)}!`;
            botonReiniciar.textContent = '➡️ Siguiente nivel';
        }
    } else {
        modalTitulo.textContent = '😅 ¡Perdiste!';
        modalTitulo.style.color = '#B13E3E';
        modalMensaje.textContent = '🔄 Se acabó el tiempo o los movimientos. ¡Inténtalo de nuevo!';
        botonReiniciar.textContent = '🔄 Reintentar nivel';
    }

    modalRecogidas.textContent = juego.recogidas;
    modalEntregadas.textContent = juego.entregadas;
    modalMovimientos.textContent = juego.movimientos;
    modalGiros.textContent = juego.giros;
    modalErrores.textContent = juego.errores;

    let consejo = '';
    if (ganaste) {
        if (juego.errores === 0) consejo = '🌟 ¡Perfecto! Sin errores. Recuerda pisar la flor y luego el panal.';
        else if (juego.errores <= 3) consejo = '👍 Muy bien. Practica tus giros para alinear mejor.';
        else consejo = '🧭 Ganaste, pero revisa tus giros. Asegúrate de mirar exactamente.';
    } else {
        if (juego.entregadas >= juego.totalFloresNivel - 1) consejo = '💪 ¡Casi! Solo te faltó una flor. Planea mejor la ruta.';
        else if (juego.entregadas === 0) consejo = '🤔 Intenta: pisa una flor para recogerla, gira hacia el panal y avanza.';
        else consejo = '🔄 Revisa tus giros. Cada paso cuenta. Evita repetir caminos.';
    }
    modalConsejo.textContent = consejo;

    modalFin.style.display = 'flex';
}

// ---------- BOTÓN DEL MODAL ----------
function manejarBotonModal() {
    const ganaste = juego.nivelCompletado;
    const esUltimoNivel = (juego.nivelIndex === getNivelesTotal(juego.modo) - 1);

    if (ganaste && esUltimoNivel) {
        modalFin.style.display = 'none';
        volverAlMenu();
    } else if (ganaste && !esUltimoNivel) {
        iniciarNivel(juego.modo, juego.cols, juego.filas, juego.nivelIndex + 1);
        modalFin.style.display = 'none';
    } else {
        reiniciarNivel();
    }
}

// ---------- VOLVER AL MENÚ ----------
function volverAlMenu() {
    if (juego.intervaloId) {
        clearInterval(juego.intervaloId);
        juego.intervaloId = null;
    }
    juego.empezado = false;
    juego.terminado = false;
    modalFin.style.display = 'none';
    mostrarPantalla('pantalla-presentacion');
}

// ---------- UI ----------
function actualizarUI() {
    floresRecogidasSpan.textContent = juego.recogidas;
    floresEntregadasSpan.textContent = juego.entregadas;
    contadorMovimientosSpan.textContent = juego.movimientos;

    const carga = juego.cargaIndex !== null;
    cargaActualSpan.textContent = carga ? '✅ Sí' : 'No';
    cargaActualSpan.style.background = carga ? '#6FCF97' : '#F4B942';

    const emojis = ['⬆️', '➡️', '⬇️', '⬅️'];
    const nombres = ['Norte', 'Este', 'Sur', 'Oeste'];
    orientacionSpan.textContent = `${emojis[juego.direccion]} ${nombres[juego.direccion]}`;

    const statItems = document.querySelectorAll('.stat-item');
    if (statItems.length >= 3) {
        if (juego.modo === 'dificil' && juego.empezado) {
            const movRestantes = Math.max(0, juego.movMax - juego.movimientos);
            statItems[2].innerHTML = `⚡ Mov. restantes: <strong>${movRestantes}</strong>`;
        } else {
            statItems[2].innerHTML = `🚀 Movimientos: <strong id="contador-movimientos">${juego.movimientos}</strong>`;
        }
    }
}

// ---------- DIBUJO ----------
function dibujar() {
    const { cellSize, offsetX, offsetY } = calcularGeometria(juego.cols, juego.filas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Suelo
    for (let y = 0; y < juego.filas; y++) {
        for (let x = 0; x < juego.cols; x++) {
            const px = offsetX + x * cellSize;
            const py = offsetY + y * cellSize;
            if (imgCampo.complete && imgCampo.naturalWidth > 0) {
                ctx.drawImage(imgCampo, px, py, cellSize, cellSize);
            } else {
                ctx.fillStyle = ((x + y) % 2 === 0) ? '#C8BCA7' : '#B3A690';
                ctx.fillRect(px, py, cellSize, cellSize);
            }
        }
    }

    // Borde
    ctx.strokeStyle = '#8c7e64';
    ctx.lineWidth = 4;
    ctx.strokeRect(offsetX, offsetY, juego.cols * cellSize, juego.filas * cellSize);

    // Obstáculos
    juego.obstaculos.forEach(o => {
        const px = offsetX + o.x * cellSize;
        const py = offsetY + o.y * cellSize;
        if (imgObstaculo.complete && imgObstaculo.naturalWidth > 0) {
            ctx.drawImage(imgObstaculo, px, py, cellSize, cellSize);
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
            ctx.fillStyle = '#5D2E0C';
            ctx.font = `bold ${Math.floor(cellSize * 0.4)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌿', px + cellSize / 2, py + cellSize / 2);
        }
    });

    // Panal
    const cx = offsetX + juego.panalX * cellSize;
    const cy = offsetY + juego.panalY * cellSize;
    if (imgPanal.complete && imgPanal.naturalWidth > 0) {
        ctx.drawImage(imgPanal, cx, cy, cellSize, cellSize);
    } else {
        ctx.fillStyle = '#F5A623';
        ctx.fillRect(cx, cy, cellSize, cellSize);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.floor(cellSize * 0.5)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍯', cx + cellSize / 2, cy + cellSize / 2);
    }

    // Flores (solo las no recogidas y no entregadas)
    juego.flores.forEach(f => {
        if (f.entregada || f.recogida) return;
        const px = offsetX + f.x * cellSize;
        const py = offsetY + f.y * cellSize;
        if (imgFlor.complete && imgFlor.naturalWidth > 0) {
            ctx.drawImage(imgFlor, px, py, cellSize, cellSize);
        } else {
            ctx.fillStyle = '#D48C34';
            ctx.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
            ctx.fillStyle = '#B06A1E';
            ctx.font = `bold ${Math.floor(cellSize * 0.45)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌼', px + cellSize / 2, py + cellSize / 2);
        }
    });

    // Abeja
    const rpx = offsetX + juego.abejaX * cellSize;
    const rpy = offsetY + juego.abejaY * cellSize;
    ctx.save();
    ctx.translate(rpx + cellSize / 2, rpy + cellSize / 2);
    ctx.rotate([0, Math.PI / 2, Math.PI, -Math.PI / 2][juego.direccion]);
    if (imgAbeja.complete && imgAbeja.naturalWidth > 0) {
        ctx.drawImage(imgAbeja, -cellSize * 0.45, -cellSize * 0.45, cellSize * 0.9, cellSize * 0.9);
    } else {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, cellSize * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#1F2A36';
        ctx.beginPath();
        ctx.moveTo(0, -cellSize * 0.45);
        ctx.lineTo(-cellSize * 0.2, -cellSize * 0.1);
        ctx.lineTo(cellSize * 0.2, -cellSize * 0.1);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    // Flor cargada encima de la abeja
    if (juego.cargaIndex !== null) {
        const f = juego.flores[juego.cargaIndex];
        if (f && !f.entregada) {
            const px = rpx;
            const py = rpy - cellSize * 0.35;
            ctx.save();
            ctx.globalAlpha = 0.95;
            if (imgFlor.complete && imgFlor.naturalWidth > 0) {
                ctx.drawImage(imgFlor, px + 4, py + 4, cellSize - 8, cellSize - 8);
            } else {
                ctx.fillStyle = '#D48C34';
                ctx.fillRect(px + 6, py + 6, cellSize - 12, cellSize - 12);
                ctx.fillStyle = 'white';
                ctx.font = `bold ${Math.floor(cellSize * 0.35)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🌼', px + cellSize / 2, py + cellSize / 2);
            }
            ctx.restore();
        }
    }
}

// ---------- BOTONES ----------
function habilitarBotonesMovimiento(estado) {
    [btnArriba, btnAbajo, btnIzquierda, btnDerecha].forEach(b => b.disabled = !estado);
}

function seleccionarDificultad(modo) {
    modoSeleccionado = modo;
    [btnFacil, btnMedio, btnDificil].forEach(b => b.classList.remove('seleccionado'));
    if (modo === 'facil') btnFacil.classList.add('seleccionado');
    else if (modo === 'medio') btnMedio.classList.add('seleccionado');
    else if (modo === 'dificil') btnDificil.classList.add('seleccionado');

    const descripciones = {
        facil: 'Sin obstáculos · Sin tiempo · 5 niveles',
        medio: 'Con obstáculos · Temporizador de 30s · 5 niveles',
        dificil: 'Con obstáculos · Límite de movimientos · 3 niveles'
    };
    descripcionDificultad.textContent = descripciones[modo];
}

function seleccionarCuadricula(boton) {
    botonesCuadricula.forEach(b => b.classList.remove('seleccionado'));
    boton.classList.add('seleccionado');
    colsSeleccionado = parseInt(boton.dataset.cols);
    filasSeleccionado = parseInt(boton.dataset.filas);
}

// ---------- EMPEZAR ----------
function empezarJuego() {
    modalFin.style.display = 'none';
    mostrarPantalla('pantalla-juego');
    iniciarNivel(modoSeleccionado, colsSeleccionado, filasSeleccionado, 0);
}

// ---------- EVENTOS ----------
// Navegación
btnComenzar.addEventListener('click', () => mostrarPantalla('pantalla-como-jugar'));
btnJugarVolver.addEventListener('click', () => mostrarPantalla('pantalla-presentacion'));
btnJugarContinuar.addEventListener('click', () => mostrarPantalla('pantalla-seleccion'));
btnSeleccionVolver.addEventListener('click', () => mostrarPantalla('pantalla-como-jugar'));
btnEmpezar.addEventListener('click', empezarJuego);
btnMenu.addEventListener('click', volverAlMenu);
btnReiniciarNivel.addEventListener('click', reiniciarNivel);

// Dificultad
btnFacil.addEventListener('click', () => seleccionarDificultad('facil'));
btnMedio.addEventListener('click', () => seleccionarDificultad('medio'));
btnDificil.addEventListener('click', () => seleccionarDificultad('dificil'));

// Cuadrícula
botonesCuadricula.forEach(btn => {
    btn.addEventListener('click', () => seleccionarCuadricula(btn));
});

// Movimiento
btnArriba.addEventListener('click', avanzar);
btnAbajo.addEventListener('click', retroceder);
btnIzquierda.addEventListener('click', girarIzquierda);
btnDerecha.addEventListener('click', girarDerecha);

// Modal
botonReiniciar.addEventListener('click', manejarBotonModal);

// Teclado
document.addEventListener('keydown', (e) => {
    if (!juego.empezado || juego.terminado) return;
    if (!pantallaJuego.classList.contains('activa')) return;

    switch (e.key) {
        case 'ArrowUp': e.preventDefault(); avanzar(); break;
        case 'ArrowDown': e.preventDefault(); retroceder(); break;
        case 'ArrowLeft': e.preventDefault(); girarIzquierda(); break;
        case 'ArrowRight': e.preventDefault(); girarDerecha(); break;
    }
});

// ---------- INICIALIZACIÓN ----------
function inicializar() {
    const btnCuadriculaInicial = document.querySelector('.btn-cuadricula.seleccionado');
    if (btnCuadriculaInicial) {
        colsSeleccionado = parseInt(btnCuadriculaInicial.dataset.cols);
        filasSeleccionado = parseInt(btnCuadriculaInicial.dataset.filas);
    }
    const btnDificultadInicial = document.querySelector('.btn-dificultad.seleccionado');
    if (btnDificultadInicial) {
        modoSeleccionado = btnDificultadInicial.id.replace('btn-', '');
    }

    habilitarBotonesMovimiento(false);
    seleccionarDificultad(modoSeleccionado);
}

inicializar();