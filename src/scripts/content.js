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

        console.log('[LeySync Content] Interceptor injected');
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

            console.log('[LeySync Content] HoYoLAB character list detected!');
            console.log('[LeySync Content] Request:', requestPayload);
            console.log('[LeySync Content] Response:', responseData);

            console.log('[LeySync Content] Data received, injecting buttons...');

            // Inject buttons passing the data directly
            setTimeout(() => {
                injectAPITestButton(requestPayload, responseData, timestamp);
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

                console.log('[LeySync Content] Payload saved to storage:', captureEntry);

                // Update badge to show capture count
                if (chrome.action && chrome.action.setBadgeText) {
                    chrome.action.setBadgeText({ text: String(trimmedPayloads.length) });
                    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
                }
            } catch (error) {
                console.error('[LeySync Content] Error saving payload:', error);
            }
        }
    });

    // Inject the interceptor script
    injectInterceptor();

    /**
     * Example: Fetch data from Site A's API via background script
     * This uses the background script to make authenticated requests with cookies
     * 
     * @param {string} url - The API URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} The API response
     */
    async function fetchViaBackground(url, options = {}) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                {
                    action: 'FETCH_API',
                    url: url,
                    options: options
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }

                    if (response && response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response?.error || 'Unknown error'));
                    }
                }
            );
        });
    }

    /**
     * Show a notification on the page
     */
    function showNotification(message, type = 'success') {
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

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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
        console.log('[LeySync] API Test button injected');
    }

    /**
     * Test fetching character details from HoYoLAB API via background script
     * This uses the passed character list data to fetch details for all characters
     * @param {Object} requestPayload - The intercepted request payload
     * @param {Object} responseData - The intercepted response data
     */
    async function testAPIFetch(requestPayload, responseData) {
        console.log('[LeySync] Testing character detail API fetch...');

        // Update button to show loading state
        const button = document.getElementById('leysync-api-test-btn');
        const originalText = button.textContent;
        button.textContent = '⏳ Fetching...';
        button.disabled = true;
        button.style.opacity = '0.7';

        try {
            console.log('[LeySync] Received character list data:', requestPayload, responseData);
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

            console.log('[LeySync] Server:', server);
            console.log('[LeySync] Role ID:', role_id);
            console.log('[LeySync] Character IDs:', characterIds);

            // API endpoint for character details
            const url = 'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/detail';

            // Prepare payload with all character IDs
            const payload = {
                server: server,
                role_id: role_id,
                character_ids: characterIds
            };

            console.log('[LeySync] Fetching character details from:', url);
            console.log('[LeySync] Payload:', payload);

            // Make the request via background script (includes cookies)
            const data = await fetchViaBackground(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    "x-rpc-language": "en-us",
                    "x-rpc-lang": "en-us"
                },
                body: JSON.stringify(payload)
            });

            console.log('[LeySync] Character Details Response:', data);

            // Dynamically import the parser
            const parserUrl = chrome.runtime.getURL('src/converters/parsers/genshin-parser.js');
            const { parseGenshinData } = await import(parserUrl);

            // Parse the data
            const parsedData = parseGenshinData(data);
            console.log('[LeySync] Parsed Data:', parsedData);

            // Format to GOOD
            const formatterUrl = chrome.runtime.getURL('src/converters/formatters/good-formatter.js');
            const { formatGOOD } = await import(formatterUrl);
            const formattedData = formatGOOD(parsedData, {
                removeManekin: true,
                addTravelerElementToKey: true,
                minCharacterLevel: 50
            });
            console.log('[LeySync] Formatted Data:', formattedData);

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
            console.error('[LeySync] API fetch failed:', error);
            showNotification(`✗ API fetch failed: ${error.message}`, 'error');

            // Reset button
            button.textContent = originalText;
            button.disabled = false;
            button.style.opacity = '1';
        }
    }
})();
