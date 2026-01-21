// popup.js - Popup UI logic
'use strict';

/**
 * Format timestamp as relative time (e.g., "2 minutes ago")
 */
function getRelativeTime(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Update the popup UI with current data
 */
async function updateUI() {
    try {
        const result = await chrome.storage.local.get(['capturedPayloads', 'lastCapture']);
        const payloads = result.capturedPayloads || [];
        const lastCapture = result.lastCapture;

        // Update stats
        document.getElementById('total-captures').textContent = payloads.length;

        if (lastCapture) {
            document.getElementById('last-capture-time').textContent = getRelativeTime(lastCapture.timestamp);

            // Show preview section
            const previewSection = document.getElementById('preview-section');
            previewSection.style.display = 'block';

            // Update preview content
            document.getElementById('preview-method').textContent = lastCapture.method;
            document.getElementById('preview-url').textContent = lastCapture.url;
            document.getElementById('preview-timestamp').textContent = new Date(lastCapture.timestamp).toLocaleString();
        } else {
            document.getElementById('last-capture-time').textContent = 'Never';
            document.getElementById('preview-section').style.display = 'none';
        }
    } catch (error) {
        console.error('[Popup] Error updating UI:', error);
    }
}

/**
 * View all captured data (open options page or create a new tab)
 */
function viewAllData() {
    // Create a simple data viewer page
    chrome.tabs.create({
        url: chrome.runtime.getURL('src/ui/viewer.html')
    });
}

/**
 * Clear all captured data
 */
async function clearAllData() {
    if (confirm('Are you sure you want to clear all captured data? This cannot be undone.')) {
        try {
            await chrome.storage.local.set({
                capturedPayloads: [],
                lastCapture: null
            });

            // Update badge
            chrome.action.setBadgeText({ text: '0' });

            // Update UI
            updateUI();

            console.log('[Popup] All data cleared');
        } catch (error) {
            console.error('[Popup] Error clearing data:', error);
            alert('Failed to clear data. See console for details.');
        }
    }
}

/**
 * Export captured data as JSON
 */
async function exportData() {
    try {
        const result = await chrome.storage.local.get(['capturedPayloads']);
        const payloads = result.capturedPayloads || [];

        if (payloads.length === 0) {
            alert('No data to export');
            return;
        }

        // Create a JSON blob
        const dataStr = JSON.stringify(payloads, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `data-bridge-export-${timestamp}.json`;

        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        });

        console.log('[Popup] Data exported:', filename);
    } catch (error) {
        console.error('[Popup] Error exporting data:', error);
        alert('Failed to export data. See console for details.');
    }
}

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', () => {
    // Update UI on load
    updateUI();

    // Attach event listeners
    document.getElementById('view-all-btn').addEventListener('click', viewAllData);
    document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
    document.getElementById('export-btn').addEventListener('click', exportData);

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            updateUI();
        }
    });
});
