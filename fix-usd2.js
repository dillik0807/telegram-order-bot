const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

const idx = c.indexOf("lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *");
if (idx === -1) { console.log('not found'); process.exit(1); }

// Find end of this broken line (next \n after the broken part)
const lineEnd = c.indexOf('\n', idx);

// Replace from start of this line to end
const lineStart = c.lastIndexOf('\n', idx - 1) + 1;
const brokenLine = c.slice(lineStart, lineEnd + 1);
console.log('Broken:', JSON.stringify(brokenLine));

const fixedLine = "    lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *$' + data.cashUsd.toLocaleString('ru-RU') + '*');\n";
c = c.slice(0, lineStart) + fixedLine + c.slice(lineEnd + 1);

fs.writeFileSync('bot.js', c, 'utf8');
console.log('done');
