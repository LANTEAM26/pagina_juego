/* ============================================================
   AVENTURAS DE LUDIO — JAVASCRIPT PRINCIPAL DEL PORTAL SECUNDARIA
   Versión 1.0 — 20 juegos organizados en 5 secciones temáticas
   ------------------------------------------------------------
   Temática: Cyber / Neón / Futurista
   ------------------------------------------------------------
   Módulos:
   1.  Utilidades y almacenamiento local
   2.  Año dinámico del footer
   3.  Sistema de audio sintetizado (beeps, glitch, sci-fi)
   4.  Botón flotante de sonido
   5.  Header: scroll, progreso y auto-ocultado
   6.  Menú móvil desplegable
   7.  Scroll suave por anclas
   8.  Efectos ripple + sonidos de botones
   9.  Reveal escalonado al hacer scroll
   10. Filtros por categoría
   11. Indicador de navegación activa
   12. Star field + Partículas cyber + Binary rain (efectos visuales)
   13. Interacción con Ludio (beep, parallax, glitch)
   14. Accesibilidad por teclado
   15. API global
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
            console.warn('[Ludio] Error leyendo localStorage:', e);
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('[Ludio] Error escribiendo localStorage:', e);
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
   Sonidos temáticos cyber:
   - click: beep corto digital
   - filterSelect: escaneo ascendente
   - openGame: arranque de sistema (arpegio sci-fi)
   - systemBoot: inicialización de Ludio
   - glitchBeep: error/glitch corto
   ============================================================ */
const Sound = (() => {
    let enabled = store.get('lud_sound_enabled', true);
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
            console.error('[Ludio] Error sintetizando audio:', err);
        }
    }

    /* Barrido de frecuencia (muy útil para cyber) */
    function sweep(freqStart, freqEnd, duration = 0.3, type = 'sine', volume = 0.10) {
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
            console.error('[Ludio] Error sintetizando sweep:', err);
        }
    }

    /* Beep digital corto (UI) */
    function click() {
        tone(880, 0.04, 'square', 0.06);
    }

    /* Cambio de filtro (escaneo ascendente) */
    function filterSelect() {
        sweep(400, 1200, 0.15, 'sine', 0.08);
        setTimeout(() => tone(1400, 0.06, 'square', 0.08), 130);
    }

    /* Al abrir un juego (arranque de sistema) */
    function openGame() {
        tone(523.25, 0.08, 'square', 0.10);                           // C5
        setTimeout(() => tone(659.25, 0.08, 'square', 0.10), 70);     // E5
        setTimeout(() => tone(1046.50, 0.16, 'square', 0.10), 140);   // C6
        setTimeout(() => sweep(1200, 1800, 0.20, 'sine', 0.08), 240);
    }

    /* Inicialización de sistema (al ver a Ludio) */
    function systemBoot() {
        sweep(200, 800, 0.45, 'sine', 0.08);
        setTimeout(() => tone(660, 0.10, 'square', 0.10), 400);
        setTimeout(() => tone(880, 0.10, 'square', 0.10), 520);
        setTimeout(() => tone(1320, 0.20, 'square', 0.10), 640);
    }

    /* Glitch/error corto */
    function glitchBeep() {
        tone(220, 0.03, 'sawtooth', 0.09);
        setTimeout(() => tone(180, 0.03, 'sawtooth', 0.09), 40);
        setTimeout(() => tone(320, 0.05, 'sawtooth', 0.09), 80);
    }

    return {
        isEnabled: () => enabled,
        toggle() {
            enabled = !enabled;
            store.set('lud_sound_enabled', enabled);
            return enabled;
        },
        click,
        filterSelect,
        openGame,
        systemBoot,
        glitchBeep,
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
        if (isNowOn) Sound.tone(1400, 0.10, 'square', 0.10);
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

        // Barra de progreso (estilo "data load")
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

    // Botones con data-scroll ("INICIAR PROTOCOLO")
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
            background: 'rgba(0, 229, 255, 0.5)',
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

    // Aplica ripple a filtros y botones
    $$('.filter-btn, .btn, .btn-show-all').forEach(btn => {
        btn.addEventListener('click', (e) => ripple(btn, e));
    });

    // Sonido al abrir un juego (arranque cyber)
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
   12. EFECTOS VISUALES CYBER
   ------------------------------------------------------------
   12.1 — Star field (estrellas twinkle)
   12.2 — Partículas cyber (flotantes con glow)
   12.3 — Binary rain (lluvia de bits estilo Matrix)
   ============================================================ */
(function initCyberEffects() {

    /* ---- 12.1 STAR FIELD ---- */
    const starField = $('#starField');
    if (starField) {
        const totalStars = window.innerWidth < 700 ? 40 : 90;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < totalStars; i++) {
            const star = document.createElement('span');
            star.className = 'star';

            const size = (1.5 + Math.random() * 3).toFixed(1);
            Object.assign(star.style, {
                left: `${(Math.random() * 100).toFixed(2)}%`,
                top: `${(Math.random() * 100).toFixed(2)}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${(Math.random() * 4).toFixed(2)}s`,
                animationDuration: `${(2 + Math.random() * 3).toFixed(2)}s`
            });

            fragment.appendChild(star);
        }
        starField.appendChild(fragment);
    }

    /* ---- 12.2 PARTÍCULAS CYBER ---- */
    const particlesContainer = $('#cyberParticles');
    if (particlesContainer) {
        // Inyectar keyframes solo una vez
        if (!document.getElementById('cyberFloatKeyframes')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'cyberFloatKeyframes';
            styleSheet.textContent = `
                @keyframes cyberParticleMoveA {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    50% { transform: translate(35px, -45px) scale(1.6); opacity: 0.95; }
                }
                @keyframes cyberParticleMoveB {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    50% { transform: translate(-40px, 30px) scale(1.4); opacity: 0.95; }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        const totalParticles = window.innerWidth < 700 ? 18 : 45;

        for (let i = 0; i < totalParticles; i++) {
            const particle = document.createElement('span');
            particle.className = 'cyber-particle';

            const size = (2 + Math.random() * 4).toFixed(1);
            const colorRandom = Math.random();
            let particleColor;
            if (colorRandom > 0.66) particleColor = '#00e5ff';
            else if (colorRandom > 0.33) particleColor = '#b14aed';
            else particleColor = '#00ffaa';

            const animationName = Math.random() > 0.5 ? 'cyberParticleMoveA' : 'cyberParticleMoveB';
            const duration = (6 + Math.random() * 8).toFixed(1);
            const delay = (Math.random() * 5).toFixed(1);

            Object.assign(particle.style, {
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                backgroundColor: particleColor,
                boxShadow: `0 0 ${size * 3}px ${particleColor}`,
                opacity: (0.3 + Math.random() * 0.7).toFixed(2),
                animation: `${animationName} ${duration}s ease-in-out ${delay}s infinite`,
                pointerEvents: 'none'
            });

            particlesContainer.appendChild(particle);
        }
    }

    /* ---- 12.3 BINARY RAIN ---- */
    const binaryRain = $('#binaryRain');
    if (binaryRain && !prefersReducedMotion) {
        const totalDrops = window.innerWidth < 700 ? 20 : 45;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < totalDrops; i++) {
            const drop = document.createElement('span');
            drop.className = 'binary-drop';

            // Genera una cadena de 0s y 1s
            const length = 8 + Math.floor(Math.random() * 12);
            let bits = '';
            for (let j = 0; j < length; j++) {
                bits += Math.random() > 0.5 ? '1' : '0';
            }
            drop.textContent = bits;

            const duration = (6 + Math.random() * 8).toFixed(1);
            const delay = (Math.random() * 10).toFixed(1);

            Object.assign(drop.style, {
                left: `${Math.random() * 100}%`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                opacity: (0.3 + Math.random() * 0.5).toFixed(2),
                fontSize: `${(0.65 + Math.random() * 0.4).toFixed(2)}rem`,
                color: Math.random() > 0.5 ? '#00e5ff' : '#b14aed'
            });

            fragment.appendChild(drop);
        }
        binaryRain.appendChild(fragment);
    }
})();


/* ============================================================
   13. INTERACCIÓN CON LUDIO (imagen real)
   ------------------------------------------------------------
   - Parallax suave del robot con el scroll
   - Inicialización de sistema la primera vez que aparece
   - Click en el robot → glitch + rebote
   ============================================================ */
(function initLudioInteraction() {
    const robot = $('.hero-character .robot-img');
    if (!robot) return;

    /* 13.1 — Parallax del robot con el scroll */
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

    /* 13.2 — Inicialización de sistema la primera vez */
    let greeted = false;
    const greetingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !greeted) {
                greeted = true;
                setTimeout(() => Sound.systemBoot(), 600);
                greetingObserver.disconnect();
            }
        });
    }, { threshold: 0.4 });

    greetingObserver.observe(robot);

    /* 13.3 — Click en el robot → glitch + rebote */
    robot.style.pointerEvents = 'auto';
    robot.style.cursor = 'pointer';
    robot.setAttribute('role', 'button');
    robot.setAttribute('tabindex', '0');
    robot.setAttribute('aria-label', '¡Activa el sistema de Ludio!');

    let isBouncing = false;

    function activate() {
        if (isBouncing || prefersReducedMotion) return;
        isBouncing = true;

        Sound.glitchBeep();

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

    robot.addEventListener('click', activate);
    robot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
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

        if (el.classList.contains('btn') ||
            el.classList.contains('filter-btn') ||
            el.classList.contains('sound-toggle')) {
            e.preventDefault();
            el.click();
        }
    });
})();


/* ============================================================
   15. API GLOBAL
   ============================================================ */
window.LudioPortal = {
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

    /** Activar sistema de Ludio desde fuera */
    activate() {
        const robot = $('.hero-character .robot-img');
        if (robot) robot.click();
    },

    /** Inicializar sistema manualmente */
    boot() {
        Sound.systemBoot();
    },

    /** Provocar un glitch sonoro */
    glitch() {
        Sound.glitchBeep();
    }
};


/* ============================================================
   16. LOG DE BIENVENIDA
   ============================================================ */
console.log(
    '%c 🤖 AVENTURAS DE LUDIO %c 20 juegos · 5 categorías · Sistema cyber iniciado',
    'background: linear-gradient(90deg, #00e5ff, #b14aed, #ff5e7e); color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 900; font-family: monospace; letter-spacing: 0.05em;',
    'color: #00e5ff; font-weight: 700; padding: 4px 8px; font-family: monospace;'
);