const fs = require('fs');
const path = require('path');

// Read compound words from words_compound.txt
const inputPath = path.join(__dirname, 'words_compound.txt');
const outputPath = path.join(__dirname, 'words_compound_loopable.txt');

console.log('Reading compound words from words_compound.txt...');
const compoundWords = fs.readFileSync(inputPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

console.log(`Loaded ${compoundWords.length} compound words`);

// Create a set of all first halves for fast lookup
const firstHalves = new Set();
compoundWords.forEach(word => {
    const parts = word.split(' ');
    if (parts.length === 2) {
        firstHalves.add(parts[0]);
    }
});

console.log(`Found ${firstHalves.size} unique first halves`);

// Find loopable compound words
const loopableWords = [];
compoundWords.forEach(word => {
    const parts = word.split(' ');
    if (parts.length === 2) {
        const firstHalf = parts[0];
        const secondHalf = parts[1];
        
        // Check if the second half appears as a first half elsewhere
        if (firstHalves.has(secondHalf)) {
            loopableWords.push(word);
        }
    }
});

console.log(`Found ${loopableWords.length} loopable compound words`);

// Write results to words_compound_loopable.txt
fs.writeFileSync(outputPath, loopableWords.join('\n'));
console.log(`Results written to words_compound_loopable.txt`);

// Show some examples with their potential loops
console.log('\nFirst 20 loopable compound words with potential loops:');
loopableWords.slice(0, 20).forEach(word => {
    const parts = word.split(' ');
    const secondHalf = parts[1];
    
    // Find a word that starts with the second half
    const loopExample = compoundWords.find(w => {
        const wParts = w.split(' ');
        return wParts.length === 2 && wParts[0] === secondHalf;
    });
    
    if (loopExample) {
        console.log(`${word} → ${loopExample}`);
    } else {
        console.log(word);
    }
});

// Show some statistics
const loopableSecondHalves = new Set();
loopableWords.forEach(word => {
    const parts = word.split(' ');
    loopableSecondHalves.add(parts[1]);
});

console.log(`\nUnique second halves that can loop: ${loopableSecondHalves.size}`); 