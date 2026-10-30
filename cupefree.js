// ==UserScript==
// @name         CUPE Unblur v9 (SVG Mask Killer + MutationObserver)
// @namespace    http://tampermonkey.net/
// @version      9.0
// @description  Unblur images + remove BlurWaterMask SVG overlays (ฉบับปรับปรุง: MutationObserver, data-src/srcset/picture, CSS document-start)
// @match        *://*.cupe.live/*
// @match        *://cupe.live/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    // 1. CSS ซ่อน SVG Mask ตั้งแต่ document-start (ก่อน render -> กันกระพริบ)
    // ============================================================
    const CSS = `
        img[src*="BlurWaterMask"],
        svg[src*="BlurWaterMask"],
        div[style*="BlurWaterMask"],
        [style*="BlurWaterMask"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.documentElement.appendChild(style);

    // ============================================================
    // 2. เอา parameter เบลอ (bl-N) ออกจาก URL รูป
    //    รองรับ: /upload/...,bl-20,...  |  ?tr=w-1200,bl-70  |  &bl-20  |  srcset
    // ============================================================
    function clean(url) {
        if (!url || typeof url !== 'string') return url;
        if (!/bl-\d+/.test(url)) return url;
        return url
            .replace(/bl-\d+/g, '')            // เอาออกทุกตำแหน่ง (path + query)
            .replace(/,{2,}/g, ',')            // คอมม่าซ้อน -> 1
            .replace(/,\//g, '/')              // คอมม่าหน้า slash ใน path
            .replace(/([?&])&+/g, '$1')        // & ซ้อนใน query
            .replace(/(^|[^:])\/{2,}/g, '$1/') // // ซ้อน (แต่กัน https://)
            .replace(/^,|,$/g, '')             // คอมม่าหัว/ท้าย
            .replace(/[?&]$/, '');             // ? หรือ & ค้างท้าย
    }

    const BLUR_RE = /bl-\d+/;

    // ============================================================
    // 2.5 clean srcset (รายการหลาย URL + descriptor)
    //     ลบเฉพาะ ,bl-N / bl-N, ที่ติดกัน -> ไม่ไปโดนคอมม่าคั่นระหว่าง entry
    // ============================================================
    function cleanSrcset(str) {
        if (!str || typeof str !== 'string') return str;
        if (!BLUR_RE.test(str)) return str;
        return str
            .replace(/,?bl-\d+/gi, '')   // ,bl-N หรือ bl-N
            .replace(/bl-\d+,?/gi, '')   // bl-N, (กันพลาดถ้ามีเครื่องหมายติด)
            .replace(/,{2,}/g, ',')
            .replace(/&{2,}/g, '&')
            .replace(/\s*,/g, ',')
            .replace(/,\s+/g, ', ')
            .replace(/\s{2,}/g, ' ')
            .replace(/^[,\s]+|[,\s]+$/g, '')
            .replace(/[?&]$/, '');
    }

    // ============================================================
    // 3. ซ่อม img ทีละอัน (src, srcset, data-* lazy attributes)
    // ============================================================
    const LAZY_ATTRS = ['data-src', 'data-original', 'data-lazy'];

    function fixImage(img) {
        if (!img) return false;
        let changed = false;

        try {
            if (img.src && BLUR_RE.test(img.src)) {
                img.removeAttribute('srcset');
                img.removeAttribute('sizes');
                img.src = clean(img.src);
                changed = true;
            }
            if (img.srcset && BLUR_RE.test(img.srcset)) {
                img.srcset = cleanSrcset(img.srcset);
                changed = true;
            }
            for (const a of LAZY_ATTRS) {
                const v = img.getAttribute(a);
                if (v && BLUR_RE.test(v)) {
                    img.setAttribute(a, clean(v));
                    changed = true;
                }
            }
            const ds = img.getAttribute('data-srcset');
            if (ds && BLUR_RE.test(ds)) {
                img.setAttribute('data-srcset', cleanSrcset(ds));
                changed = true;
            }
            // <picture><source srcset> ครอบภาพ
            if (img.closest) {
                const pic = img.closest('picture');
                if (pic) {
                    pic.querySelectorAll('source').forEach(srcEl => {
                        const s = srcEl.getAttribute('srcset');
                        if (s && BLUR_RE.test(s)) {
                            srcEl.setAttribute('srcset', cleanSrcset(s));
                            changed = true;
                        }
                    });
                }
            }
        } catch (e) {}

        return changed;
    }

    // ============================================================
    // 4. สแกนหา SVG Mask + img เบลอ (รองรับ node ย่อย)
    // ============================================================
    function scan(root) {
        if (root && root.tagName === 'IMG') {
            return fixImage(root) ? 1 : 0;
        }
        const scope = (root && root.querySelectorAll) ? root : document;
        let fixed = 0;

        // ถอด/ซ่อน SVG Mask + div ที่ใช้ background เป็น mask
        scope.querySelectorAll('img, div, svg').forEach(el => {
            const attrSrc = el.getAttribute ? (el.getAttribute('src') || '') : '';
            if (el.src && el.src.includes('BlurWaterMask')) {
                el.remove();
                fixed++;
            } else if (attrSrc.includes('BlurWaterMask')) {
                el.remove();
                fixed++;
            } else if (el.style && el.style.backgroundImage && el.style.backgroundImage.includes('BlurWaterMask')) {
                el.style.display = 'none';
                fixed++;
            }
        });

        // ลบ blur ใน URL รูป + source ใน <picture>
        scope.querySelectorAll('img').forEach(img => {
            if (fixImage(img)) fixed++;
        });
        scope.querySelectorAll('picture source').forEach(srcEl => {
            const s = srcEl.getAttribute('srcset');
            if (s && BLUR_RE.test(s)) {
                srcEl.setAttribute('srcset', cleanSrcset(s));
                fixed++;
            }
        });

        return fixed;
    }

    function onScan() {
        const n = scan(document);
        if (n > 0) console.log('[CUPE v9] Fixed (Images + Masks):', n);
    }

    // ============================================================
    // 5. เริ่มทำงาน
    // ============================================================
    onScan();

    // 6. MutationObserver แทน setInterval polling
    const observer = new MutationObserver(muts => {
        let fixed = 0;
        for (const m of muts) {
            if (m.type === 'childList' && m.addedNodes) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) fixed += scan(node);
                }
            } else if (m.type === 'attributes') {
                const t = m.target;
                if (t && t.tagName === 'IMG') {
                    if (fixImage(t)) fixed++;
                } else if (t && t.querySelectorAll) {
                    fixed += scan(t);
                }
            }
        }
        if (fixed > 0) console.log('[CUPE v9] Fixed:', fixed);
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcset', 'style', 'data-src', 'data-original', 'data-lazy', 'data-srcset']
    });

    // 7. lazy-load แบบ scroll
    document.addEventListener('scroll', () => setTimeout(onScan, 100), { passive: true });
})();
