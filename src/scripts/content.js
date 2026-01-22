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
        if (event.source !== window) return;
        if (event.origin !== window.location.origin) return;

        // Check if character list API was detected (user is logged in)
        if (event.data?.type === 'HOYOLAB_CHARACTER_LIST_DETECTED') {
            const { requestPayload, responseData, timestamp } = event.data;

            console.log('[Data Bridge Content] HoYoLAB character list detected!');
            console.log('[Data Bridge Content] Request:', requestPayload);
            console.log('[Data Bridge Content] Response:', responseData);

            console.log('[Data Bridge Content] Data received, injecting buttons...');

            // Inject buttons passing the data directly
            setTimeout(() => {
                injectTestButton();
                injectAPITestButton(requestPayload, responseData, timestamp);
            }, 500);

            return;
        }

        // Check if this is our capture message
        if (event.data?.type === 'DATA_BRIDGE_CAPTURE') {
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
     * Example usage: Uncomment to test background fetch
     * This fetches data from Site A's API using the user's cookies
     */
    /*
    async function exampleFetchData() {
        try {
            // Example: Fetch user profile data
            const userData = await fetchViaBackground('https://site-a.com/api/user/profile');
            console.log('[Data Bridge Content] Fetched user data:', userData);
            
            // Example: Post data to API
            const postResult = await fetchViaBackground('https://site-a.com/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'value' })
            });
            console.log('[Data Bridge Content] Posted data:', postResult);
        } catch (error) {
            console.error('[Data Bridge Content] Fetch error:', error);
        }
    }
    
    // Uncomment to run the example when page loads
    // exampleFetchData();
    */

    /**
     * Inject a test button for data extraction
     * Only on the HoYoLAB community game records page
     */
    function injectTestButton() {
        // Check if we're on the specific page
        if (!window.location.href.includes('act.hoyolab.com/app/community-game-records-sea')) {
            return;
        }

        // Don't inject if button already exists
        if (document.getElementById('data-bridge-test-btn')) {
            return;
        }

        // Create button
        const button = document.createElement('button');
        button.id = 'data-bridge-test-btn';
        button.textContent = '🔍 Extract Data';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
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
        button.addEventListener('click', extractDataFromPage);

        // Add to page
        document.body.appendChild(button);
        console.log('[Data Bridge] Test button injected');
    }

    /**
     * Extract data from the HoYoLAB page
     * This is a template - customize based on what data you need
     */
    async function extractDataFromPage() {
        console.log('[Data Bridge] Extracting data from page...');

        try {
            // Example: Extract all text content from specific elements
            const extractedData = {
                url: window.location.href,
                timestamp: new Date().toISOString(),
                pageTitle: document.title,

                // Example: Extract game data (customize these selectors)
                gameRecords: extractGameRecords(),

                // Example: Extract user info if visible
                userInfo: extractUserInfo(),

                // Add your custom extraction logic here
                customData: extractCustomData()
            };

            console.log('[Data Bridge] Extracted data:', extractedData);

            // Save to storage
            await chrome.storage.local.set({
                lastExtractedData: extractedData,
                extractedAt: new Date().toISOString()
            });

            // Show success notification
            showNotification('✓ Data extracted successfully!', 'success');

            // Optional: Also save as a captured payload
            const result = await chrome.storage.local.get('capturedPayloads');
            const payloads = result.capturedPayloads || [];
            payloads.push({
                id: Date.now() + Math.random(),
                payload: extractedData,
                url: window.location.href,
                method: 'EXTRACT',
                timestamp: new Date().toISOString(),
                capturedAt: new Date().toISOString()
            });
            await chrome.storage.local.set({
                capturedPayloads: payloads.slice(-50)
            });

        } catch (error) {
            console.error('[Data Bridge] Extraction failed:', error);
            showNotification('✗ Failed to extract data', 'error');
        }
    }

    /**
     * Extract game records from the page
     * Customize these selectors based on actual page structure
     */
    function extractGameRecords() {
        // This is a placeholder - update selectors based on actual page
        const records = [];

        // Example: Find all game record cards
        document.querySelectorAll('[class*="record"], [class*="game"]').forEach((element, index) => {
            if (index < 10) { // Limit to first 10 to avoid too much data
                records.push({
                    text: element.textContent.trim().substring(0, 200),
                    className: element.className
                });
            }
        });

        return records;
    }

    /**
     * Extract user info from the page
     */
    function extractUserInfo() {
        // Example selectors - customize based on actual page
        return {
            profileName: document.querySelector('[class*="profile"], [class*="user"]')?.textContent?.trim() || 'Not found',
            // Add more user-specific selectors here
        };
    }

    /**
     * Extract custom data - customize this function
     */
    function extractCustomData() {
        // Add your custom extraction logic here
        // Example: Extract all images
        const images = Array.from(document.querySelectorAll('img'))
            .slice(0, 5)
            .map(img => ({
                src: img.src,
                alt: img.alt
            }));

        return {
            imageCount: document.querySelectorAll('img').length,
            sampleImages: images,
            // Add more custom fields here
        };
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

    // Button injection is now triggered by detecting the character list API call
    // See the HOYOLAB_CHARACTER_LIST_DETECTED message handler above

    /*
    // OLD: Inject buttons on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectTestButton();
            injectAPITestButton();
        });
    } else {
        injectTestButton();
        injectAPITestButton();
    }

    // Also try to inject after a short delay (in case DOM changes)
    setTimeout(() => {
        injectTestButton();
        injectAPITestButton();
    }, 1000);
    */

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
        if (document.getElementById('data-bridge-api-test-btn')) {
            return;
        }

        // Create button
        const button = document.createElement('button');
        button.id = 'data-bridge-api-test-btn';
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
        console.log('[Data Bridge] API Test button injected');
    }

    /**
     * Test fetching character details from HoYoLAB API via background script
     * This uses the passed character list data to fetch details for all characters
     * @param {Object} requestPayload - The intercepted request payload
     * @param {Object} responseData - The intercepted response data
     */
    async function testAPIFetch(requestPayload, responseData) {
        console.log('[Data Bridge] Testing character detail API fetch...');

        // Update button to show loading state
        const button = document.getElementById('data-bridge-api-test-btn');
        const originalText = button.textContent;
        button.textContent = '⏳ Fetching...';
        button.disabled = true;
        button.style.opacity = '0.7';

        try {
            console.log('[Data Bridge] Received character list data:', requestPayload, responseData);
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

            console.log('[Data Bridge] Server:', server);
            console.log('[Data Bridge] Role ID:', role_id);
            console.log('[Data Bridge] Character IDs:', characterIds);

            // API endpoint for character details
            const url = 'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/detail';

            // Prepare payload with all character IDs
            const payload = {
                server: server,
                role_id: role_id,
                character_ids: characterIds
            };

            console.log('[Data Bridge] Fetching character details from:', url);
            console.log('[Data Bridge] Payload:', payload);

            // Make the request via background script (includes cookies)
            const data = await fetchViaBackground(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('[Data Bridge] Character Details Response:', data);

            // Save the response to storage
            await chrome.storage.local.set({
                hoyolabCharacterDetails: data,
                lastAPIFetchTime: new Date().toISOString()
            });

            // Also add to captured payloads
            const result = await chrome.storage.local.get('capturedPayloads');
            const payloads = result.capturedPayloads || [];
            payloads.push({
                id: Date.now() + Math.random(),
                payload: data,
                url: url,
                method: 'POST',
                timestamp: new Date().toISOString(),
                capturedAt: new Date().toISOString(),
                requestBody: payload,
                characterCount: characterIds.length
            });
            await chrome.storage.local.set({
                capturedPayloads: payloads.slice(-50)
            });

            // Show success
            showNotification(`✓ Fetched details for ${characterIds.length} characters! Check console.`, 'success');

            // Reset button
            button.textContent = originalText;
            button.disabled = false;
            button.style.opacity = '1';

        } catch (error) {
            console.error('[Data Bridge] API fetch failed:', error);
            showNotification(`✗ API fetch failed: ${error.message}`, 'error');

            // Reset button
            button.textContent = originalText;
            button.disabled = false;
            button.style.opacity = '1';
        }
    }
})();
