// patch.js — apply minimal data fixes to base_good.html
const fs = require('fs');

let html = fs.readFileSync('C:/Users/DELL/WorkBuddy/2026-05-29-15-05-51/dashboard/base_good.html', 'utf8');
console.log('Input:', html.length, 'bytes');

// === 1. Replace Q1_WEEKS with correct data ===
const newQ1 = `const Q1_WEEKS = {
  '本部': [0.3,2,3.2,0.6,2.8,5.1,0.3,0,0,1,9,0.3,0],
  '东台': [0,0.6,0,0.9,0.6,5.2,1.4,0,0.3,1.7,0.4,1.2,5],
  '大丰': [2.5,0,0,6.6,0.3,1.05,1.5,0.15,-0.4,25,0.9,2,0.3],
  '建湖': [0.3,0,0,0.3,0.7,1,0.6,-0.1,0.7,4.2,0.6,1.5,0.8],
  '射阳': [0,0,1.1,0.5,0.25,0.6,0.25,0.35,-0.2,0.15,0.9,1.25,0],
  '阜宁': [0,0,0,0.7,-0.5,1.5,-0.1,0.9,-0.5,0.4,0.4,0.1,0.3],
  '滨海': [0,0,1.1,0,1.2,1.65,1.05,4.8,1.7,2.75,0.3,-0.1,0.3],
  '响水': [0,0,0,-0.55,-0.2,0.8,0.9,-0.1,-0.3,0.65,0.65,1,0.5]
};`;

html = html.replace(/const Q1_WEEKS = \{[\s\S]*?\};/, newQ1);
console.log('Q1 replaced:', html.includes('[0.3,2,3.2'));

// === 2. Replace Q2_WEEKS with correct data (week 14 leading 0 + week 22 data) ===
const newQ2 = `const Q2_WEEKS = {
  '本部': [0,0.8,0,1.5,0,0,1,5.5,6.6],
  '东台': [0,1.4,0,7,0.2,1.1,1.1,0.2,5.1],
  '大丰': [0,1.1,0.2,0.85,-1.2,0.4,2.75,2.1,5.9],
  '建湖': [0,0.8,1.9,6.05,2.5,5.25,1.4,0.2,1.15],
  '射阳': [0,0.2,0,2.2,1.7,3.8,2.5,5.5,0.5],
  '阜宁': [0,2.2,0.4,0.1,3.5,3.3,0.6,0.25,0.5],
  '滨海': [0,0.45,0.25,1.2,1.7,5.5,3,0.3,-0.2],
  '响水': [0,0.2,7,0.3,0.5,0,2.55,0,5]
};`;

html = html.replace(/const Q2_WEEKS = \{[\s\S]*?\};/, newQ2);
console.log('Q2 replaced:', html.includes('6.6'));

// === 3. Add weekHasData + latestWeekWithData after TOTAL_WEEKS ===
const newHelpers = `var TOTAL_WEEKS = 22;

// Check if a week has actual data (any unit with non-zero score)
function weekHasData(w) {
  for (var i = 0; i < UNITS.length; i++) {
    if (getWeekScore(UNITS[i], w) !== 0) return true;
  }
  return false;
}
function latestWeekWithData() {
  for (var w = TOTAL_WEEKS; w >= 1; w--) {
    if (weekHasData(w)) return w;
  }
  return TOTAL_WEEKS;
}`;

html = html.replace(/var TOTAL_WEEKS = 22;/, newHelpers);
console.log('Helpers added:', html.includes('weekHasData'));

// === 4. Replace w <= 21 with weekHasData(w) (all 3 occurrences) ===
let count = 0;
html = html.replace(/var hasData = w <= 21(; \/\/ Week 22 has no data yet)?/g, function(m) {
  count++;
  return 'var hasData = weekHasData(w)';
});
// Also catch the one in renderWeekDetail which uses just w <= 21 (no comment)
html = html.replace(/var hasData = w <= 21;/g, function(m) {
  count++;
  return 'var hasData = weekHasData(w);';
});
console.log('w<=21 replaced:', count, 'occurrences');

// === 5. Add AUTH_TOTALS and update cumulativeTotal ===
const authBlock = `
// ═══ 权威累计总分（来源：金山文档·总体得分汇总自动 s22）═══
var AUTH_TOTALS = {
  '本部': 42.1,
  '东台': 40.35,
  '大丰': 52.0,
  '建湖': 35.1,
  '射阳': 22.2,
  '阜宁': 16.7,
  '滨海': 27.7,
  '响水': 19.25
};`;

html = html.replace(
  '// Get unit\'s total cumulative score\nfunction cumulativeTotal(unit) {',
  authBlock + '\n\n// Get unit\'s total cumulative score\nfunction cumulativeTotal(unit) {'
);

html = html.replace(
  'function cumulativeTotal(unit) {\n  return totalScore(unit, TOTAL_WEEKS);\n}',
  'function cumulativeTotal(unit) {\n  return AUTH_TOTALS[unit] || totalScore(unit, TOTAL_WEEKS);\n}'
);
console.log('AUTH_TOTALS added:', html.includes('AUTH_TOTALS'));

// === 6. Fix PDF print font ===
html = html.replace(
  "font-family: -apple-system, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;",
  "font-family: -apple-system, 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;"
);

html = html.replace(
  /@media print \{/,
  "@media print {\n  * { font-family: 'Microsoft YaHei', 'SimHei', 'PingFang SC', sans-serif !important; }"
);
console.log('PDF font fixed');

// === 7. Verify no residual w<=21 ===
const residual = html.match(/w <= 21/g);
console.log('Residual w<=21:', residual ? residual.length : 0);

// Write
fs.writeFileSync('C:/Users/DELL/WorkBuddy/2026-05-29-15-05-51/dashboard/index.html', html);
console.log('Written:', html.length, 'bytes');

// Syntax check
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
if (scripts) {
  const js = scripts[scripts.length-1].replace(/<\/?script>/g,'');
  try {
    new Function(js);
    console.log('✅ JS Syntax OK');
  } catch(e) {
    console.log('❌ Syntax Error:', e.message.substring(0,120));
    process.exit(1);
  }
}
