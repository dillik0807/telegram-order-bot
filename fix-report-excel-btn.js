const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

// Add Excel button to the inline keyboard in cash report display
const old = `          { text: '\u{1F4E4} \u041F\u0435\u0440\u0435\u0434\u0430\u0442\u044C \u043A\u0430\u0441\u0441\u0438\u0440\u0443', callback_data: 'cash_report_send' },
          { text: '\u274C \u0417\u0430\u043A\u0440\u044B\u0442\u044C', callback_data: 'cash_report_close' }`;

const rep = `          { text: '\u{1F4E4} \u041F\u0435\u0440\u0435\u0434\u0430\u0442\u044C \u043A\u0430\u0441\u0441\u0438\u0440\u0443', callback_data: 'cash_report_send' }
        ],
        [
          { text: '\u{1F4E5} \u0421\u043A\u0430\u0447\u0430\u0442\u044C Excel', callback_data: 'cash_report_excel' },
          { text: '\u274C \u0417\u0430\u043A\u0440\u044B\u0442\u044C', callback_data: 'cash_report_close' }`;

const parts = c.split(old);
console.log('Found:', parts.length - 1);
c = parts.join(rep);
fs.writeFileSync('bot.js', c, 'utf8');
console.log('done');
