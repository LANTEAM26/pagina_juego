/* ============================================================
   AVENTURAS DE RAYET — JAVASCRIPT PRINCIPAL DEL PORTAL PRIMARIA
   Versión 1.0 — 20 juegos organizados en 5 secciones temáticas
   ------------------------------------------------------------
   Temática: Ciudad + Carreras
   ------------------------------------------------------------
   Módulos:
   1.  Utilidades y almacenamiento local
   2.  Año dinámico del footer
   3.  Sistema de audio sintetizado (motor, bocina, etc.)
   4.  Botón flotante de sonido
   5.  Header: scroll, progreso y auto-ocultado
   6.  Menú móvil desplegable
   7.  Scroll suave por anclas
   8.  Efectos ripple + sonidos de botones
   9.  Reveal escalonado al hacer scroll
   10. Filtros por categoría
   11. Indicador de navegación activa
   12. Interacción con Rayet (motor, parallax, bocina)
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
            console.warn('[Rayet] Error leyendo localStorage:', e);
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('[Rayet] Error escribiendo localStorage:', e);
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
   Sonidos temáticos de carreras:
   - click: cambio de marcha rápido
   - filterSelect: aceleración ascendente
   - openGame: arranque C-E-G estilo motor
   - engineRev: revolución del motor al ver a Rayet
   - horn: bocina al hacer click en el robot
   ============================================================ */
const Sound = (() => {
    let enabled = store.get('ray_sound_enabled', true);
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
            console.error('[Rayet] Error sintetizando audio:', err);
        }
    }

    /* Barrido de frecuencia (muy útil para simular motor) */
    function sweep(freqStart, freqEnd, duration = 0.3, type = 'sawtooth', volume = 0.12) {
        if (!enabled) return;
        const ctx = getContext();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);

            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (err) {
            console.error('[Rayet] Error sintetizando sweep:', err);
        }
    }

    /* Click corto tipo "cambio de marcha" */
    function click() {
        tone(440, 0.04, 'square', 0.06);
    }

    /* Cambio de filtro (aceleración ascendente) */
    function filterSelect() {
        sweep(280, 720, 0.18, 'sawtooth', 0.08);
        setTimeout(() => tone(880, 0.08, 'triangle', 0.10), 130);
    }

    /* Al abrir un juego (arranque C-E-G tipo motor) */
    function openGame() {
        sweep(180, 520, 0.22, 'sawtooth', 0.10);
        setTimeout(() => tone(659.25, 0.10, 'triangle', 0.14), 180);   // E5
        setTimeout(() => tone(783.99, 0.16, 'triangle', 0.14), 270);   // G5
    }

    /* Revolución del motor al ver a Rayet (sonido largo bajo) */
    function engineRev() {
        sweep(120, 380, 0.55, 'sawtooth', 0.09);
        setTimeout(() => sweep(380, 200, 0.35, 'sawtooth', 0.08), 500);
    }

    /* Bocina al hacer click en Rayet (dos tonos paralelos) */
    function horn() {
        tone(392, 0.15, 'square', 0.10);  // G4
        tone(494, 0.15, 'square', 0.09);  // B4
        setTimeout(() => {
            tone(392, 0.12, 'square', 0.10);
            tone(494, 0.12, 'square', 0.09);
        }, 170);
    }

    return {
        isEnabled: () => enabled,
        toggle() {
            enabled = !enabled;
            store.set('ray_sound_enabled', enabled);
            return enabled;
        },
        click,
        filterSelect,
        openGame,
        engineRev,
        horn,
        tone,
        sweep
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

        // Barra de progreso (estilo "velocímetro")
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

    // Botones con data-scroll (como "ARRANCAR AVENTURA")
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

    // Sonido al abrir un juego (arranque de motor)
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

    /* Cuenta los juegos por categoría */
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

    /* Aplica el filtro */
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

    /* Manejar clicks */
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter || 'all';
            Sound.filterSelect();
            applyFilter(filter);
        });
    });

    /* Botón "VER TODOS" */
    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
            Sound.filterSelect();
            applyFilter('all');
        });
    }

    /* Inicialización */
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
   12. INTERACCIÓN CON RAYET (imagen real)
   ------------------------------------------------------------
   - Parallax suave del robot con el scroll
   - Revolución del motor la primera vez que aparece
   - Click en el robot → bocina + rebote + giro
   ============================================================ */
(function initRayetInteraction() {
    const robot = $('.hero-character .robot-img');
    if (!robot) return;

    /* 12.1 — Parallax del robot con el scroll */
    if (!prefersReducedMotion && !window.matchMedia('(max-width: 1024px)').matches) {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(() => {
                const y = window.scrollY;

                if (y < window.innerHeight) {
                    const offset = y * 0.15;
                    const rotate = y * 0.02;

                    robot.style.setProperty('--parallax-y', `${offset}px`);
                    robot.style.setProperty('--parallax-rotate', `${rotate}deg`);
                }

                ticking = false;
            });
        }, { passive: true });

        robot.style.animation = 'none';
        robot.style.transform = 'translateY(var(--parallax-y, 0)) rotate(var(--parallax-rotate, 0))';
    }

    /* 12.2 — Revolución del motor la primera vez que aparece */
    let greeted = false;
    const greetingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !greeted) {
                greeted = true;
                setTimeout(() => Sound.engineRev(), 600);
                greetingObserver.disconnect();
            }
        });
    }, { threshold: 0.4 });

    greetingObserver.observe(robot);

    /* 12.3 — Click en el robot → bocina + rebote */
    robot.style.pointerEvents = 'auto';
    robot.style.cursor = 'pointer';
    robot.setAttribute('role', 'button');
    robot.setAttribute('tabindex', '0');
    robot.setAttribute('aria-label', '¡Toca la bocina de Rayet!');

    let isBouncing = false;

    function honk() {
        if (isBouncing || prefersReducedMotion) return;
        isBouncing = true;

        Sound.horn();

        robot.style.transition = 'transform 0.15s cubic-bezier(.22,.61,.36,1)';
        robot.style.transform = 'translateY(-25px) scale(1.08) rotate(-5deg)';

        setTimeout(() => {
            robot.style.transform = 'translateY(0) scale(1) rotate(0)';
            setTimeout(() => {
                isBouncing = false;
                robot.style.transition = '';
                robot.style.transform = '';
            }, 200);
        }, 150);
    }

    robot.addEventListener('click', honk);
    robot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            honk();
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
window.RayetPortal = {
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

    /** Tocar la bocina desde fuera */
    honk() {
        const robot = $('.hero-character .robot-img');
        if (robot) robot.click();
    },

    /** Hacer rugir el motor manualmente */
    revEngine() {
        Sound.engineRev();
    }
};


/* ============================================================
   15. LOG DE BIENVENIDA
   ============================================================ */
console.log(
    '%c 🏎️ AVENTURAS DE RAYET %c 20 juegos · 5 categorías · ¡Aprende a toda velocidad!',
    'background: linear-gradient(90deg, #ffb347, #ff8c42, #d96a1e); color: #fff; padding: 6px 14px; border-radius: 8px; font-weight: 900; font-family: sans-serif;',
    'color: #ff8c42; font-weight: 700; padding: 4px 8px; font-family: sans-serif;'
);