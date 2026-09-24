/* ============================================================
   AVENTURA EDUCATIVA — SCRIPT DEL PORTAL INICIAL (BEEBOT)
   ------------------------------------------------------------
   Funciona con la estructura de beebot.html:
     • Header primaveral con progreso y autohide
     • BeeBot volando (animación ya en CSS)
     • 5 secciones de juegos por categoría (.games-section)
     • Tarjetas .game-card con data-category y data-difficulty
     • Filtros .filter-btn[data-filter] con contadores dinámicos
     • Estado vacío #gamesEmpty
     • Reveal progresivo con IntersectionObserver

   Todas las funciones son defensivas: si un elemento no existe,
   el bloque se salta sin lanzar errores.
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
   1. AÑO DINÁMICO
   ============================================================ */
(function setYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ============================================================
   2. SISTEMA DE SONIDO (Web Audio API)
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

    function click()   { tone(660, 0.06, 'square',   0.08); }
    function hover()   { tone(880, 0.03, 'sine',     0.03); }

    function enterWorld() {
        tone(523, 0.10, 'triangle', 0.15);
        setTimeout(() => tone(659, 0.10, 'triangle', 0.15), 90);
        setTimeout(() => tone(784, 0.18, 'triangle', 0.15), 180);
    }

    function select() {
        tone(880, 0.08, 'triangle', 0.15);
        setTimeout(() => tone(1174, 0.14, 'triangle', 0.15), 80);
    }

    function success() {
        tone(659, 0.10, 'sine', 0.16);
        setTimeout(() => tone(880, 0.10, 'sine', 0.16), 100);
        setTimeout(() => tone(1174, 0.20, 'sine', 0.16), 200);
    }

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
   4. HEADER: SCROLL, PROGRESO Y AUTOHIDE
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
   ------------------------------------------------------------
   • Respeta target="_blank" (los juegos abren en nueva pestaña)
   • Aplica offset del header
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

    // Enlaces internos (#...)
    $$('a[href^="#"]').forEach(a => {
        if (a.target === '_blank') return; // no interceptar juegos

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

    window.AE_scrollTo = scrollTo;
})();


/* ============================================================
   7. EFECTOS DE BOTONES (ripple + hover)
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

    $$('.btn, .btn-hero-inicial, .nav-btn, .sound-toggle, .filter-btn, .footer-nav-link, .btn-show-all')
        .forEach(btn => {
            btn.addEventListener('click', (e) => {
                btn.classList.add('is-clicked');
                setTimeout(() => btn.classList.remove('is-clicked'), 220);
                createRipple(btn, e);
            });

            if (!isTouch) {
                btn.addEventListener('mouseenter', () => Sound.hover());
            }
        });
})();


/* ============================================================
   8. REVEAL ESCALONADO (reveal-child)
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
   ------------------------------------------------------------
   Observa #hero, #juegos, #ayuda si existen.
   ============================================================ */
(function initActiveNav() {
    const nav       = $('.main-nav');
    const indicator = $('.nav-indicator');
    const navLinks  = $$('.nav-btn');
    if (!nav || !indicator || !navLinks.length) return;

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
   11. ROBOT IMAGES (marca .has-image si el PNG carga bien)
   ------------------------------------------------------------
   El HTML ya trae <img class="robot-img">. Solo verificamos.
   ============================================================ */
(function verifyRobotImages() {
    const displays = $$('.robot-display[data-robot]');
    if (!displays.length) return;

    displays.forEach(display => {
        const img = display.querySelector('.robot-img');
        if (!img) return;

        if (img.complete && img.naturalWidth > 0) {
            display.classList.add('has-image');
            return;
        }
        img.addEventListener('load',  () => display.classList.add('has-image'));
        img.addEventListener('error', () => {
            console.warn(
                `[Aventuras de BeeBot] No se encontró assets/robots/${display.dataset.robot}.png`
            );
        });
    });
})();


/* ============================================================
   12. PORTAL DE JUEGOS — FILTROS, CONTADORES Y REVEAL
   ------------------------------------------------------------
   Estructura esperada en el HTML:
     <section class="games-section" data-section="numeros">
        <span class="games-section-count-num">6</span>
        <article class="game-card" data-category="numeros">…</article>
     </section>
     <button class="filter-btn" data-filter="numeros">
        <span class="filter-count" data-count="numeros">0</span>
     </button>
   ============================================================ */
(function initGamesPortal() {
    const gamesArea = $('#juegos');
    if (!gamesArea) return;

    const sections = $$('.games-section', gamesArea);   // secciones por categoría
    const cards    = $$('.game-card', gamesArea);       // todas las tarjetas
    const filterBtns = $$('.filter-btn', gamesArea);
    const emptyBox   = $('#gamesEmpty', gamesArea);
    const counters   = $$('.filter-count', gamesArea);

    /* -------------------------------------------------------
       12.1 CONTAR JUEGOS POR CATEGORÍA
       ------------------------------------------------------- */
    function countByCategory() {
        const counts = { all: cards.length };
        cards.forEach(card => {
            const cat = card.dataset.category || 'otros';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }

    /* -------------------------------------------------------
       12.2 ACTUALIZAR CONTADORES DE LOS FILTROS
       ------------------------------------------------------- */
    function updateCounters() {
        const counts = countByCategory();
        counters.forEach(counter => {
            const key = counter.dataset.count;
            if (!key) return;
            counter.textContent = counts[key] ?? 0;
        });

        // También actualizar el contador de cada sección
        sections.forEach(section => {
            const key = section.dataset.section;
            const countEl = section.querySelector('.games-section-count-num');
            if (countEl && key) {
                countEl.textContent = counts[key] ?? 0;
            }
        });
    }

    /* -------------------------------------------------------
       12.3 APLICAR FILTRO
       ------------------------------------------------------- */
    function applyFilter(filter) {
        let totalVisible = 0;

        // Mostrar / ocultar secciones completas
        sections.forEach(section => {
            const secKey = section.dataset.section;
            const showSection = (filter === 'all') || (secKey === filter);
            section.classList.toggle('is-hidden', !showSection);

            // Dentro de cada sección, mostrar/ocultar tarjetas (doble seguridad)
            const sectionCards = $$('.game-card', section);
            sectionCards.forEach(card => {
                const cat = card.dataset.category || '';
                const showCard = (filter === 'all') || (cat === filter);
                card.classList.toggle('is-filtered-out', !showCard);
                if (showCard && showSection) totalVisible++;
            });
        });

        // Estado vacío
        if (emptyBox) emptyBox.hidden = totalVisible !== 0;

        // Actualizar botones activos
        filterBtns.forEach(btn => {
            const isActive = btn.dataset.filter === filter;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    /* -------------------------------------------------------
       12.4 REVEAL DE TARJETAS
       ------------------------------------------------------- */
    function revealCards() {
        // Delay escalonado según posición dentro de la sección
        cards.forEach((card, i) => {
            card.classList.add('reveal-card');
            card.style.transitionDelay = `${(i % 6) * 0.05}s`;
        });

        if (!('IntersectionObserver' in window)) {
            cards.forEach(c => c.classList.add('is-visible'));
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.10,
            rootMargin: '0px 0px -60px 0px'
        });

        cards.forEach(card => io.observe(card));
    }

    /* -------------------------------------------------------
       12.5 EVENTOS DE FILTROS
       ------------------------------------------------------- */
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter || 'all';
            Sound.click();
            applyFilter(filter);

            // Scroll suave al inicio de la lista al cambiar de filtro
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

    /* -------------------------------------------------------
       12.6 BOTÓN "VER TODOS" DEL ESTADO VACÍO
       ------------------------------------------------------- */
    const btnShowAll = $('.btn-show-all', gamesArea);
    if (btnShowAll) {
        btnShowAll.addEventListener('click', () => {
            Sound.click();
            applyFilter('all');
        });
    }

    /* -------------------------------------------------------
       12.7 SONIDO AL ABRIR UN JUEGO
       ------------------------------------------------------- */
    $$('.game-card-link', gamesArea).forEach(link => {
        link.addEventListener('click', () => Sound.select());
    });

    /* -------------------------------------------------------
       12.8 INICIALIZACIÓN
       ------------------------------------------------------- */
    updateCounters();
    revealCards();
    applyFilter('all');
})();


/* ============================================================
   13. API GLOBAL
   ============================================================ */
window.AventuraEducativa = {
    sound: Sound,
    scrollTo: window.AE_scrollTo,
    version: '1.0'
};


/* ============================================================
   14. LOG DE BIENVENIDA
   ============================================================ */
console.log(
    '%c🐝 AVENTURAS DE BEEBOT %c Portal Inicial cargado — ' + document.title,
    'background: linear-gradient(90deg,#7ed957,#4ec0e0,#ffd93d); color:#0b3b1f; padding:6px 10px; border-radius:8px; font-weight:900;',
    'color:#6b7280; font-weight:600; padding:4px;'
);