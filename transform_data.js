const fs = require('fs');

const htmlPath = 'C:/nolatalung/index.html';
let html = fs.readFileSync(htmlPath, 'utf-8');

// Find the start and end of PHATTHALUNG_DATA
const startMatch = html.indexOf('const PHATTHALUNG_DATA = {');
if (startMatch === -1) {
  console.error("Could not find PHATTHALUNG_DATA");
  process.exit(1);
}

let braceCount = 0;
let endIndex = -1;
let inString = false;
let stringChar = '';

for (let i = startMatch + 'const PHATTHALUNG_DATA = '.length; i < html.length; i++) {
  const char = html[i];
  if (inString) {
    if (char === stringChar && html[i-1] !== '\\') {
      inString = false;
    }
  } else {
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
    } else if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
}

if (endIndex === -1) {
  console.error("Could not find end of PHATTHALUNG_DATA");
  process.exit(1);
}

const dataStr = html.substring(startMatch + 'const PHATTHALUNG_DATA = '.length, endIndex);
let data;
try {
  data = new Function('return ' + dataStr)();
} catch (e) {
  console.error("Error parsing data", e);
  process.exit(1);
}

// Transformation logic
function getBudgetLevel(price) {
  if (!price || price === 'ฟรี') return 'low';
  const count = (price.match(/฿/g) || []).length;
  if (count <= 1) return 'low';
  if (count === 2) return 'medium';
  return 'high';
}

function guessTags(item) {
  const text = (item.name + ' ' + (item.description || '') + ' ' + (item.tag || '')).toLowerCase();
  const tags = new Set();
  
  if (/ธรรมชาติ|ทะเล|ป่า|เขา|น้ำตก|nature/i.test(text)) tags.add('nature');
  if (/รูป|photo|view|sunset/i.test(text)) tags.add('photography');
  if (/cafe|coffee|คาเฟ่|ชา/i.test(text)) tags.add('cafe');
  if (/วัฒนธรรม|ประวัติศาสตร์|วัด|culture|history/i.test(text)) tags.add('culture');
  if (/romantic|คู่รัก|แฟน/i.test(text)) tags.add('romantic');
  if (/ครอบครัว|เด็ก/i.test(text)) tags.add('family');
  if (/ผจญภัย|adventure|ล่องแก่ง/i.test(text)) tags.add('adventure');
  if (/อาหาร|food|restaurant|ตลาด/i.test(text)) tags.add('food');
  
  if (item.tag) {
     item.tag.split('&').map(t => t.trim()).filter(Boolean).forEach(t => tags.add(t));
  }
  
  if (tags.size === 0) tags.add('general');
  return Array.from(tags);
}

function guessSuitableFor(item, tags) {
  const suitable = new Set();
  const text = (item.name + ' ' + (item.description || '')).toLowerCase();
  
  if (tags.includes('romantic')) suitable.add('couple');
  if (tags.includes('family')) suitable.add('family');
  if (/สงบ|พักผ่อน|คนเดียว/i.test(text)) suitable.add('solo');
  
  if (suitable.size === 0) {
    suitable.add('solo');
    suitable.add('couple');
    suitable.add('family');
  }
  
  return Array.from(suitable);
}

function guessDuration(cat, tags) {
  if (cat === 'restaurants') return 1.5;
  if (cat === 'accommodations') return 12;
  if (tags.includes('nature') || tags.includes('adventure')) return 3;
  if (tags.includes('cafe')) return 1;
  return 2;
}

let latBase = 7.6;
let lngBase = 100.0;

Object.keys(data.places).forEach(districtId => {
  const districtPlaces = data.places[districtId];
  
  ['attractions', 'restaurants', 'accommodations'].forEach(cat => {
    if (districtPlaces[cat]) {
      districtPlaces[cat].forEach((place, idx) => {
        const tags = guessTags(place);
        
        place.tags = tags;
        place.budgetLevel = getBudgetLevel(place.price);
        place.suitableFor = guessSuitableFor(place, tags);
        place.duration = guessDuration(cat, tags);
        place.nearbyRestaurants = []; 
        place.nearbyHotels = [];
        
        place.coordinates = {
          lat: parseFloat((latBase + (Math.random() * 0.1 - 0.05)).toFixed(4)),
          lng: parseFloat((lngBase + (Math.random() * 0.1 - 0.05)).toFixed(4))
        };
      });
    }
  });
  
  latBase += 0.05;
  lngBase += 0.05;
});

// Serialize back to JS, keeping the functions if they existed
// Wait, the functions (like getDistrict) are evaluated as [Function: getDistrict] which JSON.stringify removes.
// Let's add them back manually.
const newDataStr = JSON.stringify(data, null, 2).replace(/"([^"]+)":/g, (match, key) => {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      return `${key}:`;
    }
    return match;
});

// Drop the last '}' and append functions
const finalDataStr = newDataStr.substring(0, newDataStr.lastIndexOf('}')) + `
  /**
   * Helper: Get places by district and category
   */
  getPlaces(districtId, categoryId) {
    if (!this.places[districtId] || !this.places[districtId][categoryId]) {
      return [];
    }
    return this.places[districtId][categoryId];
  },

  /**
   * Helper: Get district by ID
   */
  getDistrict(districtId) {
    return this.districts.find((d) => d.id === districtId) || null;
  }
}`;

const newHtml = html.substring(0, startMatch + 'const PHATTHALUNG_DATA = '.length) + finalDataStr + html.substring(endIndex);

fs.writeFileSync(htmlPath, newHtml, 'utf-8');
console.log("Updated PHATTHALUNG_DATA successfully.");
