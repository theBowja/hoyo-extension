import { parseGenshinData } from '../src/converters/parsers/genshin-parser.js';
import { EXAMPLE_GENSHIN_RESPONSE } from './fixtures/genshin-response.js';

console.log('Testing Genshin Parser...');

try {
    const parsedData = parseGenshinData(EXAMPLE_GENSHIN_RESPONSE);
    console.log('Parser output:');
    console.log(JSON.stringify(parsedData, null, 2));

    // Basic validation
    if (parsedData.game === 'genshin' && parsedData.characters.length > 0) {
        console.log('\nSUCCESS: Data parsed successfully!');
        console.log(`Parsed ${parsedData.characters.length} characters.`);
    } else {
        console.error('\nFAILURE: Parsed data missing expected fields.');
    }
} catch (error) {
    console.error('\nERROR during parsing:', error);
}
