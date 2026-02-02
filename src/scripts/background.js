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

    if (request.action === 'GET_GENSHIN_CHARACTER_LIST') {
        getGenshinCharacterList(request)
            .then(response => {
                sendResponse({ success: true, data: response });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    if (request.action === 'GET_GENSHIN_CHARACTER_DATA') {
        getGenshinCharacterData(request)
            .then(response => {
                sendResponse({ success: true, data: response });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    return false;
});

async function resolveGenshinUser(request) {
    if (request.server && request.roleId) return;

    // Retrieve server and roleId from somewhere
}

async function getGenshinCharacterList(request) {
    const url = 'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/list';
    await resolveGenshinUser(request);
    const payload = {
        server: request.server,
        role_id: request.roleId
    };
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
    return await response.json();
}

async function getGenshinCharacterData(request) {
    const url = 'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/detail';
    await resolveGenshinUser(request);
    if (!request.characterIds) {
        const data = await getGenshinCharacterList(request);
        request.characterIds = data.data.list.map(character => character.id);
    }
    const payload = {
        server: request.server,
        role_id: request.roleId,
        character_ids: request.characterIds
    };
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
    return await response.json();
}
