import { parseGenshinData } from './gi-leysync-parser.js';
import { formatGOOD } from '../formatters/gi-good3-formatter.js';

export function parseGOOD3Data(rawData) {
    const internalData = parseGenshinData(rawData);
    return formatGOOD(internalData);
}
