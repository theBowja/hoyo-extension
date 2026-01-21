// dashboard.js - Runs on the static dashboard site
// This script retrieves captured data from chrome.storage.local and displays it

(function () {
    'use strict';

    /**
     * Format JSON data for display
     * @param {Object} data - The data to format
     * @returns {string} Formatted HTML string
     */
    function formatData(data) {
        return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    /**
     * Create a styled card for a capture entry
     * @param {Object} entry - The capture entry
     * @param {number} index - The index of this entry
     * @returns {string} HTML string
     */
    function createCaptureCard(entry, index) {
        return `
      <div class="capture-card" data-id="${entry.id}">
        <div class="capture-header">
          <span class="capture-number">#${index + 1}</span>
          <span class="capture-method">${entry.method}</span>
          <span class="capture-time">${new Date(entry.timestamp).toLocaleString()}</span>
        </div>
        <div class="capture-url">${entry.url}</div>
        <div class="capture-payload">
          ${formatData(entry.payload)}
        </div>
      </div>
    `;
    }

    /**
     * Inject CSS for the dashboard
     */
    function injectStyles() {
        if (document.getElementById('data-bridge-dashboard-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'data-bridge-dashboard-styles';
        style.textContent = `
      .data-view-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .data-view-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .data-view-header h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
      }
      
      .data-view-header p {
        margin: 0;
        opacity: 0.9;
        font-size: 14px;
      }
      
      .capture-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .capture-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .capture-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }
      
      .capture-number {
        background: #667eea;
        color: white;
        padding: 4px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 12px;
      }
      
      .capture-method {
        background: #48bb78;
        color: white;
        padding: 4px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
      }
      
      .capture-time {
        color: #718096;
        font-size: 13px;
        margin-left: auto;
      }
      
      .capture-url {
        color: #4a5568;
        font-size: 13px;
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #f7fafc;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        word-break: break-all;
      }
      
      .capture-payload {
        background: #2d3748;
        border-radius: 6px;
        overflow: auto;
        max-height: 400px;
      }
      
      .capture-payload pre {
        margin: 0;
        padding: 16px;
        color: #e2e8f0;
        font-size: 13px;
        line-height: 1.5;
        font-family: 'Courier New', monospace;
      }
      
      .no-data-message {
        text-align: center;
        padding: 60px 20px;
        color: #718096;
      }
      
      .no-data-message svg {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      .refresh-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        margin-bottom: 20px;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .refresh-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      .refresh-button:active {
        transform: translateY(0);
      }
    `;
        document.head.appendChild(style);
    }

    /**
     * Load and display captured data
     */
    async function loadData() {
        const dataView = document.getElementById('data-view');

        if (!dataView) {
            console.warn('[Data Bridge Dashboard] Element with ID "data-view" not found');
            return;
        }

        try {
            // Retrieve all captured payloads from storage
            const result = await chrome.storage.local.get(['capturedPayloads', 'lastCapture']);
            const payloads = result.capturedPayloads || [];

            // Inject styles
            injectStyles();

            // Build the HTML
            let html = `
        <div class="data-view-container">
          <div class="data-view-header">
            <h2>📊 Captured Data Bridge Payloads</h2>
            <p>Total captures: ${payloads.length} | Last update: ${new Date().toLocaleString()}</p>
          </div>
          <button class="refresh-button" id="refresh-data">🔄 Refresh Data</button>
      `;

            if (payloads.length === 0) {
                html += `
          <div class="no-data-message">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
              <path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
            </svg>
            <h3>No Data Captured Yet</h3>
            <p>Visit Site A and perform actions that trigger the target API calls.</p>
          </div>
        `;
            } else {
                // Reverse to show newest first
                const reversedPayloads = [...payloads].reverse();
                reversedPayloads.forEach((entry, index) => {
                    html += createCaptureCard(entry, payloads.length - index - 1);
                });
            }

            html += '</div>';

            // Update the DOM
            dataView.innerHTML = html;

            // Add event listener to refresh button
            const refreshButton = document.getElementById('refresh-data');
            if (refreshButton) {
                refreshButton.addEventListener('click', loadData);
            }

            console.log('[Data Bridge Dashboard] Loaded', payloads.length, 'captured payloads');
        } catch (error) {
            console.error('[Data Bridge Dashboard] Error loading data:', error);
            dataView.innerHTML = `
        <div class="no-data-message">
          <h3>Error Loading Data</h3>
          <p>${error.message}</p>
        </div>
      `;
        }
    }

    /**
     * Listen for storage changes and auto-update
     */
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.capturedPayloads) {
            console.log('[Data Bridge Dashboard] Storage updated, refreshing...');
            loadData();
        }
    });

    // Load data when the page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadData);
    } else {
        loadData();
    }
})();
