// Prayer data parser utility for extracting prayers from the PRAYERS.docx structure

export interface ParsedPrayer {
  title: string;
  content: string;
  day_of_week: string;
  week_number: number;
  category: string;
}

/**
 * Parses prayer text from the PRAYERS.docx document structure
 * Input format expected:
 * - Day headers: "Monday, 30th June 2025", "Tuesday, 1st July 2025", etc.
 * - Intercession headers: "Intercession 1:", "Intercession 2:", etc.
 * - Prayer content: The actual prayer text
 */
export function parsePrayersFromDocument(documentText: string): ParsedPrayer[] {
  const prayers: ParsedPrayer[] = [];
  const lines = documentText.split('\n');
  
  let currentDay = '';
  let currentWeek = 1;
  let currentIntercession = '';
  let prayerContent = '';
  
  const dayPattern = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+\d+\w+\s+\w+\s+\d{4}/i;
  const intercessionPattern = /^#?\s*Intercession\s+\d+:?/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and page markers
    if (!line || line.startsWith('###') || line.startsWith('##') || line.startsWith('<page')) {
      continue;
    }
    
    // Check for day header
    const dayMatch = line.match(dayPattern);
    if (dayMatch) {
      // Save previous prayer if exists
      if (currentDay && currentIntercession && prayerContent) {
        prayers.push({
          title: currentIntercession,
          content: prayerContent.trim(),
          day_of_week: currentDay,
          week_number: currentWeek,
          category: 'Kingdom Focus',
        });
      }
      
      currentDay = line.split(',')[0].trim();
      prayerContent = '';
      currentIntercession = '';
      
      // Increment week on Monday
      if (currentDay === 'Monday' && prayers.length > 0) {
        currentWeek++;
      }
      continue;
    }
    
    // Check for intercession header
    const intercessionMatch = line.match(intercessionPattern);
    if (intercessionMatch) {
      // Save previous prayer if exists
      if (currentDay && currentIntercession && prayerContent) {
        prayers.push({
          title: currentIntercession,
          content: prayerContent.trim(),
          day_of_week: currentDay,
          week_number: currentWeek,
          category: 'Kingdom Focus',
        });
      }
      
      currentIntercession = line.replace(/^#?\s*/, '');
      prayerContent = '';
      continue;
    }
    
    // Accumulate prayer content (skip scripture references)
    if (currentDay && currentIntercession && !line.match(/^(Ps|Psa|Matt?|Acts?|Isa|Rev|Exo?|Jn|John|Zech|Jer|Hab|Num|Deut|1 Cor|2 Cor|2 Thess|Phil|Eph|Heb|Jam|1 Kgs|2 Sam|Lev|Obad?|Gal|Luk?|Tit|Rom)\s+\d+/i)) {
      // Skip verse text (lines that are just numbers and text after scripture refs)
      if (!line.match(/^\d+\s+[A-Z]/)) {
        prayerContent += (prayerContent ? ' ' : '') + line;
      }
    }
  }
  
  // Save last prayer
  if (currentDay && currentIntercession && prayerContent) {
    prayers.push({
      title: currentIntercession,
      content: prayerContent.trim(),
      day_of_week: currentDay,
      week_number: currentWeek,
      category: 'Kingdom Focus',
    });
  }
  
  return prayers;
}

/**
 * Groups parsed prayers by week and day
 */
export function groupPrayersByWeekAndDay(prayers: ParsedPrayer[]) {
  const grouped: Record<number, Record<string, ParsedPrayer[]>> = {};
  
  prayers.forEach(prayer => {
    if (!grouped[prayer.week_number]) {
      grouped[prayer.week_number] = {};
    }
    if (!grouped[prayer.week_number][prayer.day_of_week]) {
      grouped[prayer.week_number][prayer.day_of_week] = [];
    }
    grouped[prayer.week_number][prayer.day_of_week].push(prayer);
  });
  
  return grouped;
}

/**
 * Validates that each day has exactly 4 prayer points
 */
export function validatePrayerStructure(prayers: ParsedPrayer[]): { valid: boolean; issues: string[] } {
  const grouped = groupPrayersByWeekAndDay(prayers);
  const issues: string[] = [];
  
  Object.entries(grouped).forEach(([week, days]) => {
    Object.entries(days).forEach(([day, dayPrayers]) => {
      if (dayPrayers.length !== 4) {
        issues.push(`Week ${week}, ${day}: Expected 4 prayers, found ${dayPrayers.length}`);
      }
    });
  });
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
