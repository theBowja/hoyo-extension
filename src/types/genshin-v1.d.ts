/**
 * Type definitions for Genshin Impact internal data structure
 */


export interface GenshinInternalData {
    version: 1;
    game: 'genshin';
    timestamp: string;

    user: GenshinUser;
    characters: GenshinCharacter[];
}


export interface GenshinUser {
    uid: string;
    server: "os_asia" | "os_euro" | "os_usa";

    nickname?: string;
    level?: string;
}

export interface GenshinCharacter {
    id: number;
    name: string; // English name to be used to convert to GOOD format
    icon_url: string;
    side_icon_url: string;
    image_url: string;

    element: "Anemo" | "Geo" | "Dendro" | "Pyro" | "Hydro" | "Electro"; // For Traveler/Manekina
    friendship: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    level: number;
    ascension: 1 | 2 | 3 | 4 | 5 | 6; // Need to reverse calculate this...
    active_constellations: 0 | 1 | 2 | 3 | 4 | 5 | 6;

    weapon: GenshinWeapon;
    artifacts: GenshinArtifact[];
    constellations: GenshinConstellation[];
    outfits: GenshinOutfit[];
    talents: GenshinTalent[]; // Note: the third talent could be an Alternate Sprint instead of Elemental Burst
}

export interface GenshinWeapon {
    id: number;
    name: string; // English name to be used to convert to GOOD format
    icon_url: string;

    level: number;
    ascension: 1 | 2 | 3 | 4 | 5 | 6;
    refinement: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface GenshinArtifact {
    id: number;
    set_id: number;
    set_name: string; // English name to be used to convert to GOOD format
    icon_url: string;

    position: 1 | 2 | 3 | 4 | 5;
    rarity: 1 | 2 | 3 | 4 | 5;
    level: number;

    main_stat_type: number
    sub_stats: {
        type: number;
        value: string;
        times: 0 | 1 | 2 | 3 | 4 | 5; // Number of times the stat was upgraded
    }[]
}

export interface GenshinConstellation {
    id: number;
    icon_url: string;

    position: 1 | 2 | 3 | 4 | 5 | 6;
    is_active: boolean;
    is_enhanced: boolean; // Witch's Homework
}

export interface GenshinOutfit {
    id: number;
    name: string; // English name to be used to convert to GOOD format
    icon_url: string;
}

export interface GenshinTalent {
    id: number;
    icon_url: string;

    is_unlocked: boolean;
    is_enhanced: boolean; // Witch's Homework
    level: number; // Includes boost from constellations
    base_level: number; // Base level before constellations
}
