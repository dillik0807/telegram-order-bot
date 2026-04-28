const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

// Найдём и заменим весь блок cashMode целиком
const oldBlock = `  if (data.cashMode === 'usd') {\r\n    lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *\r\n  }`;
const newUsd = `  if (data.cashMode === 'usd') {\n    lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *$' + data.cashUsd.toLocaleString('ru-RU') + '*');\n  }`;

if (c.includes(oldBlock)) {
  c = c.replace(oldBlock, newUsd);
  console.log('Fixed usd block');
} else {
  console.log('usd block not found, trying fallback...');
  // fallback: найти по частичному совпадению
  const idx = c.indexOf("lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *");
  if (idx !== -1) {
    const end = c.indexOf('\n', idx);
    const line = c.slice(idx, end);
    console.log('Found line:', JSON.stringify(line));
  }
}

// somoni - добавить жирный
c = c.replace(
  "lines.push('\u{1F4B4} \u0421\u043E\u043C\u043E\u043D\u0438: ' + data.cashSomoni.toLocaleString('ru-RU') + ' \u0441\u043E\u043C');\r\n    lines.push('\u{1F4C8} \u041A\u0443\u0440\u0441: ' + data.cashRate.toLocaleString('ru-RU'));\r\n    const equiv = (data.cashSomoni / data.cashRate).toFixed(2);\r\n    lines.push('\u{1F4B5} \u042D\u043A\u0432\u0438\u0432\u0430\u043B\u0435\u043D\u0442: $' + parseFloat(equiv).toLocaleString('ru-RU'));",
  "lines.push('\u{1F4B4} \u0421\u043E\u043C\u043E\u043D\u0438: *' + data.cashSomoni.toLocaleString('ru-RU') + ' \u0441\u043E\u043C*');\n    lines.push('\u{1F4C8} \u041A\u0443\u0440\u0441: *' + data.cashRate.toLocaleString('ru-RU') + '*');\n    const equiv = (data.cashSomoni / data.cashRate).toFixed(2);\n    lines.push('\u{1F4B5} \u042D\u043A\u0432\u0438\u0432\u0430\u043B\u0435\u043D\u0442: *$' + parseFloat(equiv).toLocaleString('ru-RU') + '*');"
);

// both - добавить жирный
c = c.replace(
  "lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: $' + data.cashUsd.toLocaleString('ru-RU'));\r\n    lines.push('\u{1F4B4} \u0421\u043E\u043C\u043E\u043D\u0438: ' + data.cashSomoni.toLocaleString('ru-RU') + ' \u0441\u043E\u043C');\r\n    lines.push('\u{1F4C8} \u041A\u0443\u0440\u0441: ' + data.cashRate.toLocaleString('ru-RU'));",
  "lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *$' + data.cashUsd.toLocaleString('ru-RU') + '*');\n    lines.push('\u{1F4B4} \u0421\u043E\u043C\u043E\u043D\u0438: *' + data.cashSomoni.toLocaleString('ru-RU') + ' \u0441\u043E\u043C*');\n    lines.push('\u{1F4C8} \u041A\u0443\u0440\u0441: *' + data.cashRate.toLocaleString('ru-RU') + '*');"
);

fs.writeFileSync('bot.js', c, 'utf8');
console.log('done');
