const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

const startMarker = '// Вспомогательная функция: формирует и показывает шаблон инкассо\nasync function buildCashMessage(ctx, userId, data) {';
const endMarker = '\nbot.on(\'text\', async (ctx) => {';

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('Markers not found:', startIdx, endIdx);
  // Try alternate markers
  const alt1 = c.indexOf('async function buildCashMessage');
  const alt2 = c.indexOf("bot.on('text'");
  console.log('Alt markers:', alt1, alt2);
  process.exit(1);
}

console.log('Found at:', startIdx, '-', endIdx);

const newFunc = `// Вспомогательная функция: формирует и показывает шаблон инкассо
async function buildCashMessage(ctx, userId, data) {
  const client = data.cashClient;
  const lines = [
    '\u{1F4B0} \u0418\u041D\u041A\u0410\u0421\u0421\u041E',
    '',
    '\u{1F464} \u041A\u043B\u0438\u0435\u043D\u0442: ' + client.name,
    '\u{1F4DE} \u0422\u0435\u043B\u0435\u0444\u043E\u043D: ' + (client.phone || '\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D')
  ];

  if (data.cashMode === 'usd') {
    lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *$' + data.cashUsd.toLocaleString('ru-RU') + '*');
  }

  if (data.cashMode === 'somoni') {
    lines.push('\u{1F4B4} \u0421\u043E\u043C\u043E\u043D\u0438: *' + data.cashSomoni.toLocaleString('ru-RU') + ' \u0441\u043E\u043C*');
    lines.push('\u{1F4C8} \u041A\u0443\u0440\u0441: *' + data.cashRate.toLocaleString('ru-RU') + '*');
    const equiv = (data.cashSomoni / data.cashRate).toFixed(2);
    lines.push('\u{1F4B5} \u042D\u043A\u0432\u0438\u0432\u0430\u043B\u0435\u043D\u0442: *$' + parseFloat(equiv).toLocaleString('ru-RU') + '*');
  }

  if (data.cashMode === 'both') {
    lines.push('\u{1F4B5} \u0414\u043E\u043B\u043B\u0430\u0440: *$' + data.cashUsd.toLocaleString('ru-RU') + '*');
    lines.push('\u{1F4B4} \u0421\u043E\u043C\u043E\u043D\u0438: *' + data.cashSomoni.toLocaleString('ru-RU') + ' \u0441\u043E\u043C*');
    lines.push('\u{1F4C8} \u041A\u0443\u0440\u0441: *' + data.cashRate.toLocaleString('ru-RU') + '*');
  }

  lines.push('\u{1F4C5} ' + new Date().toLocaleDateString('ru-RU'));

  const cashMessage = lines.join('\\n');
  data.cashMessage = cashMessage;
  data.step = 'cash_confirm';
  orderData.set(userId, data);

  const cashierPhone = process.env.CASHIER_WHATSAPP_PHONE || process.env.WHATSAPP_RECIPIENT;

  return ctx.reply(
    '\u{1F4CB} \u0428\u0430\u0431\u043B\u043E\u043D \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043A\u0430\u0441\u0441\u0438\u0440\u0443:\\n\\n' + cashMessage + '\\n\\n' +
    '\u{1F4F1} \u041A\u0430\u0441\u0441\u0438\u0440: ' + (cashierPhone || '\u274C \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D') + '\\n\\n\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C?',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '\u2705 \u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u0430\u0441\u0441\u0438\u0440\u0443', callback_data: 'cash_send' },
          { text: '\u274C \u041E\u0442\u043C\u0435\u043D\u0430', callback_data: 'cash_cancel' }
        ]]
      }
    }
  );
}`;

const newContent = c.slice(0, startIdx) + newFunc + c.slice(endIdx);
fs.writeFileSync('bot.js', newContent, 'utf8');
console.log('done, new length:', newContent.length);
