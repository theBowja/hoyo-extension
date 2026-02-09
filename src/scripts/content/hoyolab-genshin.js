'use strict';

import { parseGenshinData } from '../../converters/parsers/gi-leysync-parser.js';
import { formatGOOD } from '../../converters/formatters/gi-good3-formatter.js';
import { log, logError } from '../../utils/logger.js';

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

    log('Interceptor injected');
}

/**
 * Listen for messages from the main world (interceptor.js)
 */
window.addEventListener('message', async (event) => {
    // Only accept messages from the same origin
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;

    // Check if character list API was detected (user is logged in)
    if (event.data?.type === 'HOYOLAB_CHARACTER_LIST_DETECTED') {
        const { requestPayload, responseData, timestamp } = event.data;

        log('HoYoLAB character list detected!');
        log('Request:', requestPayload);
        log('Response:', responseData);

        // Store server and roleId for use in other content scripts
        if (requestPayload && requestPayload.server && requestPayload.role_id) {
            chrome.storage.local.set({
                genshinServer: requestPayload.server,
                genshinRoleId: requestPayload.role_id
            }).then(() => {
                log('Stored server and roleId:', requestPayload.server, requestPayload.role_id);

                // Check if auto-close is requested via query parameter
                const urlParams = new URLSearchParams(window.location.search);
                const shouldAutoClose = urlParams.get('leysync_auto_close') === 'true';

                // If auto-close is enabled, show notification and schedule close
                if (shouldAutoClose) {
                    showNotification('✓ Login complete! This window will close in {countdown} seconds...', 'success', 4);

                    // Wait 4 seconds before closing
                    setTimeout(() => {
                        chrome.runtime.sendMessage({
                            action: 'CLOSE_CURRENT_TAB'
                        });
                    }, 4000);
                }

                // Broadcast login complete to all tabs
                chrome.runtime.sendMessage({
                    action: 'GENSHIN_LOGIN_COMPLETE',
                    server: requestPayload.server,
                    roleId: requestPayload.role_id
                });
            });
        }

        log('Data received, injecting buttons...');

        // Inject buttons passing the data directly
        setTimeout(() => {
            injectAPITestButton(requestPayload, responseData, timestamp);
            injectNotificationTestButton();
        }, 500);

        return;
    }

    // Check if this is our capture message
    if (event.data?.type === 'LEYSYNC_DATA_CAPTURE') {
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

            log('Payload saved to storage:', captureEntry);

            // Update badge to show capture count
            if (chrome.action && chrome.action.setBadgeText) {
                chrome.action.setBadgeText({ text: String(trimmedPayloads.length) });
                chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
            }
        } catch (error) {
            logError('Error saving payload:', error);
        }
    }
});

// Inject the interceptor script
injectInterceptor();

/**
 * Show a notification on the page
 * @param {string} message - The message to display (use {countdown} as placeholder for countdown)
 * @param {string} type - 'success' or 'error'
 * @param {number} countdownSeconds - If provided, starts a countdown and replaces {countdown} in message
 */
function showNotification(message, type = 'success', countdownSeconds = null) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999999;
            padding: 16px 24px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
        `;

    document.body.appendChild(notification);

    // If countdown is enabled, update the message every second
    if (countdownSeconds !== null && message.includes('{countdown}')) {
        let remaining = countdownSeconds;

        const updateCountdown = () => {
            notification.textContent = message.replace('{countdown}', remaining);
        };

        updateCountdown(); // Initial update

        const intervalId = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                updateCountdown();
            } else {
                clearInterval(intervalId);
                notification.textContent = message.replace('{countdown}', remaining);
            }
        }, 1000);

        // Auto-remove after countdown completes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, countdownSeconds * 1000 + 500); // Add 500ms buffer
    } else {
        // Regular notification with 3 second display
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

/**
 * Inject API test button for testing background fetch
 * @param {Object} requestPayload - The intercepted request payload
 * @param {Object} responseData - The intercepted response data
 */
function injectAPITestButton(requestPayload, responseData) {
    // Check if we're on the specific page
    if (!window.location.href.includes('act.hoyolab.com/app/community-game-records-sea')) {
        return;
    }

    // Don't inject if button already exists
    if (document.getElementById('leysync-api-test-btn')) {
        return;
    }

    // Create button
    const button = document.createElement('button');
    button.id = 'leysync-api-test-btn';
    button.textContent = '🌐 Test API Fetch';
    button.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 999999;
            padding: 12px 24px;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
            transition: all 0.2s ease;
        `;

    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 16px rgba(72, 187, 120, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(72, 187, 120, 0.4)';
    });

    // Click handler - pass the data directly
    button.addEventListener('click', () => testAPIFetch(requestPayload, responseData));

    // Add to page
    document.body.appendChild(button);
    log('API Test button injected');
}

/**
 * Inject notification test button
 */
function injectNotificationTestButton() {
    // Check if we're on the specific page
    if (!window.location.href.includes('act.hoyolab.com/app/community-game-records-sea')) {
        return;
    }

    // Don't inject if button already exists
    if (document.getElementById('leysync-notification-test-btn')) {
        return;
    }

    // Create button
    const button = document.createElement('button');
    button.id = 'leysync-notification-test-btn';
    button.textContent = '🔔 Test Notification';
    button.style.cssText = `
            position: fixed;
            bottom: 140px;
            right: 20px;
            z-index: 999999;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transition: all 0.2s ease;
        `;

    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    // Click handler
    button.addEventListener('click', () => {
        showNotification('✓ Login complete! This window will close in {countdown} seconds...', 'success', 4);
    });

    // Add to page
    document.body.appendChild(button);
    log('Notification Test button injected');
}

/**
 * Fetch character details from HoYoLAB API
 * @param {string} server - The server ID (e.g., "os_asia")
 * @param {string} roleId - The user's role ID (UID)
 * @param {Array<number|string>} characterIds - List of character IDs to fetch
 * @returns {Promise<Object>} The API response data
 */
async function fetchCharacterDetails(server, roleId, characterIds) {
    // API endpoint for character details
    const url = 'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/detail';

    // Prepare payload with all character IDs
    const payload = {
        server: server,
        role_id: roleId,
        character_ids: characterIds
    };

    log('Fetching character details from:', url);
    log('Payload:', payload);

    // Make the request via background script (includes cookies)
    const fetchOptions = {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            "x-rpc-language": "en-us",
            "x-rpc-lang": "en-us"
        },
        body: JSON.stringify(payload)
    };

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetch successful:', data);

    return data;
}

/**
 * Test fetching character details from HoYoLAB API via background script
 * This uses the passed character list data to fetch details for all characters
 * @param {Object} requestPayload - The intercepted request payload
 * @param {Object} responseData - The intercepted response data
 */
async function testAPIFetch(requestPayload, responseData) {
    log('Testing character detail API fetch...');

    // Update button to show loading state
    const button = document.getElementById('leysync-api-test-btn');
    const originalText = button.textContent;
    button.textContent = '⏳ Fetching...';
    button.disabled = true;
    button.style.opacity = '0.7';

    try {
        log('Received character list data:', requestPayload, responseData);
        if (!requestPayload || !responseData) {
            throw new Error('No character list data provided.');
        }

        const { server, role_id } = requestPayload;
        const characterListData = responseData.data;

        if (!characterListData || !characterListData.list || characterListData.list.length === 0) {
            throw new Error('No characters found in the list');
        }

        // Extract all character IDs
        const characterIds = characterListData.list.map(char => char.id);

        log('Server:', server);
        log('Role ID:', role_id);
        log('Character IDs:', characterIds);

        // Fetch character details
        const data = await fetchCharacterDetails(server, role_id, characterIds);

        // Re-define for logging/capture
        const url = 'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/detail';
        const payload = {
            server: server,
            role_id: role_id,
            character_ids: characterIds
        };

        log('Character Details Response:', data);

        // Parse the data
        const parsedData = parseGenshinData(data);
        log('Parsed Data:', parsedData);

        // Format to GOOD
        const formattedData = formatGOOD(parsedData, {
            removeManekin: true,
            addTravelerElementToKey: true,
            minCharacterLevel: 50
        });
        log('Formatted Data:', formattedData);

        // Save the response to storage
        await chrome.storage.local.set({
            hoyolabParsedData: parsedData,
            lastAPIFetchTime: Date.now()
        });

        // Also add to captured payloads
        const result = await chrome.storage.local.get('capturedPayloads');
        const payloads = result.capturedPayloads || [];
        payloads.push({
            id: Date.now() + Math.random(),
            payload: data,
            url: url,
            method: 'POST',
            timestamp: Date.now(),
            capturedAt: Date.now(),
            requestBody: payload,
            characterCount: characterIds.length
        });
        await chrome.storage.local.set({
            capturedPayloads: payloads.slice(-10)
        });

        // Show success
        showNotification(`✓ Fetched details for ${characterIds.length} characters! Check console.`, 'success');

        // Reset button
        button.textContent = originalText;
        button.disabled = false;
        button.style.opacity = '1';

    } catch (error) {
        logError('API fetch failed:', error);
        showNotification(`✗ API fetch failed: ${error.message}`, 'error');

        // Reset button
        button.textContent = originalText;
        button.disabled = false;
        button.style.opacity = '1';
    }
}
