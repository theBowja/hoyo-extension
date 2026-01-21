// interceptor.js - Runs in MAIN world (same context as the page)
// This script monkey-patches window.fetch to capture JSON payloads

(function () {
  'use strict';

  // Store the original fetch function
  const originalFetch = window.fetch;

  // Define the URL pattern you want to intercept
  // Modify this regex to match your specific endpoint
  const TARGET_URL_PATTERN = /\/api\/someEndpoint/i;

  /**
   * Show a toast notification in the DOM
   * @param {string} message - The message to display
   * @param {string} type - 'success' or 'error'
   */
  function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `data-bridge-toast data-bridge-toast-${type}`;
    toast.textContent = message;

    // Inject CSS if not already present
    if (!document.getElementById('data-bridge-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'data-bridge-toast-styles';
      style.textContent = `
        .data-bridge-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 16px 24px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 999999;
          animation: slideIn 0.3s ease-out;
          max-width: 300px;
        }
        
        .data-bridge-toast-success {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .data-bridge-toast-error {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Add to DOM
    document.body.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Monkey-patched fetch function
   */
  window.fetch = async function (...args) {
    const [url, config = {}] = args;

    // Check if this is a POST or PUT request
    const method = (config.method || 'GET').toUpperCase();
    const shouldIntercept = (method === 'POST' || method === 'PUT');

    // Check if URL matches our target pattern
    const urlString = typeof url === 'string' ? url : url.url || '';
    const matchesPattern = TARGET_URL_PATTERN.test(urlString);

    // Check if this is the character list API (HoYoLAB specific)
    const isCharacterListAPI = urlString.includes('sg-public-api.hoyolab.com/event/game_record/genshin/api/character/list');

    console.log("TESTINGTESTING: ", url)

    if (shouldIntercept && matchesPattern && config.body) {
      try {
        // Attempt to parse the body as JSON
        let payload;

        if (typeof config.body === 'string') {
          payload = JSON.parse(config.body);
        } else if (config.body instanceof FormData) {
          // Skip FormData - we're only interested in JSON
          console.log('[Data Bridge] Skipping FormData payload');
        } else if (config.body instanceof URLSearchParams) {
          // Skip URLSearchParams
          console.log('[Data Bridge] Skipping URLSearchParams payload');
        } else {
          // Assume it's already a JSON object
          payload = config.body;
        }

        if (payload) {
          // Send the payload to the isolated world (content script)
          window.postMessage({
            type: 'DATA_BRIDGE_CAPTURE',
            payload: payload,
            url: urlString,
            method: method,
            timestamp: new Date().toISOString()
          }, '*');

          // Show success toast
          showToast('✓ Data captured successfully!', 'success');

          console.log('[Data Bridge] Captured payload:', payload);
        }
      } catch (error) {
        console.error('[Data Bridge] Error parsing request body:', error);
        showToast('✗ Failed to capture data', 'error');
      }
    }

    // Call the original fetch first
    const response = await originalFetch.apply(this, args);

    // Intercept character list API response
    if (isCharacterListAPI && method === 'POST') {
      try {
        // Clone the response so we can read it without consuming it
        const clonedResponse = response.clone();
        const responseData = await clonedResponse.json();

        // Get request payload
        let requestPayload = null;
        if (config.body) {
          if (typeof config.body === 'string') {
            requestPayload = JSON.parse(config.body);
          } else {
            requestPayload = config.body;
          }
        }

        console.log('[Data Bridge] Intercepted character list API');
        console.log('[Data Bridge] Request:', requestPayload);
        console.log('[Data Bridge] Response:', responseData);

        // Send to content script to trigger button injection
        window.postMessage({
          type: 'HOYOLAB_CHARACTER_LIST_DETECTED',
          requestPayload: requestPayload,
          responseData: responseData,
          timestamp: new Date().toISOString()
        }, '*');

      } catch (error) {
        console.error('[Data Bridge] Error intercepting character list response:', error);
      }
    }

    // Always return the original response
    return response;
  };

  console.log('[Data Bridge] Fetch interceptor initialized');
})();
