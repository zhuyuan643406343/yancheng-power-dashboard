// Rebuild from ca2300a (known working) with only essential data updates
const fs = require('fs');

let html = fs.readFileSync(__dirname + '/base_good.html', 'utf8');
console.log('Base size:', html.length);

// ═══ 1. Replace entire data loading section with embedded data ═══
const embeddedData = `
// ===== 数据区（内嵌）=====
var DATA_VERSION = '2026-06-01';

var Q1_WEEKS = {
  "本部":[0.3,2,3.2,0.6,2.8,5.1,0.3,0,0,1,9,0.3,0],
  "东台":[0,0.6,0,0.9,0.6,5.2,1.4,0,0.3,1.7,0.4,1.2,5],
  "大丰":[2.5,0,0,6.6,0.3,1.05,1.5,0.15,-0.4,25,0.9,2,0.3],
  "建湖":[0.3,0,0,0.3,0.7,1,0.6,-0.1,0.7,4.2,0.6,1.5,0.8],
  "射阳":[0,0,1.1,0.5,0.25,0.6,0.25,0.35,-0.2,0.15,0.9,1.25,0],
  "阜宁":[0,0,0,0.7,-0.5,1.5,-0.1,0.9,-0.5,0.4,0.4,0.1,0.3],
  "滨海":[0,0,1.1,0,1.2,1.65,1.05,4.8,1.7,2.75,0.3,-0.1,0.3],
  "响水":[0,0,0,-0.55,-0.2,0.8,0.9,-0.1,-0.3,0.65,0.65,1,0.5]
};

var Q2_WEEKS = {
  "本部":[0,0.8,0,1.5,0,0,1,5.5,6.6],
  "东台":[0,1.4,0,7,0.2,1.1,1.1,0.2,5.1],
  "大丰":[0,1.1,0.2,0.85,-1.2,0.4,2.75,2.1,5.9],
  "建湖":[0,0.8,1.9,6.05,2.5,5.25,1.4,0.2,1.15],
  "射阳":[0,0.2,0,2.2,1.7,3.8,2.5,5.5,0.5],
  "阜宁":[0,2.2,0.4,0.1,3.5,3.3,0.6,0.25,0.5],
  "滨海":[0,0.45,0.25,1.2,1.7,5.5,3,0.3,-0.2],
  "响水":[0,0.2,7,0.3,0.5,0,2.55,0,5]
};

// 权威累计总分（来源：金山文档·总体得分汇总(自动) s22）
var AUTH_TOTALS = { "本部":42.1, "东台":40.35, "大丰":52.0, "建湖":35.1, "射阳":22.2, "阜宁":16.7, "滨海":27.7, "响水":19.25 };
`;

// Replace the data loading section
html = html.replace(
  /\/\/ ===== 数据区[\s\S]*?await loadData\(\);/,
  embeddedData
);

// Also remove any remaining loadData references
html = html.replace(/var ok = await loadData\(\);[\s\S]*?}\s*}\s*}/, '}');
html = html.replace(/async function loadData[\s\S]*?^}\s*$/m, '');
html = html.replace(/loadData\(\)\.then[\s\S]*?}\);/, '');

// ═══ 2. Fix w <= 21 → weekHasData(w) ═══
html = html.replace(/w <= 21/g, 'weekHasData(w)');

// ═══ 3. Fix TOTAL_WEEKS - 1 → latestWeekWithData() ═══
html = html.replace(
  /TOTAL_WEEKS\s*-\s*1(?=[^a-zA-Z])/g,
  'latestWeekWithData()'
);

// ═══ 4. Add weekHasData / latestWeekWithData after TOTAL_WEEKS ═══
const helperFuncs = `
// Check if a week has actual data
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
}
`;

html = html.replace(
  /(var TOTAL_WEEKS = 22;)/,
  '$1\n' + helperFuncs
);

// ═══ 5. Fix cumulativeTotal to use AUTH_TOTALS ═══
html = html.replace(
  /function cumulativeTotal\(unit\)\s*\{[\s\S]*?return totalScore\(unit, TOTAL_WEEKS\);[\s\S]*?\}/,
  'function cumulativeTotal(unit) { return AUTH_TOTALS[unit] || totalScore(unit, TOTAL_WEEKS); }'
);

// ═══ 6. Fix cumulative ranking to use AUTH_TOTALS ═══
html = html.replace(
  /var cumRank = rankUnits\(getWeeksInQuarter\('Q1'\)\.concat\(getWeeksInQuarter\('Q2'\)\)\);/,
  'var cumRank = UNITS.map(function(u){return {unit:u,score:AUTH_TOTALS[u]||0};}).sort(function(a,b){return b.score-a.score;});'
);

// Add data source note after cumulative ranking
html = html.replace(
  /(html \+= '<\/div><\/div>';\s*\n\s*v\.innerHTML = html;)/,
  "html += '<div style=\"font-size:10px;color:var(--text-muted);margin-top:4px;text-align:right;\">数据来源：金山文档·总体得分汇总（自动）</div>';\n  html += '</div></div>';\n\n  v.innerHTML = html;"
);

// ═══ 7. Fix PDF fonts ═══
html = html.replace(
  /font-family:\s*-apple-system,\s*'PingFang SC',\s*'Helvetica Neue',\s*Arial,\s*sans-serif;/,
  "font-family: -apple-system, 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;"
);
html = html.replace(
  /font-family:\s*'SimSun',\s*'STSong',[^;]*;/,
  "font-family: 'Microsoft YaHei', 'SimHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;"
);
html = html.replace(
  /(@media print \{[^}]*)/,
  "$1 * { font-family: 'Microsoft YaHei', 'SimHei', 'PingFang SC', sans-serif !important; }"
);

// ═══ 8. Update title ═══
html = html.replace(
  /<title>[^<]*<\/title>/,
  '<title>盐城供电 · 宣传工作周报看板 v4</title>'
);

// ═══ Save ═══
fs.writeFileSync(__dirname + '/index.html', html);
console.log('✅ Rebuilt:', html.length, 'bytes,', html.split('\n').length, 'lines');
console.log('Has weekHasData:', html.includes('weekHasData'));
console.log('Has AUTH_TOTALS:', html.includes('AUTH_TOTALS'));
console.log('Has w <= 21:', html.includes('w <= 21'));
console.log('Has TOTAL_WEEKS - 1:', /TOTAL_WEEKS\s*-\s*1/.test(html));
console.log('Has loadData:', html.includes('async function loadData'));
console.log('Has showHub():', html.includes('showHub();'));
