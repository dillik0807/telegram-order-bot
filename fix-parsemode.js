const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

const old = `      reply_markup: {
        inline_keyboard: [[
          { text: '\u2705 \u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u0430\u0441\u0441\u0438\u0440\u0443', callback_data: 'cash_send' },
          { text: '\u274C \u041E\u0442\u043C\u0435\u043D\u0430', callback_data: 'cash_cancel' }
        ]]
      }`;

const rep = `      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '\u2705 \u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u0430\u0441\u0441\u0438\u0440\u0443', callback_data: 'cash_send' },
          { text: '\u274C \u041E\u0442\u043C\u0435\u043D\u0430', callback_data: 'cash_cancel' }
        ]]
      }`;

const count = c.split(old).length - 1;
console.log('Found:', count);
c = c.split(old).join(rep);
fs.writeFileSync('bot.js', c, 'utf8');
console.log('done');
