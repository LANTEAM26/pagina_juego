/* ============================================================
   AVENTURA EDUCATIVA — SCRIPT PRINCIPAL
   Versión 2.0 — Rediseño profesional
   Conserva el 100% de la funcionalidad anterior y añade:
   - Indicador de sección activa con pill animada
   - Reveal escalonado con IntersectionObserver
   - Detección de header "scrolled"
   - Efectos ripple mejorados
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
        try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
        catch { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
};


/* ============================================================
   1. AÑO DINÁMICO
   ============================================================ */
(function setYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ============================================================
   2. SISTEMA DE SONIDO (Web Audio API, sin archivos externos)
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

    function enterWorld() {
        tone(523, 0.10, 'triangle', 0.15);
        setTimeout(() => tone(659, 0.10, 'triangle', 0.15), 90);
        setTimeout(() => tone(784, 0.18, 'triangle', 0.15), 180);
    }

    function click() { tone(660, 0.06, 'square', 0.08); }

    return {
        isEnabled: () => enabled,
        toggle() { enabled = !enabled; store.set('ae_sound_enabled', enabled); return enabled; },
        click, enterWorld, tone
    };
})();


/* ============================================================
   3. BOTÓN DE SONIDO
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

        // Clase para estado "scrolled"
        header.classList.toggle('is-scrolled', y > 40);

        // Barra de progreso
        if (progress) {
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            const pct  = docH > 0 ? (y / docH) * 100 : 0;
            progress.style.width = pct + '%';
        }

        // Ocultar al bajar mucho
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

    const btnStart = $('#btnStart');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            Sound.enterWorld();
            scrollTo(btnStart.dataset.target || '#inicial');
        });
    }

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
})();


/* ============================================================
   7. EFECTOS DE BOTONES (ripple + press)
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

    $$('.btn, .nav-btn, .sound-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            btn.classList.add('is-clicked');
            setTimeout(() => btn.classList.remove('is-clicked'), 220);
            createRipple(btn, e);
        });
    });

    $$('[data-sound="enter"]').forEach(a => {
        a.addEventListener('click', () => Sound.enterWorld());
    });
})();


/* ============================================================
   8. ESTRELLAS DEL HERO
   ============================================================ */
(function initStarField() {
    const field = $('#starField');
    if (!field) return;

    const count = window.innerWidth < 700 ? 30 : 70;
    const frag  = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
        const s = document.createElement('span');
        s.className = 'star';
        s.style.left = Math.random() * 100 + '%';
        s.style.top  = Math.random() * 100 + '%';
        s.style.animationDelay    = (Math.random() * 3).toFixed(2) + 's';
        s.style.animationDuration = (2 + Math.random() * 3).toFixed(2) + 's';
        const size = 3 + Math.random() * 4;
        s.style.width  = size + 'px';
        s.style.height = size + 'px';
        frag.appendChild(s);
    }
    field.appendChild(frag);
})();


/* ============================================================
   9. PARTÍCULAS CIBERNÉTICAS (Secundaria)
   ============================================================ */
(function initCyberParticles() {
    const container = $('#cyberParticles');
    if (!container) return;

    // Inyectar keyframes una sola vez (con dirección aleatoria fija)
    if (!document.getElementById('cyberFloatKeyframes')) {
        const style = document.createElement('style');
        style.id = 'cyberFloatKeyframes';
        style.textContent = `
            @keyframes cyberFloatA {
                0%,100% { transform: translate(0,0) scale(1); opacity: .4; }
                50%     { transform: translate(30px,-40px) scale(1.5); opacity: 1; }
            }
            @keyframes cyberFloatB {
                0%,100% { transform: translate(0,0) scale(1); opacity: .4; }
                50%     { transform: translate(-35px,25px) scale(1.4); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    const total = window.innerWidth < 700 ? 22 : 55;

    for (let i = 0; i < total; i++) {
        const p = document.createElement('span');
        p.className = 'cyber-particle';
        const size = 2 + Math.random() * 4;
        const color = Math.random() > 0.5 ? '#00e5ff' : '#b14aed';
        const animName = Math.random() > 0.5 ? 'cyberFloatA' : 'cyberFloatB';

        Object.assign(p.style, {
            position: 'absolute',
            left: Math.random() * 100 + '%',
            top:  Math.random() * 100 + '%',
            width:  size + 'px',
            height: size + 'px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 ${size * 3}px ${color}`,
            opacity: 0.4 + Math.random() * 0.6,
            animation: `${animName} ${6 + Math.random() * 8}s ease-in-out ${Math.random() * 5}s infinite`
        });
        container.appendChild(p);
    }
})();


/* ============================================================
   10. REVEAL ESCALONADO DE SECCIONES
   ------------------------------------------------------------
   Los hijos con [data-reveal] aparecen progresivamente cuando
   su sección entra al viewport.
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
   11. NAV INDICADOR DE SECCIÓN ACTIVA (pill deslizante)
   ============================================================ */
(function initActiveNav() {
    const nav       = $('.main-nav');
    const indicator = $('.nav-indicator');
    const sections  = ['#hero', '#inicial', '#primaria', '#secundaria']
        .map(id => $(id))
        .filter(Boolean);
    const navLinks  = $$('.nav-btn');
    if (!nav || !indicator || !sections.length || !navLinks.length) return;

    function moveIndicator(link) {
        if (window.matchMedia('(max-width: 1000px)').matches) return;

        const navRect  = nav.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();

        indicator.style.transform = `translateX(${linkRect.left - navRect.left - 6}px)`;
        indicator.style.width     = linkRect.width + 'px';
    }

    function setActive(id) {
        let activeLink = null;
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = href === id;
            link.classList.toggle('is-active', isActive);
            if (isActive) activeLink = link;
        });

        if (activeLink) {
            indicator.classList.add('is-active');
            moveIndicator(activeLink);
        } else {
            indicator.classList.remove('is-active');
        }
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActive('#' + entry.target.id);
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: '-25% 0px -45% 0px'
    });

    sections.forEach(sec => io.observe(sec));

    // Reposicionar al redimensionar
    window.addEventListener('resize', () => {
        const active = $('.nav-btn.is-active');
        if (active) moveIndicator(active);
    });

    // Estado inicial
    setActive('#hero');
})();


/* ============================================================
   12. PARALLAX SUAVE EN NUBES
   ============================================================ */
(function initParallax() {
    if (window.matchMedia('(max-width: 1000px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const clouds = $$('.cloud');
    if (!clouds.length) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            clouds.forEach((c, i) => {
                const speed = 0.03 + (i % 3) * 0.02;
                c.style.marginTop = (-y * speed) + 'px';
            });
            ticking = false;
        });
    }, { passive: true });
})();


/* ============================================================
   13. REEMPLAZO AUTOMÁTICO DE ROBOTS POR IMÁGENES REALES
   ------------------------------------------------------------
   Si existe assets/robots/<nombre>.png, se muestra la imagen y
   se oculta el robot CSS. Si no existe, se conserva el CSS.
   ============================================================ */
(function initRobotImages() {
    const displays = $$('.robot-display[data-robot]');
    if (!displays.length) return;

    displays.forEach(display => {
        const robotName = display.dataset.robot;
        const src = `assets/robots/${robotName}.png`;
        const img = new Image();
        img.onload = () => {
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
   14. ACCESIBILIDAD POR TECLADO
   ============================================================ */
(function initKeyboardA11y() {
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = document.activeElement;
        if (!el) return;
        if (el.tagName === 'BUTTON' || el.tagName === 'A') return;
        if (el.classList.contains('btn')) {
            e.preventDefault();
            el.click();
        }
    });
})();


/* ============================================================
   15. API GLOBAL (para futuras páginas)
   ============================================================ */
window.AventuraEducativa = {
    sound: Sound,
    scrollTo(sel) {
        const el = typeof sel === 'string' ? $(sel) : sel;
        if (!el) return;
        const headerH = $('#siteHeader')?.offsetHeight || 0;
        window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - headerH,
            behavior: 'smooth'
        });
    }
};


/* ============================================================
   16. LOG DE BIENVENIDA
   ============================================================ */
console.log(
    '%c🎮 AVENTURA EDUCATIVA %c Versión 2.0 — Diseño renovado. ¡Listo para jugar!',
    'background: linear-gradient(90deg,#00e5ff,#b14aed); color:#fff; padding:6px 10px; border-radius:8px; font-weight:900;',
    'color:#6b7280; font-weight:600; padding:4px;'
);