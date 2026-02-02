/**
 * @typedef {import('../../types/genshin-v1').GenshinInternalData} GenshinInternalData
 * @typedef {import('../../types/good-v3').IGOOD} IGOOD
 * @typedef {import('../../types/good-v3').ICharacter} ICharacter
 * @typedef {import('../../types/good-v3').IWeapon} IWeapon
 * @typedef {import('../../types/good-v3').IArtifact} IArtifact
 * @typedef {import('../../types/good-v3').ISubstat} ISubstat
 */

/**
 * Converts internal Genshin data to GOOD v3 format
 * @param {GenshinInternalData} internalPv1 
 * @returns {IGOOD}
 */
export function formatGOOD(internalPv1, {
    removeManekin = false,
    addTravelerElementToKey = false,
    minCharacterLevel = 0
} = {}) {
    const characters = [];
    const artifacts = [];
    const weapons = [];

    for (const char of internalPv1.characters) {
        if (removeManekin && (char.name === "Manekin" || char.name === "Manekina")) continue;
        if (minCharacterLevel > 0 && char.level < minCharacterLevel) continue;

        // Convert Character
        const goodChar = convertCharacter(char, addTravelerElementToKey);
        if (goodChar) characters.push(goodChar);

        // Convert Weapon
        const goodWeapon = convertWeapon(char.weapon, char.name);
        if (goodWeapon) weapons.push(goodWeapon);

        // Convert Artifacts
        if (char.artifacts) {
            for (const art of char.artifacts) {
                const goodArt = convertArtifact(art, char.name);
                if (goodArt) artifacts.push(goodArt);
            }
        }
    }

    return {
        format: "GOOD",
        version: 3,
        source: "HoYoLAB Extension",
        characters,
        artifacts,
        weapons
    };
}

/**
 * @param {import('../../types/genshin-v1').GenshinCharacter} char 
 * @returns {ICharacter}
 */
function convertCharacter(char, addTravelerElementToKey = false) {
    let key = toGOODKey(char.name);
    if (addTravelerElementToKey && key === "Traveler") {
        key += char.element;
    }

    // Sort talents to find Auto, Skill, Burst
    // This is tricky as order isn't guaranteed.
    // For now, assuming default API order which is usually Normal, Skill, Burst
    // But alternate sprints might mess this up.

    // Filter out alternate sprints if present/known or handle 3-item logic
    // Usually parser handles marking alternate sprint.
    const relevantTalents = char.talents.filter(t => !t.is_alternate_sprint);

    return {
        key: key,
        level: char.level,
        constellation: char.active_constellations,
        ascension: char.ascension,
        talent: {
            auto: relevantTalents[0].base_level,
            skill: relevantTalents[1].base_level,
            burst: relevantTalents[2].base_level
        }
    };
}

/**
 * @param {import('../../types/genshin-v1').GenshinWeapon} weapon 
 * @param {string} locationKey
 * @returns {IWeapon}
 */
function convertWeapon(weapon, locationKey) {
    if (!weapon) return null;
    return {
        key: toGOODKey(weapon.name),
        level: weapon.level,
        ascension: weapon.ascension,
        refinement: weapon.refinement,
        location: toGOODKey(locationKey),
        lock: false // Hoyolab API doesn't provide lock status
    };
}

/**
 * @param {import('../../types/genshin-v1').GenshinArtifact} artifact 
 * @param {string} locationKey
 * @returns {IArtifact}
 */
function convertArtifact(artifact, locationKey) {
    return {
        setKey: toGOODKey(artifact.set_name),
        slotKey: mapSlotKey(artifact.position),
        level: artifact.level,
        rarity: artifact.rarity,
        mainStatKey: mapStatKey(artifact.main_stat_type),
        location: toGOODKey(locationKey),
        lock: false, // Hoyolab API doesn't provide lock status
        substats: artifact.sub_stats.map(sub => ({
            key: mapStatKey(sub.type),
            value: parseStatValue(sub.value)
        }))
    };
}

/**
 * Helper to convert names to GOOD keys (PascalCase, symbols stripped)
 * @param {string} name 
 */
function toGOODKey(name) {
    if (!name) return "";
    // Remove symbols (keep letters, numbers, spaces)
    const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, '');
    // Split by space, capitalize each word, join
    return cleaned.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

/**
 * Maps artifact position index to SlotKey
 * @param {number} pos 
 * @returns {import('../../types/good-v3').SlotKey}
 */
function mapSlotKey(pos) {
    switch (pos) {
        case 1: return "flower";
        case 2: return "plume";
        case 3: return "sands";
        case 4: return "goblet";
        case 5: return "circlet";
    }
}

/** 
 * Maps stat type ID/String to GOOD StatKey
 * @param {number} type 
 * @returns {import('../../types/good-v3').StatKey}
 */
function mapStatKey(type) {
    switch (type) {
        // Flat Stats
        case 2000: return "hp";     // Max HP
        case 2001: return "atk";    // ATK
        case 2002: return "def";    // DEF

        // Percent Stats

        // Common Artifact Substat / Property Map IDs
        case 1: return "hp"; // HP
        case 2: return "hp"; // HP
        case 3: return "hp_"; // HP Percentage
        case 4: return "atk"; // Base ATK
        case 5: return "atk"; // ATK
        case 6: return "atk_"; // ATK Percentage
        case 7: return "def"; // DEF
        case 8: return "def"; // DEF
        case 9: return "def_"; // DEF Percentage

        // Crit
        case 20: return "critRate_";
        case 22: return "critDMG_";

        // Energy & Healing
        case 23: return "enerRech_";
        case 26: return "heal_";

        // Elemental Mastery
        case 28: return "eleMas";

        // DMG Bonuses
        case 30: return "physical_dmg_";
        case 40: return "pyro_dmg_";
        case 41: return "electro_dmg_";
        case 42: return "hydro_dmg_";
        case 43: return "dendro_dmg_";
        case 44: return "anemo_dmg_";
        case 45: return "geo_dmg_";
        case 46: return "cryo_dmg_";
    }
}

function parseStatValue(valStr) {
    // "12.8%" -> 12.8
    // "4780" -> 4780
    if (!valStr) return 0;
    return parseFloat(valStr.replace('%', ''));
}
