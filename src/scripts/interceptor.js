// interceptor.js - Runs in MAIN world (same context as the page)
// This script monkey-patches window.XMLHttpRequest to capture JSON payloads

(function () {
  'use strict';

  const TARGET_URL = 'sg-public-api.hoyolab.com/event/game_record/genshin/api/character/list';

  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function () {
    const xhr = new originalXHR();

    // 1. Tag the instance with its URL
    const originalOpen = xhr.open;
    xhr.open = function (method, url) {
      this._url = url;
      return originalOpen.apply(this, arguments);
    };

    // 2. Capture payload IF the URL matches
    const originalSend = xhr.send;
    xhr.send = function (data) {
      if (data && this._url?.includes(TARGET_URL)) {
        try {
          this._payload = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) { /* Not JSON */ }
      }
      return originalSend.apply(this, arguments);
    };

    // 3. Emit data on success
    xhr.addEventListener('load', function () {
      if (this.status === 200 && this._url?.includes(TARGET_URL)) {
        try {
          window.postMessage({
            type: 'HOYOLAB_CHARACTER_LIST_DETECTED',
            requestPayload: this._payload,
            responseData: JSON.parse(this.responseText),
            timestamp: Date.now()
          }, window.location.origin);
        } catch (e) { /* Parse error */ }
      }
    });

    return xhr;
  };

  console.log('[Data Bridge] Fetch interceptor initialized');
})();
