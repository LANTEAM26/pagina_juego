/* ============================================================
   AVENTURA EDUCATIVA — SCRIPT COMÚN
   Utilidades compartidas por los 3 portales:
   inicial.html · primaria.html · secundaria.html
   ------------------------------------------------------------
   Incluye:
   - Utilidades ($ / $$ / store / isTouch)
   - Sistema de sonido (Web Audio API)
   - Botón de sonido flotante
   - Header con progreso y ocultado elegante
   - Menú móvil
   - Scroll suave
   - Ripple + feedback de botones
   - Reveal escalonado con IntersectionObserver
   - Indicador de sección activa
   - Accesibilidad por teclado
   - API global (window.AventuraEducativa)
   ============================================================ */

'use strict';

/* ============================================================
   0. UTILIDADES
   ============================================================ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const store = {
    get(key, fallback = null) {
        try {
            const v = localStorage.getItem(key);
            return v === null ? fallback : JSON.parse(v);
        } catch { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
};


/* ============================================================
   1. AÑO DINÁMICO EN EL FOOTER
   ============================================================ */
(function setYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ============================================================
   2. SISTEMA DE SONIDO
   ------------------------------------------------------------
   Genera tonos con Web Audio API. Preparado para reemplazar
   por audios reales desde assets/audio/ sin tocar el código
   de las páginas.
   ============================================================ */
const Sound = (() => {
    let enabled = store.get('ae_sound_enabled', true);
    let ctx = null;

    function getCtx() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    /** Reproduce un tono simple */
    function tone(freq = 440, duration = 0.12, type = 'sine', volume = 0.14) {
        if (!enabled) return;
        const c = getCtx();
        if (!c) return;
        const osc  = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
        osc.connect(gain).connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + duration);
    }

    /** Click de botón */
    function click() { tone(660, 0.06, 'square', 0.08); }

    /** Hover suave */
    function hover() { tone(880, 0.03, 'sine', 0.03); }

    /** Entrada a un mundo */
    function enterWorld() {
        tone(523, 0.10, 'triangle', 0.15);
        setTimeout(() => tone(659, 0.10, 'triangle', 0.15), 90);
        setTimeout(() => tone(784, 0.18, 'triangle', 0.15), 180);
    }

    /** Selección de un juego */
    function select() {
        tone(880, 0.08, 'triangle', 0.15);
        setTimeout(() => tone(1174, 0.14, 'triangle', 0.15), 80);
    }

    /** Éxito */
    function success() {
        tone(659, 0.10, 'sine', 0.16);
        setTimeout(() => tone(880, 0.10, 'sine', 0.16), 100);
        setTimeout(() => tone(1174, 0.20, 'sine', 0.16), 200);
    }

    /** Error */
    function error() {
        tone(220, 0.16, 'sawtooth', 0.12);
        setTimeout(() => tone(180, 0.20, 'sawtooth', 0.12), 140);
    }

    return {
        isEnabled: () => enabled,
        toggle() {
            enabled = !enabled;
            store.set('ae_sound_enabled', enabled);
            return enabled;
        },
        click, hover, enterWorld, select, success, error, tone
    };
})();

// Exponer Sound globalmente (para inicial.js / primaria.js / secundaria.js)
window.AE_Sound = Sound;


/* ============================================================
   3. BOTÓN FLOTANTE DE SONIDO
   ============================================================ */
(function initSoundToggle() {
    const btn = $('#soundToggle');
    if (!btn) return;

    if (!Sound.isEnabled()) btn.classList.add('is-muted');

    btn.addEventListener('click', () => {
        const on = Sound.toggle();
        btn.classList.toggle('is-muted', !on);
        if (on) Sound.tone(880, 0.12, 'sine', 0.12);
    });
})();


/* ============================================================
   4. HEADER: SCROLL, PROGRESO Y OCULTADO
   ============================================================ */
(function initHeaderScroll() {
    const header   = $('#siteHeader');
    const progress = $('#scrollProgress');
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
        const y = window.scrollY;

        header.classList.toggle('is-scrolled', y > 40);

        if (progress) {
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            const pct  = docH > 0 ? (y / docH) * 100 : 0;
            progress.style.width = pct + '%';
        }

        if (y > 400 && y > lastY + 8) {
            header.style.transform = 'translateY(-140%)';
        } else if (y < lastY - 8 || y < 400) {
            header.style.transform = 'translateY(0)';
        }

        lastY = y;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    header.style.transition = 'transform .35s cubic-bezier(.22,.61,.36,1), background .3s, box-shadow .3s';
    onScroll();
})();


/* ============================================================
   5. MENÚ MÓVIL
   ============================================================ */
(function initMobileMenu() {
    const toggle = $('#menuToggle');
    const nav    = $('.main-nav');
    if (!toggle || !nav) return;

    function closeMenu() {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        Sound.click();
    });

    $$('.nav-btn', nav).forEach(link => link.addEventListener('click', closeMenu));

    document.addEventListener('click', (e) => {
        if (!nav.classList.contains('is-open')) return;
        if (!nav.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });
})();


/* ============================================================
   6. SCROLL SUAVE
   ============================================================ */
(function initSmoothScroll() {
    const header = $('#siteHeader');

    function scrollTo(target) {
        const el = typeof target === 'string' ? $(target) : target;
        if (!el) return;
        const headerH = header ? header.offsetHeight : 80;
        const top = el.getBoundingClientRect().top + window.scrollY - headerH - 8;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    // Elementos con data-scroll="#selector"
    $$('[data-scroll]').forEach(el => {
        el.addEventListener('click', (e) => {
            const target = el.dataset.scroll;
            if (!target) return;
            const el2 = $(target);
            if (!el2) return;
            e.preventDefault();
            Sound.click();
            scrollTo(el2);
        });
    });

    // Enlaces internos con href="#..."
    $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = $(href);
            if (!target) return;
            e.preventDefault();
            Sound.click();
            scrollTo(target);
        });
    });

    // Exponer para uso externo
    window.AE_scrollTo = scrollTo;
})();


/* ============================================================
   7. EFECTOS DE BOTONES (ripple + press + sonido)
   ============================================================ */
(function initButtonEffects() {
    function createRipple(btn, ev) {
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        Object.assign(ripple.style, {
            position: 'absolute',
            width: size + 'px',
            height: size + 'px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,.55)',
            pointerEvents: 'none',
            transform: 'translate(-50%,-50%) scale(0)',
            transition: 'transform .6s ease, opacity .6s ease',
            opacity: '1'
        });

        const x = (ev.clientX ?? (rect.left + rect.width  / 2)) - rect.left;
        const y = (ev.clientY ?? (rect.top  + rect.height / 2)) - rect.top;
        ripple.style.left = x + 'px';
        ripple.style.top  = y + 'px';

        if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);

        requestAnimationFrame(() => {
            ripple.style.transform = 'translate(-50%,-50%) scale(1)';
            ripple.style.opacity   = '0';
        });
        setTimeout(() => ripple.remove(), 650);
    }

    // Elementos interactivos generales
    $$('.btn, .nav-btn, .sound-toggle, .filter-btn, .footer-nav-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            btn.classList.add('is-clicked');
            setTimeout(() => btn.classList.remove('is-clicked'), 220);
            createRipple(btn, e);
        });

        // Hover suave solo en dispositivos con puntero
        if (!isTouch) {
            btn.addEventListener('mouseenter', () => Sound.hover());
        }
    });
})();


/* ============================================================
   8. REVEAL ESCALONADO
   ============================================================ */
(function initRevealOnScroll() {
    const revealers = $$('.reveal-child');
    if (!revealers.length) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    });

    revealers.forEach(el => io.observe(el));
})();


/* ============================================================
   9. NAV INDICADOR DE SECCIÓN ACTIVA
   ============================================================ */
(function initActiveNav() {
    const nav       = $('.main-nav');
    const indicator = $('.nav-indicator');
    const navLinks  = $$('.nav-btn');
    if (!nav || !indicator || !navLinks.length) return;

    // Secciones internas que pueden ser observadas (si existen en la página)
    const sectionIds = ['hero', 'juegos', 'ayuda'];
    const sections = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    function moveIndicator(link) {
        if (window.matchMedia('(max-width: 1000px)').matches) return;
        const navRect  = nav.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        indicator.style.transform = `translateX(${linkRect.left - navRect.left - 6}px)`;
        indicator.style.width     = linkRect.width + 'px';
    }

    function setActive(link) {
        navLinks.forEach(l => l.classList.remove('is-active'));
        if (link) {
            link.classList.add('is-active');
            indicator.classList.add('is-active');
            moveIndicator(link);
        } else {
            indicator.classList.remove('is-active');
        }
    }

    // Si la página tiene secciones internas (#hero, #juegos, #ayuda), observarlas
    if (sections.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const link = navLinks.find(l => l.getAttribute('href') === '#' + entry.target.id);
                if (link) setActive(link);
            });
        }, {
            threshold: 0.4,
            rootMargin: '-25% 0px -45% 0px'
        });
        sections.forEach(sec => io.observe(sec));
    } else {
        // Fallback: marcar el que tenga is-active en HTML
        const current = navLinks.find(l => l.classList.contains('is-active'));
        if (current) setActive(current);
    }

    window.addEventListener('resize', () => {
        const active = $('.nav-btn.is-active');
        if (active) moveIndicator(active);
    });
})();


/* ============================================================
   10. ACCESIBILIDAD POR TECLADO
   ============================================================ */
(function initKeyboardA11y() {
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = document.activeElement;
        if (!el) return;
        if (el.tagName === 'BUTTON' || el.tagName === 'A') return;
        if (el.classList.contains('btn') || el.classList.contains('game-card-link')) {
            e.preventDefault();
            el.click();
        }
    });
})();


/* ============================================================
   11. REEMPLAZO AUTOMÁTICO DE ROBOTS POR IMÁGENES REALES
   ------------------------------------------------------------
   Si existe assets/robots/<nombre>.png se muestra la imagen
   y se oculta el robot CSS. Si no existe, se conserva el CSS.
   ============================================================ */
(function initRobotImages() {
    const displays = $$('.robot-display[data-robot]');
    if (!displays.length) return;

    displays.forEach(display => {
        const robotName = display.dataset.robot;
        const src = `assets/robots/${robotName}.png`;
        const img = new Image();
        img.onload = () => {
            if (display.classList.contains('has-image')) return;
            display.classList.add('has-image');
            const el = document.createElement('img');
            el.className = 'robot-img';
            el.src = src;
            el.alt = `Robot ${robotName}`;
            display.appendChild(el);
        };
        img.src = src;
    });
})();


/* ============================================================
   12. API GLOBAL
   ============================================================ */
window.AventuraEducativa = {
    sound: Sound,
    scrollTo: window.AE_scrollTo,
    version: '2.0'
};


/* ============================================================
   13. LOG DE BIENVENIDA
   ============================================================ */
console.log(
    '%c🎮 AVENTURA EDUCATIVA %c Portal cargado — ' + document.title,
    'background: linear-gradient(90deg,#7ed957,#4ec0e0,#b14aed); color:#fff; padding:6px 10px; border-radius:8px; font-weight:900;',
    'color:#6b7280; font-weight:600; padding:4px;'
);