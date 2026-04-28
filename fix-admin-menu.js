const fs = require('fs');
let c = fs.readFileSync('admin.js', 'utf8');

const old = `[{ text: '\u{1F4B0} \u041A\u0430\u0441\u0441\u0430' }],\n      [{ text: '\u{1F4CA} \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430' }]`;
const rep = `[{ text: '\u{1F4B0} \u041A\u0430\u0441\u0441\u0430' }],\n      [{ text: '\u{1F4CA} \u041E\u0442\u0447\u0451\u0442 \u043A\u0430\u0441\u0441\u044B' }],\n      [{ text: '\u{1F4CA} \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430' }]`;

const parts = c.split(old);
console.log('Found:', parts.length - 1);
c = parts.join(rep);
fs.writeFileSync('admin.js', c, 'utf8');
console.log('done');
