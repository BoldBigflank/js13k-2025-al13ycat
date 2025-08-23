const fs = require('fs')
const https = require('https')
const path = require('path')

// Download words from GitHub
const wordsUrl = 'https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words.txt'
const outputPath = path.join(__dirname, 'words_compound.txt')

console.log('Downloading words from GitHub...')

// Function to download and process words
function downloadAndProcessWords() {
    return new Promise((resolve, reject) => {
        https
            .get(wordsUrl, (res) => {
                let data = ''

                res.on('data', (chunk) => {
                    data += chunk
                })

                res.on('end', () => {
                    const words = data
                        .split('\n')
                        .map((word) => word.trim().toLowerCase())
                        .filter((word) => word.length > 0)
                    resolve(words)
                })
            })
            .on('error', (err) => {
                reject(err)
            })
    })
}

// Main execution
async function main() {
    try {
        const words = await downloadAndProcessWords()
        console.log(`Downloaded ${words.length} words`)

        // Create a set for fast lookup
        const wordSet = new Set(words)

        // Function to check if a word is a compound of exactly two 3+ letter words
        function isCompoundWord(word) {
            if (word.length < 6) return false // Need at least 6 chars for two 3-letter words

            // Try all possible splits
            for (let i = 3; i <= word.length - 3; i++) {
                const first = word.substring(0, i)
                const second = word.substring(i)

                // Check if both parts are 3+ letters and exist in the word set
                if (first.length >= 3 && second.length >= 3 && wordSet.has(first) && wordSet.has(second)) {
                    return true
                }
            }

            return false
        }

        console.log('Finding compound words...')
        const compoundWords = words.filter(isCompoundWord)

        console.log(`Found ${compoundWords.length} compound words`)

        // Create compound words with spaces
        const compoundWordsWithSpaces = compoundWords.map((word) => {
            // Find the split for this word
            for (let i = 3; i <= word.length - 3; i++) {
                const first = word.substring(0, i)
                const second = word.substring(i)
                if (first.length >= 3 && second.length >= 3 && wordSet.has(first) && wordSet.has(second)) {
                    return `${first} ${second}`
                }
            }
            return word // fallback
        })

        // Write results to words_compound.txt
        fs.writeFileSync(outputPath, compoundWordsWithSpaces.join('\n'))
        console.log(`Results written to words_compound.txt`)

        // Show some examples
        console.log('\nFirst 20 compound words found:')
        compoundWordsWithSpaces.slice(0, 20).forEach((word) => {
            console.log(word)
        })
    } catch (error) {
        console.error('Error:', error.message)
    }
}

// Run the main function
main()
