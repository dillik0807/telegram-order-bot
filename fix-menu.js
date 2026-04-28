const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

// Replace all admin main menu keyboard definitions
const old1 = `[{ text: '📦 Создать заявку' }],
      [{ text: '👨‍💼 Панель администратора' }]`;
const new1 = `[{ text: '📦 Создать заявку' }],
      [{ text: '💰 Касса' }],
      [{ text: '👨‍💼 Панель администратора' }]`;

const old2 = `[{ text: '📦 Создать заявку' }], [{ text: '👨‍💼 Панель администратора' }]`;
const new2 = `[{ text: '📦 Создать заявку' }], [{ text: '💰 Касса' }], [{ text: '👨‍💼 Панель администратора' }]`;

const old3 = `[[{ text: '📦 Создать заявку' }], [{ text: '👨‍💼 Панель администратора' }]]`;
const new3 = `[[{ text: '📦 Создать заявку' }], [{ text: '💰 Касса' }], [{ text: '👨‍💼 Панель администратора' }]]`;

// inline array style (isAdminUser ternary)
const old4 = `? [[{ text: '📦 Создать заявку' }], [{ text: '👨‍💼 Панель администратора' }]]`;
const new4 = `? [[{ text: '📦 Создать заявку' }], [{ text: '💰 Касса' }], [{ text: '👨‍💼 Панель администратора' }]]`;

let count = 0;
[old1,old2,old3,old4].forEach((o,i) => {
  const n = [new1,new2,new3,new4][i];
  const parts = c.split(o);
  count += parts.length - 1;
  c = parts.join(n);
});

console.log('Replacements made:', count);
fs.writeFileSync('bot.js', c, 'utf8');
console.log('done');
