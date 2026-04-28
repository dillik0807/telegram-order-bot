const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

// Broken line: "    lines.push('💵 Доллар: *\r\n"
const broken = "    lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *\r\n";
const fixed  = "    lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *$' + data.cashUsd.toLocaleString('ru-RU') + '*');\n";

if (c.includes(broken)) {
  c = c.replace(broken, fixed);
  console.log('Fixed!');
} else {
  console.log('Not found');
}

fs.writeFileSync('bot.js', c, 'utf8');
