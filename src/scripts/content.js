// content.js - Runs in ISOLATED world (extension context)
// This script injects the interceptor into the main world and handles storage

(function () {
    'use strict';

    /**
     * Inject the interceptor script into the main world
     */
    function injectInterceptor() {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('src/scripts/interceptor.js');
        script.onload = function () {
            this.remove();
        };

        // Inject as early as possible
        (document.head || document.documentElement).appendChild(script);

        console.log('[Data Bridge Content] Interceptor injected');
    }

    /**
     * Listen for messages from the main world (interceptor.js)
     */
    window.addEventListener('message', async (event) => {
        // Only accept messages from the same origin
        if (event.source !== window) {
            return;
        }

        // Check if this is our capture message
        if (event.data && event.data.type === 'DATA_BRIDGE_CAPTURE') {
            const { payload, url, method, timestamp } = event.data;

            try {
                // Retrieve existing captured data
                const result = await chrome.storage.local.get('capturedPayloads');
                const existingPayloads = result.capturedPayloads || [];

                // Add the new payload
                const captureEntry = {
                    id: Date.now() + Math.random(), // Simple unique ID
                    payload,
                    url,
                    method,
                    timestamp,
                    capturedAt: new Date().toISOString()
                };

                existingPayloads.push(captureEntry);

                // Keep only the last 50 entries to avoid storage bloat
                const trimmedPayloads = existingPayloads.slice(-50);

                // Save to chrome.storage.local
                await chrome.storage.local.set({
                    capturedPayloads: trimmedPayloads,
                    lastCapture: captureEntry
                });

                console.log('[Data Bridge Content] Payload saved to storage:', captureEntry);

                // Update badge to show capture count
                if (chrome.action && chrome.action.setBadgeText) {
                    chrome.action.setBadgeText({ text: String(trimmedPayloads.length) });
                    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
                }
            } catch (error) {
                console.error('[Data Bridge Content] Error saving payload:', error);
            }
        }
    });

    // Inject the interceptor script
    injectInterceptor();
})();
