/**
 * Genshin Impact Data Converter
 * 
 * Converts the raw API response from HoYoLAB character details endpoint
 * into the extension's internal format.
 */

/**
 * Converts the raw Genshin Impact character details response
 * @param {Object} rawData - The raw JSON response from the API
 * @returns {import('../../types/genshin-v1').GenshinInternalData} The parsed data in internal format
 */
export function parseGenshinData(rawData) {
    console.log('[Genshin Parser] Parsing raw data:', rawData);

    const internalFormat = {
        version: 1,
        game: 'genshin',
        timestamp: Date.now(),
        user: {
            uid: rawData.data.uid,
            server: rawData.data.server,
            // nickname: rawData.data.nickname,
            // level: rawData.data.level
        },
        characters: rawData.data.list.map(character => parseCharacter(character))
    };

    return internalFormat;
}

/**
 * Converts a single character from the raw API response
 * @param {Object} rawDataCharacter - The raw character data from the API
 * @returns {import('../../types/genshin-v1').GenshinCharacter} The parsed character in internal format
 */
function parseCharacter(rawDataCharacter) {

}

/**
 * Validates if the data is a valid Genshin Impact response
 * @param {Object} data - The data to validate
 * @returns {boolean} True if valid
 */
export function isValidGenshinData(data) {
    // TODO: Implement validation logic
    return data && data.retcode === 0 && data.message === 'OK' && data.data;
}
