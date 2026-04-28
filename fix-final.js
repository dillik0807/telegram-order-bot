const fs = require('fs');
let lines = fs.readFileSync('bot.js', 'utf8').split('\n');

const fixes = {
  471: "    lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *$' + data.cashUsd.toLocaleString('ru-RU') + '*');\r",
  16359: "    lines.push('\u{1F4B5} \u042D\u043A\u0432\u0438\u0432\u0430\u043B\u0435\u043D\u0442: *$' + parseFloat(equiv).toLocaleString('ru-RU') + '*');\r",
  16363: "    lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *$' + data.cashUsd.toLocaleString('ru-RU') + '*');\r"
};

for (const [lineNum, replacement] of Object.entries(fixes)) {
  const idx = parseInt(lineNum) - 1;
  console.log('Before:', JSON.stringify(lines[idx]));
  lines[idx] = replacement;
  console.log('After:', JSON.stringify(lines[idx]));
}

fs.writeFileSync('bot.js', lines.join('\n'), 'utf8');
console.log('done');
