// background.js - Service Worker for Manifest V3
// Handles extension lifecycle and badge updates

'use strict';

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details.reason);

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

        console.log('Badge updated:', count);
    }
});

/**
 * Handle extension icon click - open popup
 */
chrome.action.onClicked.addListener(() => {
    // This will be handled by the popup automatically
    console.log('Extension icon clicked');
});

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request.action);

    // Handle fetch requests from content scripts
    if (request.action === 'FETCH_API') {
        handleBackgroundFetch(request.url, request.options)
            .then(response => {
                sendResponse({ success: true, data: response });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });

        // Return true to indicate we will send a response asynchronously
        return true;
    }

    // Handle other message types here
    return false;
});

/**
 * Fetch data from Site A's API with user credentials
 * This runs in the background script context, allowing it to make
 * cross-origin requests with the user's cookies
 * 
 * @param {string} url - The API URL to fetch from
 * @param {Object} options - Additional fetch options to merge
 * @returns {Promise<Object>} The parsed JSON response
 */
async function handleBackgroundFetch(url, options = {}) {
    try {
        console.log('Fetching:', url);

        // Merge options with defaults
        const fetchOptions = {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetch successful:', data);

        return data;
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}
