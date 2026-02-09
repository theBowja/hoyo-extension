// background.js - Service Worker for Manifest V3
// Handles extension lifecycle and badge updates

'use strict';

// Track the tab that requested login
let loginRequesterTabId = null;

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
        getGenshinCharacterList(request, sender.tab?.id)
            .then(response => {
                sendResponse({ success: true, data: response });
            })
            .catch(error => {
                sendResponse({
                    success: false,
                    error: error.message,
                    needsLogin: error.needsLogin || false
                });
            });
        return true;
    }

    if (request.action === 'GET_GENSHIN_CHARACTER_DATA') {
        getGenshinCharacterData(request, sender.tab?.id)
            .then(response => {
                sendResponse({ success: true, data: response });
            })
            .catch(error => {
                sendResponse({
                    success: false,
                    error: error.message,
                    needsLogin: error.needsLogin || false
                });
            });
        return true;
    }

    if (request.action === 'GENSHIN_LOGIN_COMPLETE') {
        console.log('Login complete received:', request);

        // Forward the message to the requester tab if we have one
        if (loginRequesterTabId) {
            console.log('Forwarding login complete to requester tab:', loginRequesterTabId);
            chrome.tabs.sendMessage(loginRequesterTabId, request).catch(error => {
                console.error('Error forwarding login complete:', error);
            });

            // Clear the requester tab ID
            loginRequesterTabId = null;
        }

        return false;
    }

    if (request.action === 'CLOSE_CURRENT_TAB') {
        console.log('Close current tab requested');

        // Close the tab that sent this message
        if (sender.tab && sender.tab.id) {
            console.log('Closing tab:', sender.tab.id);
            chrome.tabs.remove(sender.tab.id).catch(error => {
                console.error('Error closing tab:', error);
            });
        }

        return false;
    }

    return false;
});

async function resolveGenshinUser(request, requesterTabId) {
    if (request.server && request.roleId) return;

    // Retrieve server and roleId from storage
    const result = await chrome.storage.local.get(['genshinServer', 'genshinRoleId']);
    if (result.genshinServer && result.genshinRoleId) {
        request.server = result.genshinServer;
        request.roleId = result.genshinRoleId;
        console.log('Retrieved from storage - server:', request.server, 'roleId:', request.roleId);
    } else if (request.autoLogin) {
        console.log('No server or roleId found, opening login popup');
        await openHoyoLabLoginPopup(requesterTabId);
    } else {
        throwLoginError();
    }
}

async function getGenshinCharacterList(request, requesterTabId) {
    const url = 'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/list';
    await resolveGenshinUser(request, requesterTabId);
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
    return await getJsonResponseData(response, request.autoLogin, requesterTabId, 'getGenshinCharacterList');
}

async function getGenshinCharacterData(request, requesterTabId) {
    const url = 'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/detail';
    await resolveGenshinUser(request, requesterTabId);
    if (!request.characterIds) {
        const data = await getGenshinCharacterList(request, requesterTabId);
        request.characterIds = data.list.map(character => character.id);
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
    return await getJsonResponseData(response, request.autoLogin, requesterTabId, 'getGenshinCharacterData');
}

async function openHoyoLabLoginPopup(requesterTabId) {
    const loginUrl = 'https://act.hoyolab.com/app/community-game-records-sea/index.html?leysync_auto_close=true';
    console.log('Opening HoyoLab login popup');

    // Store the requester tab ID
    if (requesterTabId) {
        loginRequesterTabId = requesterTabId;
        console.log('Stored requester tab ID:', loginRequesterTabId);
    }

    await chrome.windows.create({
        url: loginUrl,
        type: 'popup',
        width: 800,
        height: 600
    });
}

async function getJsonResponseData(response, autoLogin, requesterTabId, functionName) {
    const data = await response.json();
    console.log(functionName, 'response:', data);
    if (data.retcode === 10001) {
        if (autoLogin) {
            await openHoyoLabLoginPopup(requesterTabId);
        }
        throwLoginError();
    }
    if (data.retcode !== 0) {
        throw new Error(data.message);
    }
    return data.data;
}

function throwLoginError() {
    const error = new Error('Please login to HoyoLab');
    error.needsLogin = true;
    throw error;
}
