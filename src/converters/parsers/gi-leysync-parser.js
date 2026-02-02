import { log } from '../../utils/logger.js';

/**
 * Genshin Impact Data Converter
 * 
 * Converts the raw API response from HoYoLAB character details endpoint
 * into the extension's internal format.
 */

/**
 * Converts the raw Genshin Impact character details response
 * @param {Object} rawData - The raw JSON response from the API
 * @returns {import('../../types/genshin-v1.js').GenshinInternalData} The parsed data in internal format
 */
export function parseGenshinData(rawData) {
    log('Parsing raw data:', rawData);

    const internalFormat = {
        version: 1,
        game: 'genshin',
        timestamp: Date.now(),
        user: {
            // uid: rawData.data.uid,
            // server: rawData.data.server,
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
 * @returns {import('../../types/genshin-v1.js').GenshinCharacter} The parsed character in internal format
 */
function parseCharacter(rawDataCharacter) {
    const base = rawDataCharacter.base;
    const weapon = rawDataCharacter.weapon;
    const artifacts = rawDataCharacter.relics || [];
    const constellations = rawDataCharacter.constellations || [];
    const outfits = rawDataCharacter.costumes || [];
    const talents = rawDataCharacter.skills || [];

    return {
        id: base.id,
        name: base.name,
        icon_url: base.icon,
        side_icon_url: base.side_icon,
        image_url: base.image,
        element: base.element,
        friendship: base.fetter,
        level: base.level,
        ascension: calculateAscension(base.level), // Approximate based on level
        active_constellations: base.actived_constellation_num,
        weapon: parseWeapon(weapon),
        artifacts: artifacts.map(parseArtifact),
        constellations: constellations.map(parseConstellation),
        outfits: outfits.map(parseOutfit),
        talents: talents.map(talent => parseTalent(talent, constellations))
    };
}

/**
 * Parses weapon data
 * @param {Object} weaponData 
 * @returns {import('../../types/genshin-v1.js').GenshinWeapon}
 */
function parseWeapon(weaponData) {
    return {
        id: weaponData.id,
        name: weaponData.name,
        icon_url: weaponData.icon,
        level: weaponData.level,
        ascension: weaponData.promote_level,
        refinement: weaponData.affix_level
    };
}

/**
 * Parses artifact data
 * @param {Object} artifactData 
 * @returns {import('../../types/genshin-v1.js').GenshinArtifact}
 */
function parseArtifact(artifactData) {
    return {
        id: artifactData.id,
        set_id: artifactData.set.id,
        set_name: artifactData.set.name,
        icon_url: artifactData.icon,
        position: artifactData.pos,
        rarity: artifactData.rarity,
        level: artifactData.level,
        main_stat_type: artifactData.main_property.property_type,
        sub_stats: artifactData.sub_property_list.map(sub => ({
            type: sub.property_type,
            value: sub.value,
            times: sub.times
        }))
    };
}

/**
 * Parses constellation data
 * @param {Object} constellationData 
 * @returns {import('../../types/genshin-v1.js').GenshinConstellation}
 */
function parseConstellation(constellationData) {
    return {
        id: constellationData.id,
        icon_url: constellationData.icon,
        position: constellationData.pos,
        is_active: constellationData.is_actived,
        is_enhanced: constellationData.is_enhanced
    };
}

/**
 * Parses outfit data
 * @param {Object} outfitData 
 * @returns {import('../../types/genshin-v1.js').GenshinOutfit}
 */
function parseOutfit(outfitData) {
    return {
        id: outfitData.id,
        name: outfitData.name,
        icon_url: outfitData.icon
    };
}

/**
 * Parses talent/skill data
 * @param {Object} talentData 
 * @param {Array} constellations
 * @returns {import('../../types/genshin-v1.js').GenshinTalent}
 */
function parseTalent(talentData, constellations) {
    // Check if any active constellation boosts this talent
    // Valid constellation effects usually mention increasing level by 3
    // We check if the talent name appears in any ACTIVE constellation description along with "Level" and "3"
    // This is a heuristic as we don't have a direct ID mapping from API
    let isLevelBoosted = false;
    if (constellations && constellations.length > 0) {
        // Constellations C3 and C5 are typically the ones that boost talent levels
        // We look for active constellations that mention this talent's name
        const talentName = talentData.name;

        // Find relevant constellations that are ACTIVE
        const boostingConstellation = constellations.find(c =>
            c.is_actived &&
            (c.pos === 3 || c.pos === 5) &&
            c.effect.includes(talentName)
        );

        if (boostingConstellation) {
            isLevelBoosted = true;
        }
    }
    const baseLevel = isLevelBoosted ? talentData.level - 3 : talentData.level;

    return {
        id: talentData.skill_id,
        icon_url: talentData.icon,
        is_unlocked: talentData.is_unlock,
        is_enhanced: talentData.is_enhanced,
        is_alternate_sprint: talentData.desc ? talentData.desc.includes("Alternate Sprint") : false,
        level: talentData.level,
        base_level: baseLevel
    };
}

/**
 * Approximates ascension based on level
 * @param {number} level 
 * @returns {1|2|3|4|5|6}
 */
function calculateAscension(level) {
    if (level <= 20) return 0;
    if (level <= 40) return 1;
    if (level <= 50) return 2;
    if (level <= 60) return 3;
    if (level <= 70) return 4;
    if (level <= 80) return 5;
    return 6; // 80-90
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
