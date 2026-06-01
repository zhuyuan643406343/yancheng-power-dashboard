// Build clean version from v3 base + current data + minimal fixes
const fs = require('fs');

// Read v3 base
let html = fs.readFileSync(__dirname + '/v3_base.html', 'utf8');
console.log('V3 size:', html.length);

// ── 1. Remove password gate ──
// Replace gate divs with visible content
html = html.replace(
  /<div class="gate"[\s\S]*?<div class="gate-card">[\s\S]*?<\/div>\s*<\/div>/,
  '<div id="main-view"></div>'
);
// Remove gate-related JS
html = html.replace(
  /const CORRECT_PWD[\s\S]*?function unlock\(\)[\s\S]*?}\s*/,
  ''
);
// Remove gate from body visibility logic
html = html.replace(
  /document\.getElementById\('gate'\)\.style\.display\s*=\s*'none';\s*document\.getElementById\('app'\)\.style\.display\s*=\s*'block';/,
  '// gate removed'
);

// ── 2. Update data ──
const newQ1 = {
  "本部":[0.3,2,3.2,0.6,2.8,5.1,0.3,0,0,1,9,0.3,0],
  "东台":[0,0.6,0,0.9,0.6,5.2,1.4,0,0.3,1.7,0.4,1.2,5],
  "大丰":[2.5,0,0,6.6,0.3,1.05,1.5,0.15,-0.4,25,0.9,2,0.3],
  "建湖":[0.3,0,0,0.3,0.7,1,0.6,-0.1,0.7,4.2,0.6,1.5,0.8],
  "射阳":[0,0,1.1,0.5,0.25,0.6,0.25,0.35,-0.2,0.15,0.9,1.25,0],
  "阜宁":[0,0,0,0.7,-0.5,1.5,-0.1,0.9,-0.5,0.4,0.4,0.1,0.3],
  "滨海":[0,0,1.1,0,1.2,1.65,1.05,4.8,1.7,2.75,0.3,-0.1,0.3],
  "响水":[0,0,0,-0.55,-0.2,0.8,0.9,-0.1,-0.3,0.65,0.65,1,0.5]
};

const newQ2 = {
  "本部":[0,0.8,0,1.5,0,0,1,5.5,6.6],
  "东台":[0,1.4,0,7,0.2,1.1,1.1,0.2,5.1],
  "大丰":[0,1.1,0.2,0.85,-1.2,0.4,2.75,2.1,5.9],
  "建湖":[0,0.8,1.9,6.05,2.5,5.25,1.4,0.2,1.15],
  "射阳":[0,0.2,0,2.2,1.7,3.8,2.5,5.5,0.5],
  "阜宁":[0,2.2,0.4,0.1,3.5,3.3,0.6,0.25,0.5],
  "滨海":[0,0.45,0.25,1.2,1.7,5.5,3,0.3,-0.2],
  "响水":[0,0.2,7,0.3,0.5,0,2.55,0,5]
};

// Replace Q1 data
html = html.replace(
  /const Q1_WEEKS = \{[\s\S]*?\};/,
  'const Q1_WEEKS = ' + JSON.stringify(newQ1) + ';'
);

// Replace Q2 data
html = html.replace(
  /const Q2_WEEKS = \{[\s\S]*?\};/,
  'const Q2_WEEKS = ' + JSON.stringify(newQ2) + ';'
);

// ── 3. Replace w <= 21 with weekHasData(w) ──
html = html.replace(/w <= 21/g, 'weekHasData(w)');

// ── 4. Replace TOTAL_WEEKS - 1 with latestWeekWithData() ──
html = html.replace(
  /var latestRank = rankUnits\(\[TOTAL_WEEKS - 1\]\);/,
  'var latestDataWeek = latestWeekWithData(); var latestRank = rankUnits([latestDataWeek]);'
);
html = html.replace(
  /latestRank = rankUnits\(\[TOTAL_WEEKS - 1\]\);/,
  'latestRank = rankUnits([latestDataWeek]);'
);

// ── 5. Add weekHasData / latestWeekWithData functions ──
const newFuncs = `
// Check if a week has actual data (any unit with non-zero score)
function weekHasData(w) {
  for (var i = 0; i < UNITS.length; i++) {
    if (getWeekScore(UNITS[i], w) !== 0) return true;
  }
  return false;
}

// Find the latest week number that has actual data
function latestWeekWithData() {
  for (var w = TOTAL_WEEKS; w >= 1; w--) {
    if (weekHasData(w)) return w;
  }
  return TOTAL_WEEKS;
}
`;

// Insert after TOTAL_WEEKS definition
html = html.replace(
  /var TOTAL_WEEKS = 22;/,
  'var TOTAL_WEEKS = 22;\n' + newFuncs
);

// ── 6. Add AUTH_TOTALS and fix cumulativeTotal ──
const authTotals = `
// Authoritative cumulative totals from 金山文档·总体得分汇总(自动)
var AUTH_TOTALS = {
  "本部": 42.1,
  "东台": 40.35,
  "大丰": 52.0,
  "建湖": 35.1,
  "射阳": 22.2,
  "阜宁": 16.7,
  "滨海": 27.7,
  "响水": 19.25
};
`;

html = html.replace(
  /var TOTAL_WEEKS = 22;/,
  'var TOTAL_WEEKS = 22;\n' + newFuncs + authTotals
);

// Fix cumulativeTotal
html = html.replace(
  /function cumulativeTotal\(unit\) \{\s*return totalScore\(unit, TOTAL_WEEKS\);\s*\}/,
  'function cumulativeTotal(unit) { return AUTH_TOTALS[unit] || totalScore(unit, TOTAL_WEEKS); }'
);

// Fix cumulative ranking in showHub
html = html.replace(
  /var cumRank = rankUnits\(getWeeksInQuarter\('Q1'\)\.concat\(getWeeksInQuarter\('Q2'\)\)\);/,
  'var cumRank = UNITS.map(function(u){return {unit:u,score:AUTH_TOTALS[u]||0};}).sort(function(a,b){return b.score-a.score;});'
);

// ── 7. Fix PDF fonts ──
html = html.replace(
  /font-family: -apple-system, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;/,
  "font-family: -apple-system, 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;"
);

// Fix print font
html = html.replace(
  /@media print \{/,
  "@media print { * { font-family: 'Microsoft YaHei', 'SimHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif !important; }"
);

// ── 8. Add data source note to cumulative ranking ──
html = html.replace(
  /(cumRank\.forEach[\s\S]*?html \+= '<\/div><\/div>';)/,
  "$1\n  html += '<div style=\"font-size:10px;color:var(--text-muted);margin-top:4px;text-align:right;\">数据来源：金山文档·总体得分汇总（自动）</div>';\n"
);

// ── 9. Fix showHub auto-launch ──
// Make sure showHub() is called
if (!html.includes('showHub();')) {
  html = html.replace(
    /<\/script>/,
    '\nshowHub();\n</script>'
  );
}

// ── 10. Update version ──
html = html.replace(
  /<title>[^<]*<\/title>/,
  '<title>盐城供电 · 宣传工作周报看板 v4</title>'
);

// Write result
fs.writeFileSync(__dirname + '/index.html', html);
console.log('✅ Clean build complete:', html.length, 'bytes');
console.log('Contains showHub():', html.includes('showHub();'));
console.log('Contains weekHasData:', html.includes('weekHasData'));
console.log('Contains AUTH_TOTALS:', html.includes('AUTH_TOTALS'));
console.log('Contains w <= 21:', html.includes('w <= 21'));
