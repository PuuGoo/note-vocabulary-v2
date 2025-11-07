const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const WORDSAPI_BASE = 'https://wordsapiv1.p.rapidapi.com/words';

/**
 * Fetch word definition from WordsAPI
 * @param {string} word - The word to look up
 * @returns {Promise<Object>} - Parsed dictionary data
 */
async function lookupWord(word) {
  try {
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const url = `${WORDSAPI_BASE}/${encodeURIComponent(word.trim().toLowerCase())}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          found: false,
          suggestions: [],
        };
      }
      throw new Error(`WordsAPI error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.word) {
      return {
        found: false,
        suggestions: [],
      };
    }

    // Extract pronunciation (IPA)
    let ipa = null;
    if (data.pronunciation) {
      // pronunciation can be a string or object with "all" property
      if (typeof data.pronunciation === 'string') {
        ipa = `/${data.pronunciation}/`;
      } else if (data.pronunciation.all) {
        ipa = `/${data.pronunciation.all}/`;
      }
    }

    // Extract definitions and examples
    const definitions = [];
    const examples = [];
    let partOfSpeech = null;

    if (data.results && data.results.length > 0) {
      // Get first part of speech
      partOfSpeech = data.results[0].partOfSpeech || null;

      // Extract up to 3 definitions with different meanings
      for (const result of data.results.slice(0, 3)) {
        if (result.definition) {
          definitions.push(result.definition);
        }
        // Extract examples
        if (result.examples && result.examples.length > 0) {
          for (const example of result.examples) {
            if (examples.length < 3) {
              examples.push(example);
            }
          }
        }
      }
    }

    return {
      found: true,
      word: data.word,
      ipa,
      partOfSpeech,
      definitions: definitions.length > 0 ? definitions : [],
      examples: examples.length > 0 ? examples : [],
      language: 'en',
      // Additional info from WordsAPI
      syllables: data.syllables ? data.syllables.count : null,
      frequency: data.frequency || null,
    };
  } catch (error) {
    console.error('Dictionary lookup error:', error);
    throw error;
  }
}
module.exports = {
  lookupWord,
};
