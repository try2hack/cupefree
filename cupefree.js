// ==UserScript==
// @name         CUPE Unblur v7 (SVG Mask Killer)
// @namespace    http://tampermonkey.net/
// @version      7.0
// @description  Unblur images + remove BlurWaterMask SVG overlays
// @match        *://*.cupe.live/*
// @match        *://cupe.live/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const SCAN_INTERVAL = 400;

    // 1. ฉีด CSS เพื่อซ่อน SVG Mask ทันทีที่มันโหลดมา (ทำงานไวที่สุด)
    const style = document.createElement('style');
    style.textContent = `
        img[src*="BlurWaterMask"], 
        div[style*="BlurWaterMask"], 
        [style*="BlurWaterMask"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
        }
    `;
    document.head.appendChild(style);

    function clean(url) {
        if (!url || typeof url !== 'string') return url;
        if (!/bl-\d+/.test(url)) return url;
        return url
            .replace(/,bl-\d+/g, '')
            .replace(/bl-\d+,/g, '')
            .replace(/([?&])bl-\d+/g, '$1');
    }

    function scan() {
        let fixed = 0;

        // --- ลบ SVG Mask ที่ซ้อนทับรูป ---
        document.querySelectorAll('img, div').forEach(el => {
            // ถ้าเป็นแท็ก img ที่ src มีคำว่า BlurWaterMask ให้ลบทิ้ง
            if (el.tagName === 'IMG' && el.src && el.src.includes('BlurWaterMask')) {
                el.remove();
                fixed++;
            }
            // ถ้าเป็น div ที่ใช้ background-image เป็น SVG Mask ให้ลบทิ้ง
            if (el.style && el.style.backgroundImage && el.style.backgroundImage.includes('BlurWaterMask')) {
                el.style.display = 'none';
                fixed++;
            }
        });

        // --- ลบ Blur ของภาพปกติ (จากรอบที่แล้ว) ---
        document.querySelectorAll('img').forEach(function (i) {
            if (i.src && /bl-\d+/.test(i.src)) {
                try {
                    i.removeAttribute('srcset');
                    i.removeAttribute('sizes');
                    i.src = clean(i.src);
                    fixed++;
                } catch (e) {}
            }
        });

        if (fixed > 0) console.log('[CUPE v7] Fixed (Images + Masks):', fixed);
    }

    // โหลดปุ๊บสแกนปั๊บ + สแกนตลอดเวลา
    scan();
    setInterval(scan, SCAN_INTERVAL);

    // สแกนซ้ำเมื่อมีการเลื่อนจอ (Lazy Load)
    document.addEventListener('scroll', () => setTimeout(scan, 100), { passive: true });
})();
