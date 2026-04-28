const fs = require('fs');
let lines = fs.readFileSync('bot.js', 'utf8').split('\n');

// Each entry: [lineIndex of "Панель администратора", indent]
const insertions = [
  { after: 265, indent: '      ' },  // line 266 (0-indexed 265)
  { after: 424, indent: '    ' },    // line 425 (0-indexed 424)
  { after: 1072, indent: '          ' }, // line 1073 (0-indexed 1072)
  { after: 1367, indent: '      ' }, // line 1368 (0-indexed 1367)
];

// Insert in reverse order so indices don't shift
for (const ins of insertions.reverse()) {
  const idx = ins.after; // 0-indexed line of "Панель администратора"
  const newLine = ins.indent + "[{ text: '\u{1F4B0} \u041A\u0430\u0441\u0441\u0430' }],\r";
  lines.splice(idx, 0, newLine);
  console.log('Inserted at line', idx + 1);
}

fs.writeFileSync('bot.js', lines.join('\n'), 'utf8');
console.log('done');
