// ==UserScript==
// @name         CUPE free spacial
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  unblur images on all pages of cupe.live
// @author       testbug
// @match        https://*.cupe.live/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to modify image URLs and remove SVG images
    function modifyAndRemoveImages() {
        // Select all image elements on the page
        const images = document.querySelectorAll('img');

        // Loop through each image element
        images.forEach(img => {
            const src = img.src;
            // Check if the src attribute contains the specific pattern .jpeg?tr=w-1200,bl-70
            if (src.includes('.jpeg?tr=w-1200,bl-70')) {
                // Replace the pattern with .jpeg
                const newSrc = src.replace('.jpeg?tr=w-1200,bl-70', '.jpeg');
                // Update the src attribute of the image element
                img.src = newSrc;
            }
            // Check if the src attribute contains the specific pattern .jpeg?tr=w-250,h-250,bl-70
            if (src.includes('.jpeg?tr=w-250,h-250,bl-70')) {
                // Replace the pattern with .jpeg
                const newSrc = src.replace('.jpeg?tr=w-250,h-250,bl-70', '.jpeg');
                // Update the src attribute of the image element
                img.src = newSrc;
            }
            // Check if the src attribute contains the specific pattern _cover.jpg?tr=w-1200,bl-70
            if (src.includes('_cover.jpg?tr=w-1200,bl-70')) {
                // Replace the pattern with .mp4
                const newSrc = src.replace('_cover.jpg?tr=w-1200,bl-70', '.mp4');
                // Update the src attribute of the image element
                img.src = newSrc;
            }
            // Check if the src attribute ends with .svg
            if (src.endsWith('.svg')) {
                // Remove the image element from the DOM
                img.remove();
            }
        });
    }

    // Run the function to modify image URLs and remove SVG images on initial page load
    modifyAndRemoveImages();

    // Observe for changes in the DOM to handle dynamically loaded images
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                modifyAndRemoveImages();
            }
        });
    });

    // Configure the observer to watch for changes in the child nodes
    observer.observe(document.body, { childList: true, subtree: true });
})();
