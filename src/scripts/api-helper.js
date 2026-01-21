// api-helper.js - Utility functions for making API requests via background script
// This file can be imported by content scripts to make authenticated API calls

'use strict';

/**
 * Make an authenticated API request via the background script
 * This ensures the request is made with the user's cookies (credentials: 'include')
 * 
 * @param {string} url - The API URL to fetch from
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} The API response data
 * 
 * @example
 * // GET request
 * const data = await fetchViaBackground('https://site-a.com/api/user-data');
 * 
 * @example
 * // POST request
 * const result = await fetchViaBackground('https://site-a.com/api/submit', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ key: 'value' })
 * });
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
                // Check for errors
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                // Check response success
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
 * Example: Fetch user data from Site A's API
 * This is a convenience wrapper around fetchViaBackground
 * 
 * @param {string} endpoint - The API endpoint (will be appended to base URL)
 * @returns {Promise<Object>} The API response
 */
async function fetchFromSiteA(endpoint) {
    // TODO: Replace with your actual Site A domain
    const baseUrl = 'https://site-a.com';
    const url = `${baseUrl}${endpoint}`;

    return fetchViaBackground(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });
}

/**
 * Example: Post data to Site A's API
 * 
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - The data to post
 * @returns {Promise<Object>} The API response
 */
async function postToSiteA(endpoint, data) {
    // TODO: Replace with your actual Site A domain
    const baseUrl = 'https://site-a.com';
    const url = `${baseUrl}${endpoint}`;

    return fetchViaBackground(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchViaBackground,
        fetchFromSiteA,
        postToSiteA
    };
}
