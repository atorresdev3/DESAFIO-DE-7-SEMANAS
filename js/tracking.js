(function () {
    // tracking ligero — Desafío 7 Días (funnel hacking / pauta)
    "use strict";

    if (typeof window.__MM_track !== "function") {
        console.warn("[MM Tracking] Pixel core no encontrado. Abortando.");
        return;
    }

    // ── ViewContent — se dispara al cargar la página ──
    window.__MM_track("ViewContent", {
        content_name: "Desafío 7 Días",
        content_category: "Curso Digital",
        content_ids: ["desafio-7-dias"],
        content_type: "product",
        currency: "USD",
        value: 7.9,
    });

    // ── InitiateCheckout — se dispara al hacer clic en el botón de compra ──
    document.addEventListener("DOMContentLoaded", function () {
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
    });

    if (window.MM_CONFIG && window.MM_CONFIG.debug) {
        console.log("%c[MM Tracking] ✅ Tracking ligero Desafío 7 Días iniciado", "color: #00ff88; font-weight: bold;");
        console.log("[MM Tracking] Eventos activos: ViewContent, InitiateCheckout");
        console.log("[MM Tracking] Pixel ID: 1027488963474619");
        console.log("[MM Tracking] Worker:", "https://7semanas-capi-worker.mentesmaestrasdigital.workers.dev");
    }
})();
