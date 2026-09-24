/* ============================================================
   EL ORDEN DE LOS CUENTOS · Lógica del juego
   Versión final optimizada para pizarra digital
   
   Mecánicas principales:
   · Click en carta del mazo → se coloca en el primer hueco vacío
   · Click en carta de la línea → vuelve al mazo
   · Drag & drop → colocar en hueco específico o mover
   · Deshacer → quita SOLO la última carta colocada en la línea
   · Las cartas solo muestran imagen (el texto ya está en el dibujo)
   · Video de fondo con pausa automática al ocultar la pestaña
   
   NOTA: Se eliminaron los 3 botones flotantes (sonido, pantalla
   completa, ayuda rápida) y sus referencias. El sonido queda
   siempre activo por defecto.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. CONSTANTES
     ============================================================ */
  const DATOS = JSON.parse(document.getElementById('datos-cuentos').textContent);
  const STORAGE_KEY = 'orden-cuentos-v6';
  const MAX_PISTAS = 3;
  const TOAST_DURACION = 3800;

  /* ============================================================
     2. LOGROS
     ============================================================ */
  const LOGROS_DEF = [
    { id: 'primer_cuento', emoji: '📖', titulo: 'Primer cuento',       desc: 'Completa tu primer cuento.' },
    { id: 'sin_pistas',    emoji: '🧠', titulo: 'Mente brillante',    desc: 'Completa un cuento sin usar pistas.' },
    { id: 'perfecto',      emoji: '⭐', titulo: 'Perfecto',           desc: 'Consigue 3 estrellas en un cuento.' },
    { id: 'coleccionista', emoji: '📚', titulo: 'Coleccionista',      desc: 'Completa los 6 cuentos.' },
    { id: 'veloz',         emoji: '⚡', titulo: 'Rayo',               desc: 'Completa un cuento en menos de 45 s.' },
    { id: 'maestro',       emoji: '🏆', titulo: 'Maestro de cuentos', desc: 'Consigue 3 estrellas en 3 cuentos.' },
    { id: 'explorador',    emoji: '🗺️', titulo: 'Explorador',         desc: 'Prueba los 6 cuentos.' },
    { id: 'preciso',       emoji: '🎯', titulo: 'Preciso',            desc: 'Completa con un solo intento.' },
    { id: 'corona',        emoji: '👑', titulo: 'Corona dorada',      desc: 'Consigue 18 estrellas en total.' }
  ];

  /* ============================================================
     3. ESTADO
     ============================================================ */
  const estado = {
    pantalla: 'inicio',
    cuentoKey: null,
    cuento: null,
    cartas: [],
    mazo: [],
    linea: [],
    // Pila con los índices de huecos en el ORDEN en que se colocaron.
    // Se usa para que "Deshacer" quite solo la última carta puesta.
    ordenColocacion: [],
    intentos: 0,
    pistasUsadas: 0,
    resuelto: false,
    estrellas: 0,
    tiempo: 0,
    timerId: null,
    filtro: 'todos'
  };

  const progreso = {
    estrellasPorCuento: {},
    estrellasTotales: 0,
    cuentosProbados: [],
    logros: [],
    partidasJugadas: 0
  };

  let dragEnProgreso = false;
  let mensajeTimeout = null;

  /* ============================================================
     4. UTILIDADES
     ============================================================ */
  function barajar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buscarCarta(id) {
    return estado.cartas.find(c => c.id === id) || null;
  }

  function formatearTiempo(seg) {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function sumaEstrellas() {
    return Object.values(progreso.estrellasPorCuento).reduce((a, b) => a + b, 0);
  }

  /* ============================================================
     5. PERSISTENCIA
     ============================================================ */
  function cargarProgreso() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.estrellasPorCuento) progreso.estrellasPorCuento = data.estrellasPorCuento;
      if (Array.isArray(data.cuentosProbados)) progreso.cuentosProbados = data.cuentosProbados;
      if (Array.isArray(data.logros)) progreso.logros = data.logros;
      if (typeof data.partidasJugadas === 'number') progreso.partidasJugadas = data.partidasJugadas;
      progreso.estrellasTotales = sumaEstrellas();
    } catch (e) {
      console.warn('No se pudo cargar progreso:', e);
    }
  }

  function guardarProgreso() {
    try {
      progreso.estrellasTotales = sumaEstrellas();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progreso));
    } catch (e) {
      console.warn('No se pudo guardar progreso:', e);
    }
  }

  /* ============================================================
     6. VIDEO DE FONDO · Ciclo de vida
     ------------------------------------------------------------
     El video va dentro de .fondo__video-contenedor
     y se ajusta con object-fit: contain (definido en CSS).
     Aquí solo nos aseguramos de que se reproduzca bien.
     ============================================================ */
  function inicializarVideoFondo() {
    const video = document.querySelector('.fondo__video');
    if (!video) return;

    const intentarReproducir = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          /* Algunos navegadores pueden bloquear hasta que haya gesto del usuario.
             Como está muted + autoplay, en la mayoría de casos funciona solo. */
        });
      }
    };

    // Primer intento
    intentarReproducir();

    // Reintento cuando el video esté listo
    video.addEventListener('canplay', intentarReproducir, { once: true });

    // Pausar cuando la pestaña está oculta (ahorra recursos en pizarra digital)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (!video.paused) video.pause();
      } else {
        intentarReproducir();
      }
    });

    // Si se pausa solo estando visible, retomar
    video.addEventListener('pause', () => {
      if (!document.hidden) {
        setTimeout(() => {
          if (video.paused && !document.hidden) intentarReproducir();
        }, 300);
      }
    });

    // Reintentar cuando la ventana recupera el foco
    window.addEventListener('focus', intentarReproducir);

    // Reintentar tras gestos del usuario (por si el navegador bloqueó autoplay)
    const reintentarPorGesto = () => {
      intentarReproducir();
      document.removeEventListener('click', reintentarPorGesto);
      document.removeEventListener('touchstart', reintentarPorGesto);
      document.removeEventListener('keydown', reintentarPorGesto);
    };
    document.addEventListener('click', reintentarPorGesto, { once: true });
    document.addEventListener('touchstart', reintentarPorGesto, { once: true });
    document.addEventListener('keydown', reintentarPorGesto, { once: true });
  }

  /* ============================================================
     7. PRECARGA DE IMÁGENES
     ============================================================ */
  function precargarImagenesCuento(key) {
    const cuento = DATOS[key];
    if (!cuento) return;

    cuento.cartas.forEach(c => {
      if (c.imagen) {
        const img = new Image();
        img.src = c.imagen;
      }
    });
  }

  function precargarTodasLasImagenes() {
    Object.keys(DATOS).forEach(key => precargarImagenesCuento(key));
  }

  /* ============================================================
     8. SONIDO
     ------------------------------------------------------------
     Ya no hay botón de mute en el HTML, así que el sonido queda
     activo por defecto. Si quieres silenciarlo, llama a
     sonido.desactivar() o cambia `activo = false` abajo.
     ============================================================ */
  const sonido = (function () {
    let ctx = null;
    let activo = true; // 🔊 Activo por defecto

    function init() {
      if (!ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) ctx = new AC();
        } catch (e) { /* silencioso */ }
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
    }

    function tono(freq, dur, tipo, vol) {
      if (!activo || !ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = tipo || 'sine';
        osc.frequency.value = freq;
        const ahora = ctx.currentTime;
        gain.gain.setValueAtTime(0, ahora);
        gain.gain.linearRampToValueAtTime(vol || 0.12, ahora + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, ahora + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ahora);
        osc.stop(ahora + dur + 0.02);
      } catch (e) { /* silencioso */ }
    }

    return {
      activar()    { activo = true; init(); },
      desactivar() { activo = false; },
      toggle()     { activo = !activo; if (activo) init(); return activo; },
      estaActivo() { return activo; },
      click()     { init(); tono(520, 0.07, 'sine', 0.08); },
      colocar()   { init(); tono(680, 0.12, 'triangle', 0.12); },
      quitar()    { init(); tono(420, 0.1, 'triangle', 0.1); },
      pista()     { init(); tono(760, 0.15, 'sine', 0.12); setTimeout(() => tono(1000, 0.18, 'sine', 0.12), 100); },
      correcto()  { init(); tono(880, 0.13, 'sine', 0.14); setTimeout(() => tono(1180, 0.2, 'sine', 0.14), 110); },
      incorrecto(){ init(); tono(240, 0.22, 'sawtooth', 0.09); },
      ganar()     { init(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tono(f, 0.28, 'sine', 0.16), i * 130)); },
      logro()     { init(); [660, 880, 1320].forEach((f, i) => setTimeout(() => tono(f, 0.2, 'triangle', 0.13), i * 100)); }
    };
  })();

  /* ============================================================
     9. TOASTS (entran desde la izquierda)
     ============================================================ */
  function mostrarToast(titulo, texto, tipo, emoji) {
    const cont = document.getElementById('toasts');
    const tpl = document.getElementById('plantilla-toast');
    const nodo = tpl.content.firstElementChild.cloneNode(true);

    nodo.classList.add('toast--' + (tipo || 'info'));
    nodo.querySelector('.toast__emoji').textContent = emoji || '🏆';
    nodo.querySelector('.toast__titulo').textContent = titulo;
    nodo.querySelector('.toast__texto').textContent = texto;

    cont.appendChild(nodo);

    setTimeout(() => {
      nodo.classList.add('saliendo');
      setTimeout(() => nodo.remove(), 380);
    }, TOAST_DURACION);
  }

  function toastLogro(logro) {
    mostrarToast('¡Logro desbloqueado!', logro.titulo, 'logro', logro.emoji);
    sonido.logro();
  }

  /* ============================================================
     10. MODAL
     ============================================================ */
  const modalEl = document.getElementById('modal');
  let modalOnConfirm = null;

  function abrirModal(opts) {
    document.getElementById('modal-emoji').textContent = opts.emoji || '❓';
    document.getElementById('modal-titulo').textContent = opts.titulo || '';
    document.getElementById('modal-texto').textContent = opts.texto || '';

    const btnConfirmar = document.getElementById('modal-confirmar');
    const btnCancelar = modalEl.querySelector('.modal__acciones .btn--secundario');

    btnConfirmar.textContent = opts.confirmar || 'Aceptar';
    if (btnCancelar) {
      btnCancelar.textContent = opts.cancelar || 'Cancelar';
      btnCancelar.style.display = opts.onCancel ? '' : 'none';
    }

    modalOnConfirm = opts.onConfirm || null;
    modalEl.hidden = false;
  }

  function cerrarModal() {
    modalEl.hidden = true;
    modalOnConfirm = null;
  }

  document.getElementById('modal-confirmar').addEventListener('click', () => {
    const cb = modalOnConfirm;
    cerrarModal();
    if (typeof cb === 'function') cb();
  });

  modalEl.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-cerrar-modal')) cerrarModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalEl.hidden) cerrarModal();
  });

  /* ============================================================
     11. NAVEGACIÓN
     ============================================================ */
  function irA(pantalla) {
    document.querySelectorAll('.pantalla').forEach(p => {
      p.classList.toggle('pantalla--activa', p.dataset.pantalla === pantalla);
    });
    estado.pantalla = pantalla;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pantalla === 'seleccion') actualizarPanelSeleccion();
    if (pantalla === 'inicio') actualizarStatsInicio();
  }

  /* ============================================================
     12. CREACIÓN DE NODOS
     ------------------------------------------------------------
     ⚠️ La carta ya NO incluye <p class="carta__texto"> en el HTML
     porque el texto del cuento ya viene dentro de la imagen.
     ============================================================ */
  function crearCarta(carta) {
    const tpl = document.getElementById('plantilla-carta');
    const el = tpl.content.firstElementChild.cloneNode(true);

    el.dataset.id = carta.id;
    el.setAttribute('aria-label', carta.texto || 'Carta del cuento');

    const img = el.querySelector('.carta__imagen');
    const emoji = el.querySelector('.carta__emoji');

    // Emoji siempre como respaldo
    emoji.textContent = carta.emoji;

    // 🖼️ Imagen con fallback automático
    // Las rutas vienen con el prefijo "Recursos/" desde el JSON del HTML
    if (carta.imagen) {
      img.alt = carta.texto || '';

      img.style.display = 'block';
      emoji.style.display = 'none';

      img.onload = () => {
        img.style.display = 'block';
        emoji.style.display = 'none';
      };

      img.onerror = () => {
        img.style.display = 'none';
        emoji.style.display = 'flex';
      };

      img.src = carta.imagen;
    } else {
      img.style.display = 'none';
      emoji.style.display = 'flex';
    }

    return el;
  }

  function crearHueco(indice) {
    const tpl = document.getElementById('plantilla-hueco');
    const el = tpl.content.firstElementChild.cloneNode(true);

    el.dataset.indice = indice;
    el.querySelector('.hueco__numero').textContent = indice + 1;
    el.querySelector('.hueco__pista').textContent = 'Suelta aquí la carta';

    return el;
  }

  /* ============================================================
     13. RENDER
     ============================================================ */
  function render() {
    renderMazo();
    renderLinea();
    actualizarCabecera();
  }

  function renderMazo() {
    const mazoEl = document.getElementById('mazo');
    mazoEl.innerHTML = '';

    if (estado.mazo.length === 0) {
      mazoEl.classList.add('vacio');
    } else {
      mazoEl.classList.remove('vacio');
      estado.mazo.forEach(id => {
        const carta = buscarCarta(id);
        if (!carta) return;
        mazoEl.appendChild(crearCarta(carta));
      });
    }

    document.getElementById('mazo-contador').textContent =
      estado.mazo.length === 1 ? '1 carta' : `${estado.mazo.length} cartas`;
  }

  function renderLinea() {
    const lineaEl = document.getElementById('linea');
    lineaEl.innerHTML = '';

    estado.linea.forEach((id, idx) => {
      const hueco = crearHueco(idx);

      if (id !== null) {
        hueco.classList.add('lleno');
        const carta = buscarCarta(id);
        if (carta) hueco.appendChild(crearCarta(carta));
      }

      lineaEl.appendChild(hueco);
    });

    const colocadas = estado.linea.filter(x => x !== null).length;
    document.getElementById('linea-contador').textContent =
      `${colocadas}/${estado.cartas.length}`;
  }

  function actualizarCabecera() {
    const total = estado.cartas.length || 0;
    const colocadas = estado.linea.filter(x => x !== null).length;
    const pct = total > 0 ? (colocadas / total) * 100 : 0;

    const fill = document.getElementById('juego-progreso-fill');
    if (fill) {
      fill.style.width = pct + '%';
      fill.classList.toggle('completo', colocadas === total);
    }

    document.getElementById('juego-progreso').textContent =
      `${colocadas} de ${total} cartas colocadas`;

    document.getElementById('juego-intentos').textContent = estado.intentos;
    document.getElementById('juego-pistas').textContent =
      Math.max(0, MAX_PISTAS - estado.pistasUsadas);
    document.getElementById('juego-tiempo').textContent = formatearTiempo(estado.tiempo);

    const btnPista = document.getElementById('btn-pista');
    if (btnPista) {
      btnPista.disabled = (MAX_PISTAS - estado.pistasUsadas) <= 0 || estado.resuelto;
    }

    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) {
      const hayCartasEnLinea = estado.linea.some(x => x !== null);
      btnUndo.disabled = !hayCartasEnLinea || estado.resuelto;
    }

    const btnComprobar = document.getElementById('btn-comprobar');
    if (btnComprobar) btnComprobar.disabled = estado.resuelto;

    const btnReiniciar = document.getElementById('btn-reiniciar');
    if (btnReiniciar) btnReiniciar.disabled = estado.resuelto;
  }

  /* ============================================================
     14. INICIO DE CUENTO
     ============================================================ */
  function iniciarCuento(key) {
    const cuento = DATOS[key];
    if (!cuento) {
      console.warn('Cuento no encontrado:', key);
      return;
    }

    estado.cuentoKey = key;
    estado.cuento = cuento;

    estado.cartas = cuento.cartas.map((c, i) => ({
      id: 'c' + i,
      emoji: c.emoji,
      imagen: c.imagen || '',
      texto: c.texto,
      orden: i
    }));

    // Mazo desordenado
    estado.mazo = estado.cartas.map(c => c.id);
    barajar(estado.mazo);

    let intentosMezcla = 0;
    while (estado.mazo.every((id, i) => buscarCarta(id).orden === i) && intentosMezcla < 10) {
      barajar(estado.mazo);
      intentosMezcla++;
    }

    estado.linea = new Array(estado.cartas.length).fill(null);
    estado.ordenColocacion = [];
    estado.intentos = 0;
    estado.pistasUsadas = 0;
    estado.resuelto = false;
    estado.estrellas = 0;
    estado.tiempo = 0;

    document.getElementById('juego-titulo').textContent = cuento.titulo;
    const estrellasEl = document.getElementById('juego-estrellas');
    estrellasEl.textContent = '☆☆☆';
    estrellasEl.classList.remove('animar');

    if (!progreso.cuentosProbados.includes(key)) {
      progreso.cuentosProbados.push(key);
      guardarProgreso();
    }

    // Pre-cargar las imágenes de este cuento
    precargarImagenesCuento(key);

    detenerTimer();
    estado.timerId = setInterval(() => {
      estado.tiempo++;
      document.getElementById('juego-tiempo').textContent = formatearTiempo(estado.tiempo);
    }, 1000);

    render();
    irA('juego');
  }

  function detenerTimer() {
    if (estado.timerId) {
      clearInterval(estado.timerId);
      estado.timerId = null;
    }
  }

  /* ============================================================
     15. COLOCAR Y DEVOLVER CARTAS
     ============================================================ */

  function colocarCarta(id, huecoIdx) {
    if (estado.resuelto) return;
    if (huecoIdx < 0 || huecoIdx >= estado.linea.length) return;

    // Si el hueco ya tenía otra carta, la devolvemos al mazo
    const existente = estado.linea[huecoIdx];
    if (existente && existente !== id) {
      estado.mazo.push(existente);
      estado.ordenColocacion = estado.ordenColocacion.filter(i => i !== huecoIdx);
    }

    // Quitamos la carta del mazo
    const idxMazo = estado.mazo.indexOf(id);
    if (idxMazo > -1) estado.mazo.splice(idxMazo, 1);

    // Quitamos la carta de cualquier otro hueco (por si se mueve)
    for (let i = 0; i < estado.linea.length; i++) {
      if (estado.linea[i] === id) {
        estado.linea[i] = null;
        estado.ordenColocacion = estado.ordenColocacion.filter(idx => idx !== i);
      }
    }

    // Colocamos
    estado.linea[huecoIdx] = id;
    estado.ordenColocacion.push(huecoIdx);

    sonido.colocar();
    render();
  }

  function colocarCartaAutomatica(id) {
    if (estado.resuelto) return;

    const primerVacio = estado.linea.findIndex(x => x === null);
    if (primerVacio === -1) {
      mostrarMensaje('¡No hay huecos vacíos! Devuelve alguna carta primero 🤔', 'info');
      return;
    }

    colocarCarta(id, primerVacio);
  }

  function devolverAlMazo(id) {
    if (estado.resuelto) return;
    if (!estado.linea.includes(id)) return;

    for (let i = 0; i < estado.linea.length; i++) {
      if (estado.linea[i] === id) {
        estado.linea[i] = null;
        estado.ordenColocacion = estado.ordenColocacion.filter(idx => idx !== i);
        break;
      }
    }

    if (!estado.mazo.includes(id)) estado.mazo.push(id);

    sonido.quitar();
    render();
  }

  /* ============================================================
     16. DESHACER · Quita SOLO la última carta colocada
     ============================================================ */
  function deshacer() {
    if (estado.resuelto) return;

    while (estado.ordenColocacion.length > 0) {
      const ultimoIdx = estado.ordenColocacion.pop();
      const id = estado.linea[ultimoIdx];

      if (id !== null && id !== undefined) {
        estado.linea[ultimoIdx] = null;
        if (!estado.mazo.includes(id)) estado.mazo.push(id);

        sonido.quitar();
        render();
        mostrarMensaje(`Se devolvió la carta del hueco ${ultimoIdx + 1}`, 'info');
        return;
      }
    }

    mostrarMensaje('No hay cartas para deshacer', 'info');
    actualizarCabecera();
  }

  /* ============================================================
     17. COMPROBAR
     ============================================================ */
  function comprobar() {
    if (estado.resuelto) return;

    if (estado.linea.some(x => x === null)) {
      mostrarMensaje('¡Aún faltan cartas por colocar! 🃏', 'error');
      return;
    }

    estado.intentos++;
    actualizarCabecera();

    let todoCorrecto = true;
    estado.linea.forEach((id, idx) => {
      const carta = buscarCarta(id);
      if (!carta || carta.orden !== idx) todoCorrecto = false;
    });

    marcarResultado();

    if (todoCorrecto) {
      sonido.correcto();
      ganar();
    } else {
      sonido.incorrecto();
      mostrarMensaje('¡Casi! Algunas cartas están fuera de lugar 🤔', 'error');
    }
  }

  function marcarResultado() {
    const huecos = document.querySelectorAll('#linea .hueco');

    huecos.forEach((hueco, idx) => {
      const id = estado.linea[idx];
      const carta = buscarCarta(id);
      if (!carta) return;

      if (carta.orden === idx) {
        hueco.classList.add('correcto');
      } else {
        hueco.classList.add('incorrecto');
      }
    });

    setTimeout(() => {
      document.querySelectorAll('#linea .hueco').forEach(h => {
        h.classList.remove('correcto', 'incorrecto');
      });
    }, 1400);
  }

  /* ============================================================
     18. PISTA
     ============================================================ */
  function darPista() {
    if (estado.resuelto) return;

    if (estado.pistasUsadas >= MAX_PISTAS) {
      mostrarMensaje('¡No te quedan más pistas! 💡', 'error');
      return;
    }

    for (let i = 0; i < estado.linea.length; i++) {
      const id = estado.linea[i];
      const carta = id ? buscarCarta(id) : null;

      if (!carta || carta.orden !== i) {
        if (id) {
          estado.mazo.push(id);
          estado.linea[i] = null;
          estado.ordenColocacion = estado.ordenColocacion.filter(idx => idx !== i);
        }

        const correcta = estado.cartas.find(c => c.orden === i);
        if (!correcta) return;

        const idxMazo = estado.mazo.indexOf(correcta.id);
        if (idxMazo > -1) estado.mazo.splice(idxMazo, 1);

        for (let j = 0; j < estado.linea.length; j++) {
          if (estado.linea[j] === correcta.id) {
            estado.linea[j] = null;
            estado.ordenColocacion = estado.ordenColocacion.filter(idx => idx !== j);
          }
        }

        estado.linea[i] = correcta.id;
        estado.ordenColocacion.push(i);
        estado.pistasUsadas++;

        sonido.pista();
        render();

        const huecoEl = document.querySelector(`#linea .hueco[data-indice="${i}"]`);
        if (huecoEl) {
          huecoEl.classList.add('hint');
          setTimeout(() => huecoEl.classList.remove('hint'), 2400);
        }

        mostrarMensaje(`Pista: esta carta va en el hueco ${i + 1} 💡`, 'info');
        return;
      }
    }

    mostrarMensaje('¡Ya está todo en orden! Pulsa Comprobar ✅', 'info');
  }

  /* ============================================================
     19. GANAR
     ============================================================ */
  function calcularEstrellas() {
    let e = 3;
    e -= estado.pistasUsadas;
    e -= Math.max(0, estado.intentos - 1);
    if (estado.tiempo > 180) e -= 1;
    return Math.max(1, Math.min(3, e));
  }

  function ganar() {
    estado.resuelto = true;
    detenerTimer();
    sonido.ganar();

    const estrellas = calcularEstrellas();
    estado.estrellas = estrellas;

    const estrellasEl = document.getElementById('juego-estrellas');
    estrellasEl.textContent = '⭐'.repeat(estrellas) + '☆'.repeat(3 - estrellas);
    estrellasEl.classList.add('animar');
    setTimeout(() => estrellasEl.classList.remove('animar'), 600);

    const previas = progreso.estrellasPorCuento[estado.cuentoKey] || 0;
    if (estrellas > previas) {
      progreso.estrellasPorCuento[estado.cuentoKey] = estrellas;
    }
    progreso.partidasJugadas++;
    guardarProgreso();

    lanzarConfeti();
    mostrarMensaje('¡Perfecto! Has ordenado el cuento 🎉', 'exito');

    actualizarCabecera();

    setTimeout(() => comprobarLogros(estrellas), 500);
    setTimeout(() => mostrarFinal(estrellas), 1600);
  }

  /* ============================================================
     20. LOGROS
     ============================================================ */
  function comprobarLogros(estrellasPartida) {
    const ctx = {
      estrellasPartida,
      tiempo: estado.tiempo,
      intentos: estado.intentos,
      pistasUsadas: estado.pistasUsadas,
      cuentoKey: estado.cuentoKey
    };

    const nuevos = [];
    LOGROS_DEF.forEach(logro => {
      if (progreso.logros.includes(logro.id)) return;
      if (cumpleLogro(logro.id, ctx)) {
        progreso.logros.push(logro.id);
        nuevos.push(logro);
      }
    });

    if (nuevos.length > 0) {
      guardarProgreso();
      nuevos.forEach((l, i) => setTimeout(() => toastLogro(l), i * 700));
    }
  }

  function cumpleLogro(id, ctx) {
    switch (id) {
      case 'primer_cuento': return Object.keys(progreso.estrellasPorCuento).length >= 1;
      case 'sin_pistas':    return ctx.pistasUsadas === 0;
      case 'perfecto':      return ctx.estrellasPartida === 3;
      case 'coleccionista': return Object.keys(progreso.estrellasPorCuento).length >= 6;
      case 'veloz':         return ctx.tiempo <= 45;
      case 'maestro':       return Object.values(progreso.estrellasPorCuento).filter(v => v === 3).length >= 3;
      case 'explorador':    return progreso.cuentosProbados.length >= 6;
      case 'preciso':       return ctx.intentos === 1;
      case 'corona':        return sumaEstrellas() >= 18;
      default: return false;
    }
  }

  /* ============================================================
     21. PANTALLA FINAL
     ============================================================ */
  function mostrarFinal(estrellas) {
    const config = {
      3: { emoji: '🏆', titulo: '¡Increíble!',    mensaje: '¡Eres un maestro de los cuentos! Lo has ordenado todo perfectamente.' },
      2: { emoji: '🌟', titulo: '¡Muy bien!',     mensaje: '¡Casi perfecto! Solo un pequeño desliz, pero lo has conseguido.' },
      1: { emoji: '👏', titulo: '¡Buen trabajo!', mensaje: '¡Lo lograste! Sigue practicando para ganar más estrellas.' }
    };

    const c = config[estrellas] || config[1];

    document.getElementById('final-emoji').textContent = c.emoji;
    document.getElementById('final-titulo').textContent = c.titulo;
    document.getElementById('final-mensaje').textContent = c.mensaje;
    document.getElementById('final-estrellas').textContent =
      '⭐'.repeat(estrellas) + '☆'.repeat(3 - estrellas);

    document.getElementById('final-tiempo').textContent = formatearTiempo(estado.tiempo);
    document.getElementById('final-intentos').textContent = estado.intentos;
    document.getElementById('final-pistas').textContent = estado.pistasUsadas;

    const contenedorLogros = document.getElementById('final-logros');
    contenedorLogros.innerHTML = '';

    const logrosRecientes = progreso.logros.slice(-3);
    logrosRecientes.forEach(id => {
      const def = LOGROS_DEF.find(l => l.id === id);
      if (!def) return;
      const badge = document.createElement('div');
      badge.className = 'logro-badge';
      badge.innerHTML = `<span class="logro-badge__emoji">${def.emoji}</span><span>${def.titulo}</span>`;
      contenedorLogros.appendChild(badge);
    });

    irA('final');
  }

  /* ============================================================
     22. CONFETI
     ============================================================ */
  function lanzarConfeti() {
    const cont = document.getElementById('confeti');
    cont.innerHTML = '';

    const colores = ['#ff5b6e', '#ffd23f', '#63c96b', '#4aa9ff', '#a06bff', '#ff9d3d', '#ffffff'];
    const total = 110;

    for (let i = 0; i < total; i++) {
      const pieza = document.createElement('div');
      pieza.className = 'confeti__pieza';

      const tamano = 8 + Math.random() * 10;
      const esCirculo = Math.random() > 0.55;

      pieza.style.left = Math.random() * 100 + '%';
      pieza.style.width = tamano + 'px';
      pieza.style.height = (esCirculo ? tamano : tamano * 1.6) + 'px';
      pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
      pieza.style.borderRadius = esCirculo ? '50%' : '3px';
      pieza.style.animationDuration = (2.2 + Math.random() * 2.4) + 's';
      pieza.style.animationDelay = (Math.random() * 0.8) + 's';
      pieza.style.opacity = 0.75 + Math.random() * 0.25;

      cont.appendChild(pieza);
    }

    setTimeout(() => { cont.innerHTML = ''; }, 5600);
  }

  /* ============================================================
     23. MENSAJES FLOTANTES
     ============================================================ */
  function mostrarMensaje(texto, tipo) {
    const el = document.getElementById('mensaje');
    el.textContent = texto;
    el.className = 'mensaje visible ' + (tipo || 'info');
    clearTimeout(mensajeTimeout);
    mensajeTimeout = setTimeout(() => el.classList.remove('visible'), 2800);
  }

  /* ============================================================
     24. INTERACCIÓN · CLICK / TAP
     ============================================================ */
  document.addEventListener('click', (e) => {
    if (dragEnProgreso) return;

    const cartaEl = e.target.closest('.carta');
    if (cartaEl) {
      const id = cartaEl.dataset.id;
      const enLinea = estado.linea.includes(id);

      if (enLinea) {
        devolverAlMazo(id);
      } else {
        colocarCartaAutomatica(id);
      }
      return;
    }

    const huecoEl = e.target.closest('.hueco');
    if (huecoEl) {
      const idx = parseInt(huecoEl.dataset.indice, 10);
      const id = estado.linea[idx];
      if (id) {
        devolverAlMazo(id);
      }
    }
  });

  /* ============================================================
     25. TECLADO EN CARTAS
     ============================================================ */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;

    const cartaEl = e.target.closest('.carta');
    if (!cartaEl) return;

    e.preventDefault();

    const id = cartaEl.dataset.id;
    const enLinea = estado.linea.includes(id);

    if (enLinea) {
      devolverAlMazo(id);
    } else {
      colocarCartaAutomatica(id);
    }
  });

  /* ============================================================
     26. DRAG & DROP
     ============================================================ */
  document.addEventListener('dragstart', (e) => {
    const cartaEl = e.target.closest('.carta');
    if (!cartaEl || estado.resuelto) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData('text/plain', cartaEl.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
    cartaEl.classList.add('arrastrando');
    dragEnProgreso = true;
  });

  document.addEventListener('dragend', (e) => {
    const cartaEl = e.target.closest('.carta');
    if (cartaEl) cartaEl.classList.remove('arrastrando');

    document.querySelectorAll('.hueco.destino').forEach(h => h.classList.remove('destino'));

    setTimeout(() => { dragEnProgreso = false; }, 80);
  });

  document.addEventListener('dragover', (e) => {
    const huecoEl = e.target.closest('.hueco');
    if (huecoEl) {
      e.preventDefault();
      huecoEl.classList.add('destino');
      return;
    }
    if (e.target.closest('#mazo')) e.preventDefault();
  });

  document.addEventListener('dragleave', (e) => {
    const huecoEl = e.target.closest('.hueco');
    if (huecoEl) huecoEl.classList.remove('destino');
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();

    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const huecoEl = e.target.closest('.hueco');
    if (huecoEl) {
      const idx = parseInt(huecoEl.dataset.indice, 10);
      colocarCarta(id, idx);
      return;
    }

    if (e.target.closest('#mazo')) {
      devolverAlMazo(id);
    }
  });

  /* ============================================================
     27. FILTROS
     ============================================================ */
  function aplicarFiltro(filtro) {
    estado.filtro = filtro;

    document.querySelectorAll('.filtro').forEach(btn => {
      const activo = btn.dataset.filtro === filtro;
      btn.classList.toggle('filtro--activo', activo);
      btn.setAttribute('aria-selected', activo ? 'true' : 'false');
    });

    document.querySelectorAll('.cuento').forEach(c => {
      const dif = c.dataset.dificultad;
      const ocultar = filtro !== 'todos' && dif !== filtro;
      c.classList.toggle('oculto', ocultar);
    });
  }

  /* ============================================================
     28. VISTAS AUXILIARES
     ============================================================ */
  function actualizarStatsInicio() {
    document.getElementById('stats-estrellas').textContent = sumaEstrellas();
    document.getElementById('stats-cuentos').textContent =
      `${Object.keys(progreso.estrellasPorCuento).length}/6`;
    document.getElementById('stats-logros').textContent =
      `${progreso.logros.length}/${LOGROS_DEF.length}`;
  }

  function actualizarPanelSeleccion() {
    document.querySelectorAll('.cuento').forEach(c => {
      const key = c.dataset.cuento;
      const mini = c.querySelector('.cuento__estrellas-mini');
      if (!mini) return;

      const e = progreso.estrellasPorCuento[key] || 0;
      mini.textContent = '⭐'.repeat(e) + '☆'.repeat(3 - e);
    });
  }

  /* ============================================================
     29. CONFIRMAR SALIDA
     ============================================================ */
  function confirmarSalida(callback) {
    const sinProgreso = estado.linea.every(x => x === null);

    if (estado.resuelto || sinProgreso) {
      detenerTimer();
      callback();
      return;
    }

    abrirModal({
      emoji: '🚪',
      titulo: '¿Salir del juego?',
      texto: 'Perderás el progreso de esta partida.',
      confirmar: 'Salir',
      cancelar: 'Seguir jugando',
      onConfirm: () => {
        detenerTimer();
        callback();
      },
      onCancel: () => {}
    });
  }

  /* ============================================================
     30. INICIALIZACIÓN
     ============================================================ */
  function inicializar() {
    cargarProgreso();
    actualizarStatsInicio();

    // Video de fondo
    inicializarVideoFondo();

    // Pre-cargar imágenes (con pequeño delay para no bloquear el arranque)
    setTimeout(precargarTodasLasImagenes, 800);

    // Navegación con data-ir
    document.querySelectorAll('[data-ir]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destino = btn.dataset.ir;

        if (estado.pantalla === 'juego' && destino !== 'juego') {
          confirmarSalida(() => {
            sonido.click();
            irA(destino);
          });
          return;
        }

        sonido.click();
        irA(destino);
      });
    });

    // Selección de cuento
    document.querySelectorAll('.cuento').forEach(btn => {
      btn.addEventListener('click', () => {
        sonido.click();
        const key = btn.dataset.cuento;
        if (key) iniciarCuento(key);
      });
    });

    // Filtros
    document.querySelectorAll('.filtro').forEach(btn => {
      btn.addEventListener('click', () => {
        sonido.click();
        aplicarFiltro(btn.dataset.filtro);
      });
    });

    // Botones del juego
    const btnComprobar = document.getElementById('btn-comprobar');
    if (btnComprobar) btnComprobar.addEventListener('click', () => { sonido.click(); comprobar(); });

    const btnPista = document.getElementById('btn-pista');
    if (btnPista) btnPista.addEventListener('click', () => darPista());

    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) btnUndo.addEventListener('click', () => deshacer());

    const btnReiniciar = document.getElementById('btn-reiniciar');
    if (btnReiniciar) {
      btnReiniciar.addEventListener('click', () => {
        abrirModal({
          emoji: '🔄',
          titulo: '¿Reiniciar el cuento?',
          texto: 'Volverás a empezar desde el principio.',
          confirmar: 'Sí, reiniciar',
          cancelar: 'Cancelar',
          onConfirm: () => { if (estado.cuentoKey) iniciarCuento(estado.cuentoKey); },
          onCancel: () => {}
        });
      });
    }

    // Botón salir
    const btnSalir = document.getElementById('btn-salir');
    if (btnSalir) {
      btnSalir.addEventListener('click', () => {
        confirmarSalida(() => {
          sonido.click();
          irA('seleccion');
        });
      });
    }

    // Otra vez
    const btnOtraVez = document.getElementById('btn-otra-vez');
    if (btnOtraVez) {
      btnOtraVez.addEventListener('click', () => {
        sonido.click();
        if (estado.cuentoKey) iniciarCuento(estado.cuentoKey);
      });
    }

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
      if (estado.pantalla !== 'juego') return;
      if (!modalEl.hidden) return;

      const tag = (e.target.tagName || '').toLowerCase();
      const enInput = tag === 'input' || tag === 'textarea';

      if (e.key === 'Enter' && !enInput && !e.target.closest('.carta')) {
        comprobar();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        confirmarSalida(() => irA('seleccion'));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        deshacer();
      }
      if ((e.key === 'h' || e.key === 'H') && !enInput) {
        darPista();
      }
    });

    // Prevenir gestos accidentales en pizarra
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    document.addEventListener('dragover', (e) => {
      if (e.target === document.documentElement) e.preventDefault();
    });
  }

  /* ============================================================
     31. ARRANQUE
     ============================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

})();