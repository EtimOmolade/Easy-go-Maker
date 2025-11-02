// Prayer data parser utility for extracting prayers from the PRAYERS.docx structure

export interface ParsedPrayer {
  title: string;
  content: string;
  month: string;
  day: number;
  year: number;
  day_of_week: string;
  intercession_number: number;
  category: string;
}

/**
 * Parses prayer text from the PRAYERS.docx document structure
 * Input format expected:
 * - Day headers: "Monday, 30th June 2025", "Tuesday, 1st July 2025", etc.
 * - Intercession headers: "# Intercession 1", "# Intercession 2", etc.
 * - Prayer content: The actual prayer text
 */
export function parsePrayersFromDocument(documentText: string): ParsedPrayer[] {
  const prayers: ParsedPrayer[] = [];
  const lines = documentText.split('\n');
  
  let currentDay = '';
  let currentMonth = '';
  let currentDayNum = 0;
  let currentYear = 2025;
  let currentIntercessionNum = 0;
  let prayerContent = '';
  
  // Pattern: "Monday, 30th June 2025"
  const dayPattern = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(\d+)\w+\s+(\w+)\s+(\d{4})/i;
  // Pattern: "# Intercession 1" or "Intercession 1:"
  const intercessionPattern = /^#?\s*Intercession\s+(\d+):?/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, page markers, and page headers
    if (!line || line.startsWith('###') || line.startsWith('##') || 
        line.startsWith('<page') || line.includes('<page_header>') || 
        line.includes('</page_header>')) {
      continue;
    }
    
    // Check for day header
    const dayMatch = line.match(dayPattern);
    if (dayMatch) {
      // Save previous prayer if exists
      if (currentDay && currentIntercessionNum > 0 && prayerContent) {
        prayers.push({
          title: `Intercession ${currentIntercessionNum}`,
          content: prayerContent.trim(),
          month: currentMonth,
          day: currentDayNum,
          year: currentYear,
          day_of_week: currentDay,
          intercession_number: currentIntercessionNum,
          category: 'Kingdom Focus',
        });
      }
      
      currentDay = dayMatch[1];
      currentDayNum = parseInt(dayMatch[2]);
      currentMonth = dayMatch[3];
      currentYear = parseInt(dayMatch[4]);
      prayerContent = '';
      currentIntercessionNum = 0;
      continue;
    }
    
    // Check for intercession header
    const intercessionMatch = line.match(intercessionPattern);
    if (intercessionMatch) {
      // Save previous prayer if exists
      if (currentDay && currentIntercessionNum > 0 && prayerContent) {
        prayers.push({
          title: `Intercession ${currentIntercessionNum}`,
          content: prayerContent.trim(),
          month: currentMonth,
          day: currentDayNum,
          year: currentYear,
          day_of_week: currentDay,
          intercession_number: currentIntercessionNum,
          category: 'Kingdom Focus',
        });
      }
      
      currentIntercessionNum = parseInt(intercessionMatch[1]);
      prayerContent = '';
      continue;
    }
    
    // Accumulate prayer content (skip scripture references)
    if (currentDay && currentIntercessionNum > 0 && !line.match(/^(Ps|Psa|Matt?|Acts?|Isa|Rev|Exo?|Jn|John|Zech|Jer|Hab|Num|Deut|1 Cor|2 Cor|2 Thess|Phil|Eph|Heb|Jam|1 Kgs|2 Sam|Lev|Obad?|Gal|Luk?|Tit|Rom)\s+\d+/i)) {
      // Skip verse text (lines that are just numbers and text after scripture refs)
      if (!line.match(/^\d+\s+[A-Z]/)) {
        prayerContent += (prayerContent ? ' ' : '') + line;
      }
    }
  }
  
  // Save last prayer
  if (currentDay && currentIntercessionNum > 0 && prayerContent) {
    prayers.push({
      title: `Intercession ${currentIntercessionNum}`,
      content: prayerContent.trim(),
      month: currentMonth,
      day: currentDayNum,
      year: currentYear,
      day_of_week: currentDay,
      intercession_number: currentIntercessionNum,
      category: 'Kingdom Focus',
    });
  }
  
  return prayers;
}

/**
 * Groups parsed prayers by month and day
 */
export function groupPrayersByMonthAndDay(prayers: ParsedPrayer[]) {
  const grouped: Record<string, Record<number, ParsedPrayer[]>> = {};
  
  prayers.forEach(prayer => {
    if (!grouped[prayer.month]) {
      grouped[prayer.month] = {};
    }
    if (!grouped[prayer.month][prayer.day]) {
      grouped[prayer.month][prayer.day] = [];
    }
    grouped[prayer.month][prayer.day].push(prayer);
  });
  
  return grouped;
}

/**
 * Validates that each day has exactly 4 prayer points (intercessions 1-4)
 */
export function validatePrayerStructure(prayers: ParsedPrayer[]): { valid: boolean; issues: string[] } {
  const grouped = groupPrayersByMonthAndDay(prayers);
  const issues: string[] = [];
  
  Object.entries(grouped).forEach(([month, days]) => {
    Object.entries(days).forEach(([day, dayPrayers]) => {
      // Each day should have at least 4 intercessions (some have 5, which is fine)
      const intercessions14 = dayPrayers.filter(p => p.intercession_number >= 1 && p.intercession_number <= 4);
      if (intercessions14.length < 4) {
        issues.push(`${month} ${day}: Expected 4 core prayers, found ${intercessions14.length}`);
      }
    });
  });
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Generate placeholder prayers for November 2 - December 31
 */
export function generatePlaceholderPrayers(): ParsedPrayer[] {
  const placeholders: ParsedPrayer[] = [];
  const monthDays = [
    { month: 'November', days: 30, startDay: 2 }, // Nov 2-30
    { month: 'December', days: 31, startDay: 1 }  // Dec 1-31
  ];
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let dayOfWeekIndex = 6; // Starting with Saturday (Nov 2, 2025 is a Saturday)
  
  monthDays.forEach(({ month, days, startDay }) => {
    for (let day = startDay; day <= days; day++) {
      for (let intercession = 1; intercession <= 4; intercession++) {
        placeholders.push({
          title: `Intercession ${intercession}`,
          content: `Placeholder prayer for ${month} ${day}. This content will be updated when the client provides new prayers.`,
          month,
          day,
          year: 2025,
          day_of_week: daysOfWeek[dayOfWeekIndex % 7],
          intercession_number: intercession,
          category: 'Kingdom Focus',
        });
      }
      dayOfWeekIndex++;
    }
  });
  
  return placeholders;
}
