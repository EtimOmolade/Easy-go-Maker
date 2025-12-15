/**
 * Utility for formatting Bible references from spoken format to standard format
 * Example: "Psalm chapter sixty nine verse nine" → "Psalm 69:9"
 */

// Comprehensive word-to-number mapping
const wordToNumber: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
  'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
  'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5
};

/**
 * Converts a spoken number phrase to a numeric value
 * Examples: "sixty nine" → 69, "twenty two" → 22, "one hundred" → 100
 */
function parseSpokenNumber(text: string): number {
  const words = text.toLowerCase().trim().split(/\s+/);
  let total = 0;
  let current = 0;

  for (const word of words) {
    const num = wordToNumber[word];
    if (num !== undefined) {
      if (num >= 100) {
        current = current === 0 ? num : current * num;
      } else {
        current += num;
      }
    }
  }

  total += current;
  return total || parseInt(text, 10) || 0;
}

/**
 * Normalizes book names from spoken to standard format
 * Examples: "First Corinthians" → "1 Corinthians", "Ephesians" → "Ephesians"
 */
function normalizeBookName(bookName: string): string {
  const normalized = bookName.trim();
  
  // Handle ordinal book names (First, Second, Third)
  const ordinalMap: Record<string, string> = {
    'first': '1',
    'second': '2',
    'third': '3',
    '1st': '1',
    '2nd': '2',
    '3rd': '3'
  };

  // Check if the book starts with an ordinal
  const ordinalMatch = normalized.match(/^(first|second|third|1st|2nd|3rd)\s+(.+)/i);
  if (ordinalMatch) {
    const ordinal = ordinalMatch[1].toLowerCase();
    const restOfName = ordinalMatch[2];
    return `${ordinalMap[ordinal]} ${restOfName}`;
  }

  return normalized;
}

/**
 * Formats Bible references from spoken format to standard format
 *
 * Handles various patterns:
 * - "chapter X verse Y" → "X:Y"
 * - "chapter X verses Y to Z" → "X:Y-Z"
 * - "verses Y to Z" → "Y-Z"
 * - Book names with ordinals (First John → 1 John)
 *
 * @param text - The text containing spoken Bible references
 * @returns The text with Bible references formatted in standard notation
 */
export function formatBibleReferenceForDisplay(text: string): string {
  let formattedText = text;

  // Pattern 1: "Book chapter X verse Y" or "Book chapter X verses Y to Z"
  // Fixed: Changed lookahead to only match sentence-ending punctuation, not spaces
  const chapterVersePattern = /(\b(?:First|Second|Third|1|2|3)?\s*[A-Za-z]+)\s+chapter\s+([\w\s]+?)\s+verses?\s+([\w\s]+?)(?:\s+to\s+([\w\s]+?))?(?=\.|,|;|$)/gi;

  formattedText = formattedText.replace(chapterVersePattern, (match, book, chapter, verse1, verse2) => {
    const bookName = normalizeBookName(book);
    const chapterNum = parseSpokenNumber(chapter);
    const verseNum1 = parseSpokenNumber(verse1);

    if (verse2) {
      const verseNum2 = parseSpokenNumber(verse2);
      return `${bookName} ${chapterNum}:${verseNum1}-${verseNum2}`;
    }

    return `${bookName} ${chapterNum}:${verseNum1}`;
  });

  // Pattern 2: Handle cases where "Book" is already followed by a chapter number in words
  // Example: "Psalm chapter sixty nine verse nine"
  // Fixed: Changed lookahead to only match sentence-ending punctuation, not spaces
  const simplePattern = /(\b(?:First|Second|Third)?\s*[A-Za-z]+)\s+chapter\s+([\w\s]+?)\s+verses?\s+([\w\s]+?)(?:\s+to\s+([\w\s]+?))?(?=\.|,|;|$)/gi;

  formattedText = formattedText.replace(simplePattern, (match, book, chapter, verse1, verse2) => {
    const bookName = normalizeBookName(book);
    const chapterNum = parseSpokenNumber(chapter);
    const verseNum1 = parseSpokenNumber(verse1);

    if (verse2) {
      const verseNum2 = parseSpokenNumber(verse2);
      return `${bookName} ${chapterNum}:${verseNum1}-${verseNum2}`;
    }

    return `${bookName} ${chapterNum}:${verseNum1}`;
  });

  // Pattern 3: "verses X to Y" (without chapter, for continued references)
  // Fixed: Changed lookahead to only match sentence-ending punctuation, not spaces
  const versesOnlyPattern = /verses?\s+([\w\s]+?)\s+to\s+([\w\s]+?)(?=\.|,|;|$)/gi;

  formattedText = formattedText.replace(versesOnlyPattern, (match, verse1, verse2) => {
    const verseNum1 = parseSpokenNumber(verse1);
    const verseNum2 = parseSpokenNumber(verse2);
    return `${verseNum1}-${verseNum2}`;
  });

  return formattedText;
}

/**
 * Extracts just the Bible reference from a prayer text
 * Useful for displaying references separately
 */
export function extractBibleReference(text: string): string | null {
  const referencePattern = /(\b(?:First|Second|Third|1|2|3)?\s*[A-Za-z]+\s+(?:chapter\s+)?[\d\w\s]+(?:verse|verses)\s+[\d\w\s]+(?:\s+to\s+[\d\w\s]+)?)/i;
  const match = text.match(referencePattern);
  
  if (match) {
    return formatBibleReferenceForDisplay(match[0]);
  }
  
  return null;
}
