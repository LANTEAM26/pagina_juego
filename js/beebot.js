/* ============================================================
   AVENTURAS DE BEEBOT — JAVASCRIPT PRINCIPAL DEL PORTAL INICIAL
   Versión 4.0 — Jardín Primaveral Profesional
   ------------------------------------------------------------
   Cambios v4.0:
   - ❌ Eliminado parallax lateral (ya no se desliza al scrollear)
   - ❌ Eliminado override de animation (el vuelo figura-8 manda)
   - ✅ Click en la abeja → reacción con clase temporal (no toca
        la animación base del vuelo)
   - ✅ Conservado saludo sonoro al aparecer
   ------------------------------------------------------------
   Módulos:
   1.  Utilidades y almacenamiento local
   2.  Año dinámico del footer
   3.  Sistema de audio sintetizado (Web Audio API)
   4.  Botón flotante de sonido
   5.  Header: scroll, progreso y auto-ocultado
   6.  Menú móvil desplegable
   7.  Scroll suave por anclas
   8.  Efectos ripple + sonidos de botones
   9.  Reveal escalonado al hacer scroll
   10. Filtros por categoría
   11. Indicador de navegación activa
   12. Interacción con BeeBot (saludo + reacción al click)
   13. Accesibilidad por teclado
   14. API global
   ============================================================ */

'use strict';

/* ============================================================
   1. UTILIDADES Y ALMACENAMIENTO LOCAL
   ============================================================ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const store = {
    get(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            return val === null ? fallback : JSON.parse(val);
        } catch (e) {
            console.warn('[BeeBot] Error leyendo localStorage:', e);
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('[BeeBot] Error escribiendo localStorage:', e);
        }
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
   ------------------------------------------------------------
   Genera tonos puros sin archivos. Diferentes sonidos para:
   - Click corto de UI
   - Selección de filtro
   - Apertura de un juego
   - Saludo de BeeBot
   - Risita de BeeBot al hacerle click
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
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (err) {
            console.error('[BeeBot] Error sintetizando audio:', err);
        }
    }

    /* Click corto y seco (UI) */
    function click() {
        tone(660, 0.05, 'square', 0.07);
    }

    /* Cambio de filtro (dos notas ascendentes) */
    function filterSelect() {
        tone(720, 0.06, 'triangle', 0.10);
        setTimeout(() => tone(880, 0.08, 'triangle', 0.10), 50);
    }

    /* Al abrir un juego (arpegio C-E-G) */
    function openGame() {
        tone(523.25, 0.10, 'triangle', 0.14);                          // C5
        setTimeout(() => tone(659.25, 0.10, 'triangle', 0.14), 90);    // E5
        setTimeout(() => tone(783.99, 0.16, 'triangle', 0.14), 180);   // G5
    }

    /* Saludo de BeeBot (dos notas dulces) */
    function beebotGreeting() {
        tone(880, 0.10, 'sine', 0.10);
        setTimeout(() => tone(1100, 0.15, 'sine', 0.10), 100);
    }

    /* Risita de BeeBot al hacerle click (tres notas cortas) */
    function beebotGiggle() {
        tone(1046, 0.06, 'triangle', 0.09);   // C6
        setTimeout(() => tone(1318, 0.06, 'triangle', 0.09), 70);   // E6
        setTimeout(() => tone(1568, 0.10, 'triangle', 0.09), 140);  // G6
    }

    return {
        isEnabled: () => enabled,
        toggle() {
            enabled = !enabled;
            store.set('bee_sound_enabled', enabled);
            return enabled;
        },
        click,
        filterSelect,
        openGame,
        beebotGreeting,
        beebotGiggle,
        tone
    };
})();


/* ============================================================
   4. BOTÓN FLOTANTE DE SONIDO
   ============================================================ */
(function initSoundToggle() {
    const btn = $('#soundToggle');
    if (!btn) return;

    if (!Sound.isEnabled()) btn.classList.add('is-muted');

    btn.addEventListener('click', () => {
        const isNowOn = Sound.toggle();
        btn.classList.toggle('is-muted', !isNowOn);
        if (isNowOn) Sound.tone(880, 0.12, 'sine', 0.12);
    });
})();


/* ============================================================
   5. HEADER: SCROLL, PROGRESO Y AUTO-OCULTADO
   ============================================================ */
(function initHeaderScroll() {
    const header = $('#siteHeader');
    const progress = $('#scrollProgress');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function update() {
        const y = window.scrollY;

        // Clase cuando ya se hizo scroll
        header.classList.toggle('is-scrolled', y > 40);

        // Barra de progreso
        if (progress) {
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docH > 0 ? (y / docH) * 100 : 0;
            progress.style.width = pct + '%';
        }

        // Auto-ocultar al bajar, mostrar al subir
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
   6. MENÚ MÓVIL DESPLEGABLE
   ============================================================ */
(function initMobileMenu() {
    const toggleBtn = $('#menuToggle');
    const mainNav = $('.main-nav');
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

    $$('.nav-btn', mainNav).forEach(link => {
        link.addEventListener('click', close);
    });

    document.addEventListener('click', (e) => {
        if (!mainNav.classList.contains('is-open')) return;
        if (!mainNav.contains(e.target) && !toggleBtn.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
})();


/* ============================================================
   7. SCROLL SUAVE POR ANCLAS
   ============================================================ */
(function initSmoothScroll() {
    const header = $('#siteHeader');

    function scrollTo(target) {
        const el = typeof target === 'string' ? $(target) : target;
        if (!el) return;

        const headerH = header ? header.offsetHeight : 80;
        const top = el.getBoundingClientRect().top + window.scrollY - headerH - 12;

        window.scrollTo({ top, behavior: 'smooth' });
    }

    // Botones con data-scroll (como "VER TODOS LOS JUEGOS")
    $$('[data-scroll]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            Sound.openGame();
            scrollTo(btn.dataset.scroll);
        });
    });

    // Enlaces ancla internos
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
})();


/* ============================================================
   8. EFECTOS RIPPLE Y SONIDOS DE BOTONES
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
        span.style.top = y + 'px';

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

    // Aplica ripple a filtros y botones principales
    $$('.filter-btn, .btn, .btn-show-all').forEach(btn => {
        btn.addEventListener('click', (e) => ripple(btn, e));
    });

    // Sonido al abrir un juego (arpegio C-E-G)
    $$('.game-card-link').forEach(link => {
        link.addEventListener('click', () => Sound.openGame());
    });
})();


/* ============================================================
   9. REVEAL ESCALONADO AL HACER SCROLL
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
   10. FILTROS POR CATEGORÍA
   ------------------------------------------------------------
   - Oculta las secciones que no coinciden con la categoría
   - Actualiza los contadores automáticamente
   - Muestra un mensaje si no hay juegos
   ============================================================ */
(function initFilters() {
    const filterBtns = $$('.filter-btn');
    const sections = $$('.games-section');
    const gamesEmpty = $('#gamesEmpty');
    const showAllBtn = $('.btn-show-all');

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

        if (gamesEmpty) {
            gamesEmpty.hidden = visibleSections > 0;
        }

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
   11. INDICADOR DE NAVEGACIÓN ACTIVA
   ============================================================ */
(function initActiveNav() {
    const mainNav = $('.main-nav');
    const indicator = $('.nav-indicator');
    if (!mainNav || !indicator) return;

    const navMap = {
        'hero': 'inicio',
        'juegos': 'juegos',
        'ayuda': 'ayuda'
    };

    const sections = Object.keys(navMap)
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length) return;

    const navLinks = $$('.nav-btn[data-nav]');
    if (!navLinks.length) return;

    function moveIndicator(link) {
        if (window.matchMedia('(max-width: 1024px)').matches) return;
        const navRect = mainNav.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        indicator.style.transform = `translateX(${linkRect.left - navRect.left - 5}px)`;
        indicator.style.width = linkRect.width + 'px';
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
   12. INTERACCIÓN CON BEEBOT
   ------------------------------------------------------------
   - Saludo sonoro la primera vez que aparece en pantalla
   - Click en la abeja → risita + pequeño "wiggle"
   - SIN parallax lateral (el vuelo figura-8 lo maneja el CSS)
   ------------------------------------------------------------
   Importante: NO tocamos `style.transform` ni `style.animation`
   del robot ni de su envoltorio, porque eso rompería la
   animación CSS del vuelo figura-8.
   ============================================================ */
(function initBeeBotInteraction() {
    const robot = $('.hero-character .robot-img');
    if (!robot) return;

    /* 12.1 — Saludo sonoro la primera vez que entra al viewport */
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

    /* 12.2 — Click en la abeja → risita + "wiggle" temporal
       El wiggle se aplica al contenedor .robot-display para
       NO interferir con el vuelo del .beebot-flight. */
    const display = $('.hero-character .robot-display');
    if (display) {
        display.style.cursor = 'pointer';
    }

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

        // Aplicamos una clase temporal al display, no al robot,
        // así el vuelo figura-8 sigue funcionando sin interrupción.
        if (display) {
            display.classList.add('is-reacting');
            setTimeout(() => {
                display.classList.remove('is-reacting');
                isReacting = false;
            }, 700);
        } else {
            // Fallback: si no existe el display, rebotamos el robot
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
   13. ACCESIBILIDAD POR TECLADO
   ============================================================ */
(function initKeyboardA11y() {
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = document.activeElement;
        if (!el) return;
        if (el.tagName === 'BUTTON' || el.tagName === 'A') return;

        if (el.classList.contains('btn') ||
            el.classList.contains('filter-btn') ||
            el.classList.contains('sound-toggle')) {
            e.preventDefault();
            el.click();
        }
    });
})();


/* ============================================================
   14. API GLOBAL
   ============================================================ */
window.BeeBotPortal = {
    sound: Sound,

    /** Filtrar por categoría programáticamente */
    filterBy(category) {
        const btn = $(`.filter-btn[data-filter="${category}"]`);
        if (btn) btn.click();
    },

    /** Scroll suave a una sección */
    scrollTo(selector) {
        const el = typeof selector === 'string' ? $(selector) : selector;
        if (!el) return;

        const headerH = $('#siteHeader')?.offsetHeight || 0;
        window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - headerH - 12,
            behavior: 'smooth'
        });
    },

    /** Saber si el sonido está activo */
    isSoundEnabled() {
        return Sound.isEnabled();
    },

    /** Saludar a BeeBot manualmente desde fuera */
    salute() {
        const robot = $('.hero-character .robot-img');
        if (robot) robot.click();
    }
};


/* ============================================================
   15. LOG DE BIENVENIDA
   ============================================================ */
console.log(
    '%c 🐝 AVENTURAS DE BEEBOT %c 32 juegos · 5 categorías · Vuelo natural primaveral',
    'background: linear-gradient(90deg, #ffd93d, #ffb800, #7ed957); color: #3d1f00; padding: 6px 14px; border-radius: 8px; font-weight: 900; font-family: sans-serif;',
    'color: #7ed957; font-weight: 700; padding: 4px 8px; font-family: sans-serif;'
);