const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

const startMarker = "bot.hears('\u{1F4CA} \u041E\u0442\u0447\u0451\u0442 \u043A\u0430\u0441\u0441\u044B', async (ctx) => {";
const startIdx = c.indexOf(startMarker);
if (startIdx === -1) { console.log('start not found'); process.exit(1); }

// Find closing }); after this handler
let depth = 0;
let i = startIdx;
let endIdx = -1;
while (i < c.length) {
  if (c[i] === '{') depth++;
  else if (c[i] === '}') {
    depth--;
    if (depth === 0) {
      // Check for });
      if (c.slice(i, i+3) === '});') {
        endIdx = i + 3;
        break;
      }
    }
  }
  i++;
}

if (endIdx === -1) { console.log('end not found'); process.exit(1); }
console.log('Found:', startIdx, '-', endIdx);

const newHandler = `bot.hears('\u{1F4CA} \u041E\u0442\u0447\u0451\u0442 \u043A\u0430\u0441\u0441\u044B', async (ctx) => {
  const userId = ctx.from.id;
  if (!admin.isAdmin(userId)) return;

  try {
    const lastSent = await database.getLastCashReportSent();
    const records = await database.getCashReport();
    const totals = await database.getCashTotals();

    const fromDate = lastSent ? new Date(lastSent).toLocaleDateString('ru-RU') : '\u043D\u0430\u0447\u0430\u043B\u0430';
    const toDate = new Date().toLocaleDateString('ru-RU');

    let msg = '\u{1F4CA} \u041E\u0442\u0447\u0451\u0442 \u043A\u0430\u0441\u0441\u044B\\n\u{1F4C5} ' + fromDate + ' \u2014 ' + toDate + '\\n\\n';

    if (records.length === 0) {
      msg += '\u{1F4ED} \u041D\u043E\u0432\u044B\u0445 \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u043D\u0435\u0442\\n';
    } else {
      records.forEach((r, i) => {
        const date = new Date(r.created_at).toLocaleDateString('ru-RU');
        msg += (i + 1) + '. ' + r.client_name + ' (' + (r.client_phone || '\u2014') + ')\\n';
        if (r.mode === 'usd' || r.mode === 'both') msg += '   \u{1F4B5} $' + parseFloat(r.usd).toLocaleString('ru-RU') + '\\n';
        if (r.mode === 'somoni' || r.mode === 'both') msg += '   \u{1F4B4} ' + parseFloat(r.somoni).toLocaleString('ru-RU') + ' \u0441\u043E\u043C\\n';
        msg += '   \u{1F4C5} ' + date + '\\n';
      });
    }

    msg += '\\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\\n';
    msg += '\u{1F4B5} \u0418\u0442\u043E\u0433\u043E: *$' + parseFloat(totals.total_usd).toLocaleString('ru-RU') + '*\\n';
    msg += '\u{1F4B4} \u0418\u0442\u043E\u0433\u043E: *' + parseFloat(totals.total_somoni).toLocaleString('ru-RU') + ' \u0441\u043E\u043C*\\n';
    msg += '\u{1F4E6} \u0417\u0430\u043F\u0438\u0441\u0435\u0439: ' + totals.count;

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '\u{1F4E4} \u041F\u0435\u0440\u0435\u0434\u0430\u0442\u044C \u043A\u0430\u0441\u0441\u0438\u0440\u0443', callback_data: 'cash_report_send' },
          { text: '\u274C \u0417\u0430\u043A\u0440\u044B\u0442\u044C', callback_data: 'cash_report_close' }
        ]]
      }
    });
  } catch (error) {
    console.error('\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u0447\u0451\u0442\u0430 \u043A\u0430\u0441\u0441\u044B:', error);
    ctx.reply('\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043E\u0442\u0447\u0451\u0442\u0430');
  }
});`;

const newContent = c.slice(0, startIdx) + newHandler + c.slice(endIdx);
fs.writeFileSync('bot.js', newContent, 'utf8');
console.log('done');
