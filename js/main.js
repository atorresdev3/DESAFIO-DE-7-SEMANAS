/* ======================================================
    MAIN.JS — Landing Desafío 7 Días
    Documentado por bloques para facilitar mantenimiento
    ====================================================== */

/* ======================================================
    BLOQUE 1 — CARRUSEL DE TESTIMONIOS
    Auto-scroll infinito + arrastre mouse/dedo.
    Espera a que TODAS las imágenes carguen antes de
    mostrarse y arrancar (evita el corte visual en mobile).
   ====================================================== */
function setupTestimonialsCarousel(carousel, track, speed) {
    if (!carousel || !track) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let posX = 0;
    let setWidth = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragStartPos = 0;
    let directionLock = null;
    const autoScrollSpeed = prefersReducedMotion ? 0 : speed;
    const LOCK_THRESHOLD = 6;

    function getSetWidth() {
        return track.scrollWidth / 2;
    }

    function wrap(value) {
        if (setWidth <= 0) return value;
        return ((value % setWidth) + setWidth) % setWidth;
    }

    function updateTransform() {
        track.style.transform = `translateX(${-posX}px)`;
    }

    function tick() {
        if (!isDragging) {
            posX = wrap(posX + autoScrollSpeed);
            updateTransform();
        }
        requestAnimationFrame(tick);
    }

    /* ---- Mouse en PC ---- */
    function onPointerDown(e) {
        if (e.pointerType !== "mouse") return;
        isDragging = true;
        startX = e.clientX;
        dragStartPos = posX;
    }

    function onPointerMove(e) {
        if (e.pointerType !== "mouse" || !isDragging) return;
        const delta = startX - e.clientX;
        posX = wrap(dragStartPos + delta);
        updateTransform();
    }

    function onPointerUp(e) {
        if (e.pointerType !== "mouse") return;
        isDragging = false;
    }

    carousel.addEventListener("pointerdown", onPointerDown);
    carousel.addEventListener("pointermove", onPointerMove);
    carousel.addEventListener("pointerup", onPointerUp);
    carousel.addEventListener("pointercancel", onPointerUp);
    carousel.addEventListener("pointerleave", onPointerUp);

    /* ---- Dedo en mobile con bloqueo de dirección ---- */
    function onTouchStart(e) {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        dragStartPos = posX;
        directionLock = null;
        isDragging = false;
    }

    function onTouchMove(e) {
        const touch = e.touches[0];
        const deltaX = startX - touch.clientX;
        const deltaY = startY - touch.clientY;

        if (!directionLock) {
            if (Math.abs(deltaX) < LOCK_THRESHOLD && Math.abs(deltaY) < LOCK_THRESHOLD) return;
            directionLock = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
            if (directionLock === "horizontal") isDragging = true;
        }

        if (directionLock === "horizontal") {
            e.preventDefault();
            posX = wrap(dragStartPos + deltaX);
            updateTransform();
        }
    }

    function onTouchEnd() {
        isDragging = false;
        directionLock = null;
    }

    carousel.addEventListener("touchstart", onTouchStart, { passive: true });
    carousel.addEventListener("touchmove", onTouchMove, { passive: false });
    carousel.addEventListener("touchend", onTouchEnd);
    carousel.addEventListener("touchcancel", onTouchEnd);

    window.addEventListener("resize", () => {
        setWidth = getSetWidth();
    });

    /* ---- Espera a que todas las imágenes carguen ----
        El track tiene opacity:0 vía CSS animation (forwards).
        Si la animación CSS no dispara por reduced-motion,
        el track igual se muestra por la regla del @media. */
    const images = Array.from(track.querySelectorAll("img"));
    let loadedCount = 0;

    function revealWhenReady() {
        loadedCount++;
        if (loadedCount === images.length) {
            setWidth = getSetWidth();
            posX = 0;
            updateTransform();
            requestAnimationFrame(tick);
        }
    }

    if (images.length === 0) {
        requestAnimationFrame(tick);
    } else {
        images.forEach((img) => {
            if (img.complete && img.naturalWidth > 0) {
                revealWhenReady();
            } else {
                img.addEventListener("load", revealWhenReady);
                img.addEventListener("error", revealWhenReady);
            }
        });
    }
}

/* ======================================================
    BLOQUE 2 — CONTADORES ANIMADOS
    Cada tarjeta tiene su propio IntersectionObserver →
    en mobile se activan una a una al hacer scroll,
    no todas al mismo tiempo cuando aparece la primera.
    ====================================================== */
function initCounters() {
    const cards = document.querySelectorAll("#testimonios .stat-card");
    if (!cards.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function formatNumber(value, format) {
        const rounded = Math.round(value);
        return format === "comma" ? rounded.toLocaleString("en-US") : rounded.toString();
    }

    function animateCount(el) {
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || "";
        const format = el.dataset.format || "";

        if (prefersReducedMotion) {
            el.textContent = formatNumber(target, format) + suffix;
            return;
        }

        const duration = 1800;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;
            el.textContent = formatNumber(current, format) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    card.classList.add("is-visible");
                    const numberEl = card.querySelector(".stat-card__numero");
                    if (numberEl) animateCount(numberEl);
                    obs.unobserve(card);
                }
            });
        },
        { threshold: 0.4 },
    );

    cards.forEach((card) => observer.observe(card));
}

/* ======================================================
    BLOQUE 3 — ANIMACIONES DE ENTRADA (reveal-card y logros)
    Se activan por IntersectionObserver cuando cada
    elemento entra en pantalla al hacer scroll.
    ====================================================== */
function initRevealCards() {
    const cards = document.querySelectorAll(".reveal-card");
    if (!cards.length) return;

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.transitionDelay = "0s"; // sin delay — cada una entra sola cuando llega
                    entry.target.classList.add("is-visible");
                    obs.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }, // se activa cuando el 15% de la card entra en pantalla
    );

    cards.forEach((card) => observer.observe(card));
}

/* ======================================================
    BLOQUE 4 — ACORDEÓN FAQ
    Solo una pregunta abierta a la vez.
    Altura animada con scrollHeight (100% confiable en
    todos los navegadores y dispositivos).
    ====================================================== */
function initFaq() {
    const faqItems = document.querySelectorAll(".faq__item");
    if (!faqItems.length) return;

    function closeItem(item) {
        const btn = item.querySelector(".faq__question");
        const wrapper = item.querySelector(".faq__answer-wrapper");
        btn.setAttribute("aria-expanded", "false");
        wrapper.style.maxHeight = "0px";
    }

    function openItem(item) {
        const btn = item.querySelector(".faq__question");
        const wrapper = item.querySelector(".faq__answer-wrapper");
        btn.setAttribute("aria-expanded", "true");
        wrapper.style.maxHeight = wrapper.scrollHeight + "px";
    }

    faqItems.forEach((item) => {
        const btn = item.querySelector(".faq__question");
        btn.addEventListener("click", () => {
            const isOpen = btn.getAttribute("aria-expanded") === "true";
            faqItems.forEach((other) => closeItem(other));
            if (!isOpen) openItem(item);
        });
    });

    window.addEventListener("resize", () => {
        faqItems.forEach((item) => {
            const wrapper = item.querySelector(".faq__answer-wrapper");
            const btn = item.querySelector(".faq__question");
            if (btn.getAttribute("aria-expanded") === "true") {
                wrapper.style.maxHeight = wrapper.scrollHeight + "px";
            }
        });
    });
}

/* ======================================================
    BLOQUE 5 — ANIMACIÓN DEL PRECIO ($120 → temblor → $7.90)
    Se vigila directamente el elemento del precio (no toda
    la sección) para que se dispare justo cuando el usuario
    lo tiene en pantalla — crítico en mobile donde el usuario
    lee la lista antes de llegar al precio.
    Secuencia: 1) tiembla 1s → 2) baja en 4s → 3) pulsa
    ====================================================== */
function initPriceAnimation() {
    const priceEl = document.querySelector(".offer-card__price-amount");
    const priceWrapper = document.querySelector(".offer-card__price");
    if (!priceEl || !priceWrapper) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = parseFloat(priceEl.dataset.start);
    const end = parseFloat(priceEl.dataset.end);
    let hasAnimated = false;

    function setValue(value) {
        priceEl.textContent = "$" + value.toFixed(2);
    }

    function runCountdown() {
        const duration = 4000; // ms que dura la bajada
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = start - (start - end) * eased;
            setValue(current);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                setValue(end);
                priceEl.classList.add("is-urgent");
                const usdEl = document.querySelector(".offer-card__price-usd");
                if (usdEl) usdEl.classList.add("is-urgent");
            }
        }

        requestAnimationFrame(step);
    }

    function trigger() {
        if (hasAnimated) return;
        hasAnimated = true;

        if (prefersReducedMotion) {
            setValue(end);
            return;
        }

        // Fase 1: temblor
        priceEl.classList.add("is-shaking");
        setTimeout(() => {
            priceEl.classList.remove("is-shaking");
            // Fase 2: cuenta regresiva
            runCountdown();
        }, 2000); // debe coincidir con duración de @keyframes price-shake
    }

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    trigger();
                    obs.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.4 },
    );

    observer.observe(priceWrapper);
}

/* ======================================================
    BLOQUE 6 — INICIALIZACIÓN AL CARGAR EL DOM
    ====================================================== */
document.addEventListener("DOMContentLoaded", () => {
    setupTestimonialsCarousel(
        document.querySelector(".testimonials__carousel"),
        document.querySelector(".testimonials__track"),
        0.8, // velocidad en px por frame — sube para más rápido
    );

    initCounters();
    initRevealCards();
    initFaq();
    initPriceAnimation();
});

/* ======================================================
    BLOQUE 7 — TRACKING AVANZADO META (CONSERVADO INTACTO)
    No modificar — código de seguimiento de conversiones
    ====================================================== */
(function () {
    "use strict";

    if (typeof window.__MM_track !== "function") {
        console.warn("[MM Tracking] Pixel no cargado aún");
        return;
    }

    // ── 1. ViewContent ─────────────────────────────────────────
    window.__MM_track("ViewContent", {
        content_name: "Desafío 7 Días - Landing",
        content_category: "Curso Digital",
        content_ids: ["desafio-7-dias"],
        content_type: "product",
        currency: "USD",
        value: 7.9,
    });

    // ── 2. Scroll Depth ────────────────────────────────────────
    const scrollMilestones = { 25: false, 50: false, 75: false, 90: false };

    function getScrollPercent() {
        const el = document.documentElement;
        const top = window.scrollY || el.scrollTop;
        const height = el.scrollHeight - el.clientHeight;
        return height > 0 ? Math.round((top / height) * 100) : 0;
    }

    window.addEventListener(
        "scroll",
        function onScroll() {
            const pct = getScrollPercent();
            [25, 50, 75, 90].forEach(function (milestone) {
                if (!scrollMilestones[milestone] && pct >= milestone) {
                    scrollMilestones[milestone] = true;
                    window.__MM_track("ScrollDepth", {
                        content_name: "Desafío 7 Días",
                        scroll_depth: milestone,
                    });
                    if (milestone === 90) {
                        window.__MM_track("DeepScroll", {
                            content_name: "Desafío 7 Días",
                            label: "leyó_casi_todo",
                        });
                    }
                }
            });
        },
        { passive: true },
    );

    // ── 3. Tiempo en Página ────────────────────────────────────
    const timeCheckpoints = { 30: false, 60: false, 120: false, 180: false };
    const startTime = Date.now();

    const timeInterval = setInterval(function () {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        [30, 60, 120, 180].forEach(function (checkpoint) {
            if (!timeCheckpoints[checkpoint] && seconds >= checkpoint) {
                timeCheckpoints[checkpoint] = true;
                window.__MM_track("TimeOnPage", {
                    content_name: "Desafío 7 Días",
                    seconds_on_page: checkpoint,
                });
                if (checkpoint === 180) clearInterval(timeInterval);
            }
        });
    }, 5000);

    // ── 4. Secciones Visibles ──────────────────────────────────
    const sectionEvents = {
        precio: "ViewPriceSection",
        recapitulacion: "ViewRecap",
        garantia: "ViewGarantia",
        testimonios: "ViewTestimonios",
        "compra-2": "ViewCTA2",
    };

    const sectionSeen = {};

    const sectionObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                const id = entry.target.id;
                if (entry.isIntersecting && !sectionSeen[id] && sectionEvents[id]) {
                    sectionSeen[id] = true;
                    window.__MM_track(sectionEvents[id], {
                        content_name: "Desafío 7 Días",
                        section: id,
                    });
                }
            });
        },
        { threshold: 0.3 },
    );

    Object.keys(sectionEvents).forEach(function (id) {
        const el = document.getElementById(id);
        if (el) sectionObserver.observe(el);
    });

    // ── 5. InitiateCheckout ────────────────────────────────────
    const buyButtons = document.querySelectorAll('a[href*="pay.hotmart.com"], .btn__compra');

    buyButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            window.__MM_track("InitiateCheckout", {
                content_name: "Desafío 7 Días",
                content_ids: ["desafio-7-dias"],
                content_type: "product",
                currency: "USD",
                value: 7.9,
                num_items: 1,
            });
        });
    });

    // ── 6. Engagement Score ────────────────────────────────────
    function checkEngagement() {
        const scrollOk = scrollMilestones[75];
        const timeOk = timeCheckpoints[60];
        const priceOk = sectionSeen["precio"];

        if (scrollOk && timeOk && priceOk && !window.__MM_engagementSent) {
            window.__MM_engagementSent = true;
            window.__MM_track("HighEngagement", {
                content_name: "Desafío 7 Días",
                label: "lead_caliente",
                score: 3,
            });
        }
    }

    setInterval(checkEngagement, 10000);

    // ── 7. Exit Intent ─────────────────────────────────────────
    let exitSent = false;
    document.addEventListener("mouseleave", function (e) {
        if (!exitSent && e.clientY <= 0) {
            exitSent = true;
            window.__MM_track("ExitIntent", {
                content_name: "Desafío 7 Días",
                seconds_on_page: Math.floor((Date.now() - startTime) / 1000),
                scroll_reached: getScrollPercent(),
            });
        }
    });
})();
