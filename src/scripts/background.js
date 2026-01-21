// background.js - Service Worker for Manifest V3
// Handles extension lifecycle and badge updates

'use strict';

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Data Bridge Background] Extension installed:', details.reason);

    // Initialize storage with empty array
    chrome.storage.local.set({
        capturedPayloads: [],
        lastCapture: null
    });

    // Set initial badge
    chrome.action.setBadgeText({ text: '0' });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
});

/**
 * Listen for storage changes to update badge
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.capturedPayloads) {
        const newPayloads = changes.capturedPayloads.newValue || [];
        const count = newPayloads.length;

        // Update badge text
        chrome.action.setBadgeText({ text: String(count) });

        console.log('[Data Bridge Background] Badge updated:', count);
    }
});

/**
 * Handle extension icon click - open popup
 */
chrome.action.onClicked.addListener(() => {
    // This will be handled by the popup automatically
    console.log('[Data Bridge Background] Extension icon clicked');
});
