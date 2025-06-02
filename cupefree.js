// ==UserScript==
// @name         CUPE Free Spatial Enhanced for Albums
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Unblur images and videos on cupe.live: fix bl-* params, handle covers, remove SVGs, overlays, zIndex, and opacity
// @author       testbug
// @match        https://*.cupe.live/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };

    function unblurMedia() {
        try {
            const patterns = [
                { match: /\bbl-\d+\b/, replace: 'bl-0' },
                { match: /_cover\.jpe?g\?tr=.*bl-\d+/, replace: (url) => url.replace(/_cover\.jpe?g\?.*$/, '.mp4') },
                { match: /([?&])(blur|bl)-\d+/g, replace: '$1bl-0' }
            ];

            const processSrc = (src) => {
                let newSrc = src;
                patterns.forEach(({ match, replace }) => {
                    newSrc = typeof replace === 'function' ? replace(newSrc) : newSrc.replace(match, replace);
                });
                return newSrc;
            };

            document.querySelectorAll('img').forEach(img => {
                const src = img.src;
                if (!src || img.dataset.processed) return;
                img.dataset.processed = 'true';

                if (src.endsWith('.svg')) {
                    img.remove();
                    return;
                }

                const newSrc = processSrc(src);
                if (newSrc !== src) {
                    console.log(`Unblurred image: ${src} → ${newSrc}`);
                    img.src = newSrc;
                }

                const overlays = img.parentElement?.querySelectorAll('div, span, a') || [];
                overlays.forEach(overlay => {
                    const style = window.getComputedStyle(overlay);
                    if (style.position === 'absolute' || parseFloat(style.opacity) < 1 || parseInt(style.zIndex) > 0) {
                        overlay.remove();
                    }
                });
            });

            document.querySelectorAll('video source').forEach(source => {
                const src = source.src;
                if (!src || source.dataset.processed) return;
                source.dataset.processed = 'true';

                const newSrc = processSrc(src);
                if (newSrc !== src) {
                    console.log(`Unblurred video: ${src} → ${newSrc}`);
                    source.src = newSrc;
                    source.parentElement?.load();
                }
            });
        } catch (err) {
            console.error('CUPE Unblur Error:', err);
        }
    }

    const observer = new MutationObserver(debounce(unblurMedia, 100));

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src']
    });

    window.addEventListener('unload', () => observer.disconnect());

    unblurMedia();
})();
