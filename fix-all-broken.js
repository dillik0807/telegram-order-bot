const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

// Fix all broken lines that end with "* \r\n" (unclosed string after bold marker)
// Pattern: lines.push('... *\r\n  (next line content)
// We need to find each broken push and reconstruct it

const fixes = [
  {
    search: "lines.push('\u{1F4B5} \u042D\u043A\u0432\u0438\u0432\u0430\u043B\u0435\u043D\u0442: *",
    replace: "lines.push('\u{1F4B5} \u042D\u043A\u0432\u0438\u0432\u0430\u043B\u0435\u043D\u0442: *$' + parseFloat(equiv).toLocaleString('ru-RU') + '*');"
  }
];

for (const fix of fixes) {
  const idx = c.indexOf(fix.search);
  if (idx === -1) { console.log('not found:', fix.search.slice(0,20)); continue; }
  const lineEnd = c.indexOf('\n', idx);
  const lineStart = c.lastIndexOf('\n', idx - 1) + 1;
  const broken = c.slice(lineStart, lineEnd + 1);
  console.log('Broken:', JSON.stringify(broken));
  const indent = broken.match(/^(\s*)/)[1];
  c = c.slice(0, lineStart) + indent + fix.replace + '\n' + c.slice(lineEnd + 1);
  console.log('Fixed!');
}

fs.writeFileSync('bot.js', c, 'utf8');
console.log('done');
