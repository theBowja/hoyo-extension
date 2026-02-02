/**
 * Content script for Genshin Optimizer integration
 * Injects an "Import from HoyoLab" button into the database upload dialog
 */

'use strict';

import { log, logError } from '../../utils/logger.js';
import { parseGOOD3Data } from '../../converters/parsers/gi-good3-parser.js';

// --- State ---

// Flag to track if button has been injected
let buttonInjected = false;

// --- Initialization ---

// Wait for DOM to be ready and initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Initializes the content script
 */
function init() {
    log('Genshin Optimizer content script loaded');

    // Check if dialog is already present
    const existingDialog = findUploadDialog();
    if (existingDialog) {
        injectButton(existingDialog);
    }

    // Set up mutation observer to watch for dialog appearance
    const observer = new MutationObserver(handleMutations);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    log('MutationObserver initialized');
}

// --- Core Logic ---

/**
 * Handles mutations and checks for the upload dialog
 * @param {MutationRecord[]} mutations - Array of mutation records
 */
function handleMutations(mutations) {
    // Optimization: Only check for dialogs if we are on the settings page
    if (!window.location.href.includes('/setting')) {
        return;
    }

    for (const mutation of mutations) {
        // Check for modal opening
        if (!buttonInjected && mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            let modalAdded = false;
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE &&
                    node.tagName === 'DIV' &&
                    node.classList.contains('MuiModal-root')) {
                    modalAdded = true;
                    break;
                }
            }

            if (modalAdded) {
                log('Upload dialog detected', mutation);
                const dialog = findUploadDialog();
                if (dialog) {
                    injectButton(dialog);
                    break;
                }
            }
        }
    }
}

/**
 * Injects the import button into the dialog
 * @param {HTMLElement} dialog - The upload dialog element
 */
function injectButton(dialog) {
    // Check if button already exists
    if (dialog.querySelector('[data-leysync-injected="true"]')) {
        log('Import button already injected');
        return;
    }

    const labels = dialog.querySelectorAll('label[for="icon-button-file"]');
    const parentGrid = labels[0].parentElement.parentElement;

    if (!parentGrid) {
        log('Could not find parent grid container');
        return;
    }

    // Create a new grid item for our button
    const gridItem = document.createElement('div');
    gridItem.className = 'MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 css-1wxaqej';

    // Create wrapper label
    const label = document.createElement('label');
    label.appendChild(createImportButton());

    gridItem.appendChild(label);

    // Find the last grid item in the parent grid and insert after it
    const gridItems = parentGrid.querySelectorAll('.MuiGrid-item');
    const lastGridItem = gridItems[gridItems.length - 1];

    if (lastGridItem) {
        lastGridItem.parentNode.insertBefore(gridItem, lastGridItem.nextSibling);
    } else {
        // Fallback: just append to the grid
        parentGrid.appendChild(gridItem);
    }

    buttonInjected = true;
    log('Successfully injected "Import from HoyoLab" button');
}

// --- Helpers ---

/**
 * Finds the upload dialog popup in the DOM
 * Uses text content to identify the dialog since class names may be randomized
 * @returns {HTMLElement|null} The popup element or null if not found
 */
function findUploadDialog() {
    // Look for the modal/dialog container
    const containers = document.querySelectorAll('[role="dialog"], .MuiContainer-root');

    for (const container of containers) {
        // Look for the file input for .json files
        const fileInput = container.querySelector('input[type="file"][accept=".json"]');
        // Also check for the textarea where users can paste data
        const textarea = container.querySelector('textarea');

        // Both should be present in the upload dialog
        if (fileInput && textarea) {
            return container;
        }
    }

    return null;
}

/**
 * Creates the "Import from HoyoLab" button with matching styles
 * @returns {HTMLElement} The button element
 */
function createImportButton() {
    const button = document.createElement('button');
    button.className = 'MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary MuiButton-root MuiButton-contained MuiButton-containedPrimary MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-colorPrimary css-w54i9k';
    button.setAttribute('tabindex', '0');
    button.setAttribute('role', 'button');
    button.setAttribute('type', 'button');
    button.setAttribute('data-leysync-injected', 'true');

    // Create button icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'MuiButton-icon MuiButton-startIcon MuiButton-iconSizeMedium css-6xugel';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-vubbuv');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Cloud download icon
    path.setAttribute('d', 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z');

    svg.appendChild(path);
    iconSpan.appendChild(svg);

    // Create text node
    const textNode = document.createTextNode('Import from HoyoLab');

    // Create ripple effect span
    const rippleSpan = document.createElement('span');
    rippleSpan.className = 'MuiTouchRipple-root css-w0pj6f';

    // Assemble button
    button.appendChild(iconSpan);
    button.appendChild(textNode);
    button.appendChild(rippleSpan);

    // Add click event listener
    button.addEventListener('click', handleImportClick);

    return button;
}

/**
 * Fetch Genshin character data from HoYoLAB API via background script
 * @param {string} server - The server ID (e.g., "os_usa", "os_asia")
 * @param {string} roleId - The user's role ID (UID)
 * @param {Array<number|string>} characterIds - List of character IDs to fetch
 * @returns {Promise<Object>} The API response
 */
async function getCharacterData(server, roleId, characterIds) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                action: 'GET_GENSHIN_CHARACTER_DATA',
                server: server,
                roleId: roleId,
                characterIds: characterIds
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
 * Handles the import button click event
 */
async function handleImportClick() {
    log('Injected button clicked');

    const response = await getCharacterData('os_usa', '605594547');
    console.log(response);
    const data = parseGOOD3Data(response);
    console.log(data);
    return data;

    // Send message to the found tab
    // chrome.runtime.sendMessage({
    //     action: 'FETCH_GENSHIN',
    // }, (msgResponse) => {
    //     if (chrome.runtime.lastError) {
    //         logError('Error sending message:', chrome.runtime.lastError);
    //         alert('Failed to send message to HoYoLab tab.');
    //     } else if (msgResponse && msgResponse.success) {
    //         log('Message sent successfully', msgResponse.response);
    //         alert('Request sent to HoYoLab tab!');
    //     } else {
    //         logError('Message sending failed', msgResponse);
    //         alert('Failed to send request to HoYoLab tab.');
    //     }
    // });
}
