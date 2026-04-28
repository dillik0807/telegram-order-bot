const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

// Multi-line keyboard format
const old = `[{ text: '📦 Создать заявку' }],\n      [{ text: '👨‍💼 Панель администратора' }]`;
const rep = `[{ text: '📦 Создать заявку' }],\n      [{ text: '💰 Касса' }],\n      [{ text: '👨‍💼 Панель администратора' }]`;

const parts = c.split(old);
console.log('Found:', parts.length - 1);
c = parts.join(rep);

// Also 6-space indent version
const old2 = `[{ text: '📦 Создать заявку' }],\n          [{ text: '👨‍💼 Панель администратора' }]`;
const rep2 = `[{ text: '📦 Создать заявку' }],\n          [{ text: '💰 Касса' }],\n          [{ text: '👨‍💼 Панель администратора' }]`;

const parts2 = c.split(old2);
console.log('Found (6sp):', parts2.length - 1);
c = parts2.join(rep2);

fs.writeFileSync('bot.js', c, 'utf8');
console.log('done');
