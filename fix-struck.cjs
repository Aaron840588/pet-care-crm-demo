const fs = require('fs');
const path = 'src/views/InvoiceView.jsx';
const raw = fs.readFileSync(path, 'utf8');
const lines = raw.split('\n');

// ── 1. Insert Struck helper right after the imports block (after line 14) ──
// Find "const applyDiscountAcrossLines" line
let insertAt = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const applyDiscountAcrossLines')) { insertAt = i; break; }
}
if (insertAt === -1) { console.log('❌ Could not find applyDiscountAcrossLines'); process.exit(1); }

const struckHelper = [
  '// ── Struck: renders a strikethrough that html-to-image can capture ───────────\r',
  '// CSS text-decoration:line-through is often not rendered in html-to-image snapshots.\r',
  '// Using a positioned child span as a physical line instead.\r',
  'const Struck = ({ children, style }) => (\r',
  '  <span style={{ position: \'relative\', display: \'inline-block\', color: \'#bbb\', ...style }}>\r',
  '    {children}\r',
  '    <span style={{\r',
  '      position: \'absolute\', left: \'0px\', right: \'0px\', top: \'50%\',\r',
  '      height: \'1.5px\', background: \'#bbb\', display: \'block\',\r',
  '      transform: \'translateY(-50%)\',\r',
  '    }} />\r',
  '  </span>\r',
  ');\r',
  '\r',
];
lines.splice(insertAt, 0, ...struckHelper);
console.log('✅ Inserted Struck helper at line', insertAt + 1);

// Re-join and apply string replacements
let content = lines.join('\n');

// ── 2. Replace rate column strikethrough (for rate_flat) ──
const oldRateStrike = `                              <span style={{ color: '#bbb', textDecoration: 'line-through', textDecorationThickness: '1.5px', marginRight: '4px', fontSize: '11px' }}>
                                {c.rate}
                              </span>`;
const newRateStrike = `                              <Struck style={{ marginRight: '4px', fontSize: '11px' }}>{c.rate}</Struck>`;

// Windows CRLF version
const oldRateStrikeCR = oldRateStrike.replace(/\n/g, '\r\n');
const newRateStrikeCR = newRateStrike.replace(/\n/g, '\r\n');

if (content.includes(oldRateStrikeCR)) {
  content = content.replace(oldRateStrikeCR, newRateStrikeCR);
  console.log('✅ Fixed rate column strikethrough (CRLF)');
} else if (content.includes(oldRateStrike)) {
  content = content.replace(oldRateStrike, newRateStrike);
  console.log('✅ Fixed rate column strikethrough (LF)');
} else {
  // Try line scan
  const idx = content.indexOf("textDecoration: 'line-through'");
  console.log('⚠️  Rate col target not found, first line-through at char:', idx);
  console.log(JSON.stringify(content.substring(idx - 80, idx + 120)));
}

// ── 3. Replace amount column strikethrough ──
const oldAmtStrike = `                              <span style={{ color: '#bbb', textDecoration: 'line-through', textDecorationThickness: '1.5px', marginRight: '4px', fontSize: '11px' }}>
                                {c.baseAmount}
                              </span>`;
const newAmtStrike = `                              <Struck style={{ marginRight: '4px', fontSize: '11px' }}>{c.baseAmount}</Struck>`;

const oldAmtStrikeCR = oldAmtStrike.replace(/\n/g, '\r\n');
const newAmtStrikeCR = newAmtStrike.replace(/\n/g, '\r\n');

if (content.includes(oldAmtStrikeCR)) {
  content = content.replace(oldAmtStrikeCR, newAmtStrikeCR);
  console.log('✅ Fixed amount column strikethrough (CRLF)');
} else if (content.includes(oldAmtStrike)) {
  content = content.replace(oldAmtStrike, newAmtStrike);
  console.log('✅ Fixed amount column strikethrough (LF)');
} else {
  console.log('⚠️  Amount col target not found');
}

// ── 4. Replace total line strikethrough ──
const oldTotalStrike = `                  <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: '16px', marginRight: '8px', fontWeight: 700 }}>
                    ₱{fullTotal.toFixed(0)}
                  </span>`;
const newTotalStrike = `                  <Struck style={{ fontSize: '16px', marginRight: '8px', fontWeight: 700 }}>₱{fullTotal.toFixed(0)}</Struck>`;

const oldTotalStrikeCR = oldTotalStrike.replace(/\n/g, '\r\n');
const newTotalStrikeCR = newTotalStrike.replace(/\n/g, '\r\n');

if (content.includes(oldTotalStrikeCR)) {
  content = content.replace(oldTotalStrikeCR, newTotalStrikeCR);
  console.log('✅ Fixed total strikethrough (CRLF)');
} else if (content.includes(oldTotalStrike)) {
  content = content.replace(oldTotalStrike, newTotalStrike);
  console.log('✅ Fixed total strikethrough (LF)');
} else {
  console.log('⚠️  Total target not found');
  // Try a looser match
  const idx2 = content.indexOf("₱{fullTotal.toFixed(0)}");
  if (idx2 > -1) {
    console.log('Context around fullTotal:', JSON.stringify(content.substring(idx2 - 150, idx2 + 100)));
  }
}

fs.writeFileSync(path, content);
console.log('Done');
