// Prayer Parser Script
// Reads prayers.md and generates localStorage initialization data

const fs = require('fs');
const path = require('path');

// Read the prayers file
const prayersFilePath = path.join(__dirname, '..', 'prayers.md');
const prayersContent = fs.readFileSync(prayersFilePath, 'utf-8');

// Parse prayers
const prayers = [];
const lines = prayersContent.split('\n');

let currentDate = null;
let currentMonth = null;
let currentDay = null;
let currentDayOfWeek = null;
let currentIntercessions = [];

// Date regex: "Monday, 30th June 2025" or "Tuesday, 1st July 2025"
const dateRegex = /^([A-Za-z]+day),\s+(\d+)(?:st|nd|rd|th)\s+([A-Za-z]+)\s+(\d{4})/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Check if line is a date
  const dateMatch = line.match(dateRegex);
  if (dateMatch) {
    // Save previous day's prayers if any
    if (currentDate && currentIntercessions.length > 0) {
      // Take only first 4 intercessions
      const first4 = currentIntercessions.slice(0, 4);

      prayers.push({
        month: currentMonth,
        day: currentDay,
        day_of_week: currentDayOfWeek,
        intercessions: first4
      });
    }

    // Start new day
    currentDayOfWeek = dateMatch[1];
    currentDay = parseInt(dateMatch[2]);
    currentMonth = dateMatch[3];
    currentDate = line;
    currentIntercessions = [];
    continue;
  }

  // Check if line is an intercession
  const intercessionMatch = line.match(/^Intercession\s+(\d+):\s+(.+)/);
  if (intercessionMatch) {
    const number = parseInt(intercessionMatch[1]);
    const text = intercessionMatch[2].trim();

    // Only take intercessions 1-4
    if (number <= 4) {
      currentIntercessions.push(text);
    }
  }
}

// Save last day
if (currentDate && currentIntercessions.length > 0) {
  const first4 = currentIntercessions.slice(0, 4);
  prayers.push({
    month: currentMonth,
    day: currentDay,
    day_of_week: currentDayOfWeek,
    intercessions: first4
  });
}

console.log(`✅ Parsed ${prayers.length} days of prayers`);

// Generate TypeScript array
const tsOutput = `// Auto-generated from prayers.md
// DO NOT EDIT MANUALLY

export const kingdomFocusPrayers = [
${prayers.map((prayer, index) => `  {
    id: 'kf-${prayer.month.toLowerCase()}-${prayer.day}',
    month: '${prayer.month}',
    day: ${prayer.day},
    day_of_week: '${prayer.day_of_week}',
    title: '${prayer.month} ${prayer.day} Intercessions',
    category: 'Kingdom Focus',
    intercession_points: [
${prayer.intercessions.map(text => `      ${JSON.stringify(text)}`).join(',\n')}
    ],
    created_at: new Date().toISOString()
  }${index < prayers.length - 1 ? ',' : ''}`).join('\n')}
];

export const kingdomFocusPrayersCount = ${prayers.length};
`;

// Write to output file
const outputPath = path.join(__dirname, '..', 'src', 'data', 'kingdomFocusPrayers.ts');
fs.writeFileSync(outputPath, tsOutput, 'utf-8');

console.log(`✅ Written to ${outputPath}`);
console.log(`📊 Total prayers: ${prayers.length}`);
console.log(`📊 Date range: ${prayers[0].month} ${prayers[0].day} - ${prayers[prayers.length - 1].month} ${prayers[prayers.length - 1].day}`);

// Generate summary stats
const monthCounts = {};
prayers.forEach(p => {
  monthCounts[p.month] = (monthCounts[p.month] || 0) + 1;
});

console.log('\n📊 Prayers per month:');
Object.keys(monthCounts).forEach(month => {
  console.log(`   ${month}: ${monthCounts[month]} days`);
});
