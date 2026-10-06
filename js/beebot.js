/* ============================================================
   AVENTURAS DE BEEBOT — JAVASCRIPT PRINCIPAL
   Versión 5.0 — Jardín Primaveral Profesional
   ------------------------------------------------------------
   Módulos:
     1.  Utilidades
     2.  Año dinámico del footer
     3.  Sistema de audio sintetizado (Web Audio API)
     4.  Música de fondo (cancion19.mp3)
     5.  Botón flotante de sonido
     6.  Header: scroll, progreso y auto-ocultado
     7.  Menú móvil desplegable
     8.  Scroll suave por anclas
     9.  Efectos ripple + hover
     10. Reveal escalonado
     11. Filtros por categoría
     12. Indicador de navegación activa
     13. BeeBot: saludo + reacción al click
     14. Accesibilidad por teclado
     15. VISOR DE JUEGO (misma página, pantalla completa)
     16. API global
   ============================================================ */

'use strict';

/* ============================================================
   1. UTILIDADES
   ============================================================ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const store = {
    get(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            return val === null ? fallback : JSON.parse(val);
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ============================================================
   2. AÑO DINÁMICO EN EL FOOTER
   ============================================================ */
(function setYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ============================================================
   3. SISTEMA DE AUDIO SINTETIZADO (Web Audio API)
   ============================================================ */
const Sound = (() => {
    let enabled = store.get('bee_sound_enabled', true);
    let audioCtx = null;

    function getContext() {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            audioCtx = new AC();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function tone(freq = 440, duration = 0.12, type = 'sine', volume = 0.14) {
        if (!enabled) return;
        const ctx = getContext();
        if (!ctx) return;

        try {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch {}
    }

    function click()   { tone(660, 0.05, 'square', 0.07); }
    function hover()   { tone(880, 0.03, 'sine', 0.03); }

    function filterSelect() {
        tone(720, 0.06, 'triangle', 0.10);
        setTimeout(() => tone(880, 0.08, 'triangle', 0.10), 50);
    }

    function openGame() {
        tone(523.25, 0.10, 'triangle', 0.14);
        setTimeout(() => tone(659.25, 0.10, 'triangle', 0.14), 90);
        setTimeout(() => tone(783.99, 0.16, 'triangle', 0.14), 180);
    }

    function beebotGreeting() {
        tone(880, 0.10, 'sine', 0.10);
        setTimeout(() => tone(1100, 0.15, 'sine', 0.10), 100);
    }

    function beebotGiggle() {
        tone(1046, 0.06, 'triangle', 0.09);
        setTimeout(() => tone(1318, 0.06, 'triangle', 0.09), 70);
        setTimeout(() => tone(1568, 0.10, 'triangle', 0.09), 140);
    }

    function comingSoon() {
        tone(500, 0.10, 'triangle', 0.09);
        setTimeout(() => tone(400, 0.14, 'triangle', 0.09), 100);
    }

    return {
        isEnabled: () => enabled,
        toggle() {
            enabled = !enabled;
            store.set('bee_sound_enabled', enabled);
            return enabled;
        },
        click, hover, filterSelect, openGame,
        beebotGreeting, beebotGiggle, comingSoon, tone
    };
})();


/* ============================================================
   4. MÚSICA DE FONDO (cancion19.mp3)
   ------------------------------------------------------------
   Controla el <audio id="bgm">. Pausa automáticamente cuando
   se abre un juego y reanuda al cerrarlo.
   ============================================================ */
const BGM = (() => {
    const audio = $('#bgm');
    if (!audio) return {
        play: () => {}, pause: () => {}, resume: () => {},
        pauseForGame: () => {}, resumeFromGame: () => {},
        mute: () => {}, unmute: () => {},
        isPaused: () => true
    };

    audio.volume = 0.28;
    audio.loop   = true;

    let pausedByGame = false;
    let pausedByUser = false;

    function play() {
        audio.play().catch(() => {});
    }
    function pause() {
        if (!audio.paused) audio.pause();
    }
    function resume() {
        if (audio.paused && !pausedByUser && !pausedByGame) {
            audio.play().catch(() => {});
        }
    }

    function pauseForGame() {
        pausedByGame = true;
        pause();
    }
    function resumeFromGame() {
        pausedByGame = false;
        resume();
    }

    function mute() {
        pausedByUser = true;
        pause();
    }
    function unmute() {
        pausedByUser = false;
        play();
    }

    return {
        play, pause, resume,
        pauseForGame, resumeFromGame,
        mute, unmute,
        isPaused: () => audio.paused
    };
})();


/* ============================================================
   5. BOTÓN FLOTANTE DE SONIDO
   ============================================================ */
(function initSoundToggle() {
    const btn = $('#soundToggle');
    if (!btn) return;

    let isMuted = store.get('bee_muted_global', false);
    applyState();

    btn.addEventListener('click', () => {
        isMuted = !isMuted;
        store.set('bee_muted_global', isMuted);
        applyState();

        if (!isMuted) {
            Sound.tone(880, 0.12, 'sine', 0.12);
            BGM.unmute();
        } else {
            BGM.mute();
        }
    });

    function applyState() {
        if (isMuted) {
            btn.classList.add('is-muted');
            btn.innerHTML = '<span class="sound-icon sound-off">🔇</span>';
        } else {
            btn.classList.remove('is-muted');
            btn.innerHTML = '<span class="sound-icon sound-on">🔊</span>';
        }
    }
})();


/* ============================================================
   6. HEADER: SCROLL, PROGRESO Y AUTO-OCULTADO
   ============================================================ */
(function initHeaderScroll() {
    const header   = $('#siteHeader');
    const progress = $('#scrollProgress');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function update() {
        const y = window.scrollY;

        header.classList.toggle('is-scrolled', y > 40);

        if (progress) {
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            const pct  = docH > 0 ? (y / docH) * 100 : 0;
            progress.style.width = pct + '%';
        }

        if (y > 400 && y > lastScrollY + 10) {
            header.style.transform = 'translateY(-140%)';
        } else if (y < lastScrollY - 10 || y < 400) {
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = y;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    header.style.transition = 'transform .35s cubic-bezier(.22,.61,.36,1), background .35s, box-shadow .35s, border-color .35s';
    update();
})();


/* ============================================================
   7. MENÚ MÓVIL DESPLEGABLE
   ============================================================ */
(function initMobileMenu() {
    const toggleBtn = $('#menuToggle');
    const mainNav   = $('.main-nav');
    if (!toggleBtn || !mainNav) return;

    function close() {
        mainNav.classList.remove('is-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = mainNav.classList.toggle('is-open');
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
        Sound.click();
    });

    $$('.nav-btn', mainNav).forEach(link => link.addEventListener('click', close));

    document.addEventListener('click', (e) => {
        if (!mainNav.classList.contains('is-open')) return;
        if (!mainNav.contains(e.target) && !toggleBtn.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
})();


/* ============================================================
   8. SCROLL SUAVE POR ANCLAS
   ============================================================ */
(function initSmoothScroll() {
    const header = $('#siteHeader');

    function scrollTo(target) {
        const el = typeof target === 'string' ? $(target) : target;
        if (!el) return;

        const headerH = header ? header.offsetHeight : 80;
        const top = el.getBoundingClientRect().top + window.scrollY - headerH - 20;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    $$('[data-scroll]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            Sound.click();
            scrollTo(btn.dataset.scroll);
        });
    });

    $$('a[href^="#"]').forEach(anchor => {
        if (anchor.target === '_blank') return;
        if (anchor.dataset.scroll) return;

        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;

            const target = $(href);
            if (!target) return;

            e.preventDefault();
            Sound.click();
            scrollTo(target);
        });
    });

    window.AE_scrollTo = scrollTo;
})();


/* ============================================================
   9. EFECTOS RIPPLE Y HOVER
   ============================================================ */
(function initButtonEffects() {
    function ripple(button, event) {
        if (prefersReducedMotion) return;

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.3;

        const span = document.createElement('span');
        span.className = 'ripple';
        Object.assign(span.style, {
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%) scale(0)',
            transition: 'transform .6s cubic-bezier(0,0,.2,1), opacity .6s ease',
            opacity: '1'
        });

        const x = (event.clientX ?? (rect.left + rect.width / 2)) - rect.left;
        const y = (event.clientY ?? (rect.top + rect.height / 2)) - rect.top;
        span.style.left = x + 'px';
        span.style.top  = y + 'px';

        if (getComputedStyle(button).position === 'static') {
            button.style.position = 'relative';
        }
        button.style.overflow = 'hidden';
        button.appendChild(span);

        requestAnimationFrame(() => {
            span.style.transform = 'translate(-50%, -50%) scale(1)';
            span.style.opacity = '0';
        });
        setTimeout(() => span.remove(), 650);
    }

    $$('.filter-btn, .btn-hero-inicial, .btn-show-all, .nav-btn, .btn-cerrar-juego').forEach(btn => {
        btn.addEventListener('click', (e) => ripple(btn, e));

        if (!prefersReducedMotion && !('ontouchstart' in window)) {
            btn.addEventListener('mouseenter', () => Sound.hover());
        }
    });
})();


/* ============================================================
   10. REVEAL ESCALONADO AL HACER SCROLL
   ============================================================ */
(function initRevealOnScroll() {
    const elements = $$('.reveal-child');
    if (!elements.length) return;

    if (prefersReducedMotion) {
        elements.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
    });

    elements.forEach(el => observer.observe(el));
})();




/* ============================================================
   PORTADAS DINÁMICAS SILENCIOSAS
   ------------------------------------------------------------
   Cada miniatura carga el HTML real del juego, pero el sandbox
   impide ejecutar sus scripts. Como protección adicional, todo
   audio/video encontrado dentro de la vista previa se silencia.
   ============================================================ */
(function initSilentDynamicPreviews() {
    const PREVIEW_W = 1920;
    const PREVIEW_H = 1080;

    function fitPreview(frame) {
        const box = frame.closest('.game-card-thumb');
        if (!box) return;
        const scale = Math.min(box.clientWidth / PREVIEW_W, box.clientHeight / PREVIEW_H);
        frame.style.setProperty('--preview-scale', String(scale));
    }

    $$('.dynamic-thumb').forEach(frame => {
        fitPreview(frame);
        if ('ResizeObserver' in window) {
            const box = frame.closest('.game-card-thumb');
            if (box) new ResizeObserver(() => fitPreview(frame)).observe(box);
        }
        const silencePreview = () => {
            try {
                const doc = frame.contentDocument;
                if (!doc) return;

                doc.querySelectorAll('audio, video').forEach(media => {
                    media.muted = true;
                    media.volume = 0;
                    try { media.pause(); } catch {}
                    media.removeAttribute('autoplay');
                });
            } catch {}
        };

        frame.addEventListener('load', () => {
            silencePreview();
            setTimeout(silencePreview, 100);
            setTimeout(silencePreview, 500);
        });
    });
})();


/* ============================================================
   11. FILTROS POR CATEGORÍA
   ------------------------------------------------------------
   • Muestra/oculta secciones según el filtro
   • Recalcula contadores automáticamente
   • Muestra mensaje vacío si no hay nada
   ============================================================ */
(function initFilters() {
    const filterBtns  = $$('.filter-btn');
    const sections    = $$('.games-section');
    const gamesEmpty  = $('#gamesEmpty');
    const showAllBtn  = $('.btn-show-all');

    if (!filterBtns.length || !sections.length) return;

    function updateCounters() {
        const counts = { all: 0 };

        sections.forEach(sec => {
            const category = sec.dataset.section;
            const numGames = $$('.game-card', sec).length;
            counts[category] = numGames;
            counts.all += numGames;
        });

        $$('[data-count]').forEach(el => {
            const key = el.dataset.count;
            el.textContent = counts[key] ?? 0;
        });
    }

    function applyFilter(filter) {
        let visibleSections = 0;

        sections.forEach(sec => {
            const isTarget = (filter === 'all') || (sec.dataset.section === filter);
            sec.classList.toggle('is-hidden', !isTarget);
            if (isTarget) visibleSections++;
        });

        if (gamesEmpty) gamesEmpty.hidden = visibleSections > 0;

        filterBtns.forEach(btn => {
            const isActive = btn.dataset.filter === filter;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', String(isActive));
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter || 'all';
            Sound.filterSelect();
            applyFilter(filter);

            // Scroll suave al inicio de la lista si estamos muy abajo
            const target = $('#juegos');
            if (target && window.scrollY > target.offsetTop + 200) {
                const headerH = $('#siteHeader')?.offsetHeight || 80;
                window.scrollTo({
                    top: target.offsetTop - headerH - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
            Sound.filterSelect();
            applyFilter('all');
        });
    }

    updateCounters();
    applyFilter('all');
})();


/* ============================================================
   12. INDICADOR DE NAVEGACIÓN ACTIVA
   ============================================================ */
(function initActiveNav() {
    const mainNav   = $('.main-nav');
    const indicator = $('.nav-indicator');
    if (!mainNav || !indicator) return;

    const navMap = {
        'hero':   'inicio',
        'juegos': 'juegos',
        'ayuda':  'ayuda'
    };

    const sections = Object.keys(navMap)
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length) return;

    const navLinks = $$('.nav-btn[data-nav]');
    if (!navLinks.length) return;

    function moveIndicator(link) {
        if (window.matchMedia('(max-width: 1024px)').matches) return;
        const navRect  = mainNav.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        indicator.style.transform = `translateX(${linkRect.left - navRect.left - 6}px)`;
        indicator.style.width     = linkRect.width + 'px';
    }

    function setActive(navKey) {
        let matched = null;
        navLinks.forEach(link => {
            const isActive = link.dataset.nav === navKey;
            link.classList.toggle('is-active', isActive);
            if (isActive) matched = link;
        });

        if (matched) {
            indicator.classList.add('is-active');
            moveIndicator(matched);
        } else {
            indicator.classList.remove('is-active');
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const navKey = navMap[entry.target.id];
                if (navKey) setActive(navKey);
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-20% 0px -40% 0px'
    });

    sections.forEach(sec => observer.observe(sec));

    window.addEventListener('resize', () => {
        const active = $('.nav-btn.is-active');
        if (active) moveIndicator(active);
    });

    setActive('juegos');
})();


/* ============================================================
   13. BEEBOT: SALUDO + REACCIÓN AL CLICK
   ============================================================ */
(function initBeeBotInteraction() {
    const robot = $('.hero-character .robot-img');
    if (!robot) return;

    /* Saludo sonoro la primera vez que entra al viewport */
    let greeted = false;
    const greetingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !greeted) {
                greeted = true;
                setTimeout(() => Sound.beebotGreeting(), 600);
                greetingObserver.disconnect();
            }
        });
    }, { threshold: 0.4 });

    greetingObserver.observe(robot);

    /* Click en la abeja → risita + wiggle temporal */
    const display = $('.hero-character .robot-display');
    if (display) display.style.cursor = 'pointer';

    robot.style.cursor = 'pointer';
    robot.style.pointerEvents = 'auto';
    robot.setAttribute('role', 'button');
    robot.setAttribute('tabindex', '0');
    robot.setAttribute('aria-label', '¡Saluda a BeeBot!');

    let isReacting = false;

    function react() {
        if (isReacting || prefersReducedMotion) return;
        isReacting = true;

        Sound.beebotGiggle();

        if (display) {
            display.classList.add('is-reacting');
            setTimeout(() => {
                display.classList.remove('is-reacting');
                isReacting = false;
            }, 700);
        } else {
            robot.animate([
                { transform: 'translateY(0) scale(1)' },
                { transform: 'translateY(-20px) scale(1.08)' },
                { transform: 'translateY(0) scale(1)' }
            ], {
                duration: 600,
                easing: 'cubic-bezier(.22,.61,.36,1)'
            }).onfinish = () => { isReacting = false; };
        }
    }

    robot.addEventListener('click', react);
    robot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            react();
        }
    });
})();


/* ============================================================
   14. ACCESIBILIDAD POR TECLADO
   ============================================================ */
(function initKeyboardA11y() {
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = document.activeElement;
        if (!el) return;
        if (el.tagName === 'BUTTON' || el.tagName === 'A') return;

        if (el.classList.contains('btn-hero-inicial') ||
            el.classList.contains('filter-btn') ||
            el.classList.contains('sound-toggle')) {
            e.preventDefault();
            el.click();
        }
    });
})();


/* ============================================================
   15. VISOR DE JUEGO (misma página, pantalla completa)
   ------------------------------------------------------------
   • Abre el juego en un iframe a pantalla completa
   • Pausa la música de fondo mientras el juego está activo
   • El botón "Salir" aparece al hacer hover arriba
   • ESC o salir del fullscreen nativo cierra el visor
   ============================================================ */
(function initGameViewer() {
    const visor = $('#visor-juego');
    const frame = $('#frame-juego');
    if (!visor || !frame) return;

    let juegoActivo = false;
    let timerControles = null;

    function mostrarControles() {
        visor.classList.add('mostrar-controles');
        clearTimeout(timerControles);
        timerControles = setTimeout(() => visor.classList.remove('mostrar-controles'), 2600);
    }

    /* ---- Abrir juego ---- */
    function abrirJuego(url) {
        if (!url) return;

        BGM.pauseForGame();
        Sound.openGame();

        frame.src = url;
        visor.classList.add('activo');
        juegoActivo = true;
        mostrarControles();

        // Intentar fullscreen nativo (silencioso si el navegador lo bloquea)
        if (visor.requestFullscreen) {
            visor.requestFullscreen().catch(() => {});
        } else if (visor.webkitRequestFullscreen) {
            visor.webkitRequestFullscreen();
        }
    }

    /* ---- Cerrar juego (expuesta globalmente) ---- */
    window.cerrarJuego = function() {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }

        visor.classList.remove('activo', 'mostrar-controles');
        clearTimeout(timerControles);
        frame.src = '';
        juegoActivo = false;

        BGM.resumeFromGame();
    };

    /* ---- Listeners de cada tarjeta de juego ---- */
    $$('.game-card').forEach(card => {
        const link = card.querySelector('.game-card-link');
        if (!link) return;

        /* Tarjetas "PRÓXIMAMENTE" → solo suena aviso, no se abren */
        if (card.classList.contains('is-coming-soon')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                Sound.comingSoon();
            });
            return;
        }

        /* Tarjetas activas → abrir en el visor */
        if (link.tagName === 'A') {
            link.addEventListener('click', (e) => {
                const url = link.getAttribute('href');
                if (!url) return;
                e.preventDefault();
                abrirJuego(url);
            });
        }
    });

    /* Mostrar brevemente la salida al acercarse a la parte superior */
    visor.addEventListener('mousemove', (e) => {
        if (juegoActivo && e.clientY <= 110) mostrarControles();
    });
    visor.addEventListener('touchstart', (e) => {
        const touch = e.touches && e.touches[0];
        if (juegoActivo && touch && touch.clientY <= 110) mostrarControles();
    }, { passive: true });

    /* ---- ESC cierra el visor ---- */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && juegoActivo) {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                window.cerrarJuego();
            }
        }
    });

    /* ---- Salida del fullscreen nativo → cerrar visor ---- */
    function onFullscreenChange() {
        if (!juegoActivo) return;
        const isFS = document.fullscreenElement || document.webkitFullscreenElement;
        if (!isFS) {
            setTimeout(() => {
                if (juegoActivo &&
                    !document.fullscreenElement &&
                    !document.webkitFullscreenElement) {
                    window.cerrarJuego();
                }
            }, 150);
        }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    /* ---- Botones que cierran el visor ---- */
    const btnCerrar = $('.btn-cerrar-juego');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', window.cerrarJuego);
    }
})();


/* ============================================================
   16. API GLOBAL
   ============================================================ */
window.BeeBotPortal = {
    sound: Sound,
    bgm: BGM,

    filterBy(category) {
        const btn = $(`.filter-btn[data-filter="${category}"]`);
        if (btn) btn.click();
    },

    scrollTo(selector) {
        const el = typeof selector === 'string' ? $(selector) : selector;
        if (!el) return;
        const headerH = $('#siteHeader')?.offsetHeight || 0;
        window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - headerH - 20,
            behavior: 'smooth'
        });
    },

    isSoundEnabled() { return Sound.isEnabled(); },

    salute() {
        const robot = $('.hero-character .robot-img');
        if (robot) robot.click();
    },

    closeGame() { window.cerrarJuego && window.cerrarJuego(); }
};


/* ============================================================
   17. LOG DE BIENVENIDA
   ============================================================ */
console.log(
    '%c 🐝 AVENTURAS DE BEEBOT %c 27 juegos · 5 categorías · Música de fondo activa',
    'background: linear-gradient(90deg, #ffd93d, #ffb800, #7ed957); color: #3d1f00; padding: 6px 14px; border-radius: 8px; font-weight: 900; font-family: sans-serif;',
    'color: #7ed957; font-weight: 700; padding: 4px 8px; font-family: sans-serif;'
);

/* ============================================================
   18. MINIATURAS DINÁMICAS SILENCIOSAS
   Mantiene el HTML real de cada juego como portada, pero evita
   que audio/video de las miniaturas se escuche en el portal.
   ============================================================ */
(function initSilentDynamicThumbs() {
    const previews = document.querySelectorAll('iframe.dynamic-thumb');

    function silence(frame) {
        try {
            const doc = frame.contentDocument;
            const win = frame.contentWindow;
            if (!doc || !win) return;

            const silenceMedia = () => {
                doc.querySelectorAll('audio, video').forEach(media => {
                    media.muted = true;
                    media.volume = 0;
                    try { media.pause(); } catch (_) {}
                });
            };
            silenceMedia();

            const observer = new MutationObserver(silenceMedia);
            if (doc.documentElement) observer.observe(doc.documentElement, { childList: true, subtree: true });

            try {
                if (win.Howler && typeof win.Howler.mute === 'function') win.Howler.mute(true);
            } catch (_) {}
        } catch (_) {}
    }

    previews.forEach(frame => {
        frame.setAttribute('allow', "autoplay 'none'");
        frame.addEventListener('load', () => {
            silence(frame);
            setTimeout(() => silence(frame), 150);
            setTimeout(() => silence(frame), 700);
        });
    });
})();

/* Arranque de la canción 19: se intenta al cargar y se garantiza
   en la primera interacción permitida por el navegador. */
(function initPortalMusicStart() {
    const audio = document.getElementById('bgm');
    if (!audio) return;
    audio.volume = 0.28;
    const start = () => {
        audio.play().then(() => {
            const btn = document.getElementById('soundToggle');
            if (btn) {
                btn.classList.remove('is-muted');
                btn.innerHTML = '<span class="sound-icon sound-on">🔊</span>';
            }
            try { localStorage.setItem('bee_muted_global', 'false'); } catch (_) {}
        }).catch(() => {});
    };
    start();
    document.addEventListener('pointerdown', start, { once: true, passive: true });
    document.addEventListener('keydown', start, { once: true });
})();
