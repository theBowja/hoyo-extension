/**
 * @fileoverview Runtime utilities for Genshin Impact data conversion.
 */

/** @type {string} Current version of the internal data schema */
export const INTERNAL_DATA_VERSION = '1.0.0';

/**
 * Creates a default empty structure for Genshin Impact data.
 * @returns {import('../types/genshin').GenshinInternalData}
 */
export function createEmptyGenshinData() {
    return {
        version: INTERNAL_DATA_VERSION,
        game: 'genshin',
        timestamp: new Date().toISOString(),
        userData: {
            nickname: '',
            uid: ''
        },
        characters: [],
        stats: {
            totalCharacters: 0,
            maxLevelCharacters: 0
        }
    };
}
