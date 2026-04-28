const fs = require('fs');
let c = fs.readFileSync('bot.js', 'utf8');

const startMarker = "    if (callbackData === 'cash_report_send') {";
const endMarker = "\n        if (callbackData === 'cash_report_close') {";

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('Markers not found:', startIdx, endIdx);
  process.exit(1);
}

console.log('Found at:', startIdx, '-', endIdx);

const newBlock = `    if (callbackData === 'cash_report_send') {
      try {
        const lastSent = await database.getLastCashReportSent();
        const totals = await database.getCashTotals();
        const records = await database.getCashReport();

        const fromDate = lastSent
          ? new Date(lastSent).toLocaleDateString('ru-RU')
          : '\u043D\u0430\u0447\u0430\u043B\u0430';
        const toDate = new Date().toLocaleDateString('ru-RU');

        let msg = '\u{1F4CA} \u041E\u0422\u0427\u0401\u0422 \u041A\u0410\u0421\u0421\u042B\\n';
        msg += '\u{1F4C5} ' + fromDate + ' \u2014 ' + toDate + '\\n\\n';

        records.forEach((r, i) => {
          const date = new Date(r.created_at).toLocaleDateString('ru-RU');
          msg += (i + 1) + '. ' + r.client_name + '\\n';
          if (r.mode === 'usd' || r.mode === 'both') msg += '   \u{1F4B5} $' + parseFloat(r.usd).toLocaleString('ru-RU') + '\\n';
          if (r.mode === 'somoni' || r.mode === 'both') msg += '   \u{1F4B4} ' + parseFloat(r.somoni).toLocaleString('ru-RU') + ' \u0441\u043E\u043C\\n';
          msg += '   \u{1F4C5} ' + date + '\\n';
        });

        msg += '\\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\\n';
        msg += '\u{1F4B5} \u0418\u0442\u043E\u0433\u043E: $' + parseFloat(totals.total_usd).toLocaleString('ru-RU') + '\\n';
        msg += '\u{1F4B4} \u0418\u0442\u043E\u0433\u043E: ' + parseFloat(totals.total_somoni).toLocaleString('ru-RU') + ' \u0441\u043E\u043C';

        // \u0413\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0435\u043C Excel
        const excelExporter = require('./excel-export');
        const excelResult = await excelExporter.exportCashReport();

        // \u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C WhatsApp \u043A\u0430\u0441\u0441\u0438\u0440\u0443
        const cashierPhone = process.env.CASHIER_WHATSAPP_PHONE || process.env.WHATSAPP_RECIPIENT;
        const cashierInstanceId = process.env.GREEN_API_INSTANCE_ID_PERSONAL || process.env.GREEN_API_INSTANCE_ID;
        const cashierToken = process.env.GREEN_API_TOKEN_PERSONAL || process.env.GREEN_API_TOKEN;
        const sent = await whatsapp.sendMessage(msg, cashierPhone, cashierInstanceId, cashierToken);

        if (excelResult.success) {
          await ctx.replyWithDocument(
            { source: excelResult.filePath, filename: excelResult.fileName },
            { caption: '\u{1F4CA} \u041E\u0442\u0447\u0451\u0442 \u043A\u0430\u0441\u0441\u044B: ' + fromDate + ' \u2014 ' + toDate }
          );
          await whatsapp.sendFile(
            excelResult.filePath, excelResult.fileName,
            '\u{1F4CA} \u041E\u0442\u0447\u0451\u0442 \u043A\u0430\u0441\u0441\u044B: ' + fromDate + ' \u2014 ' + toDate,
            cashierPhone, cashierInstanceId, cashierToken
          );
        }

        // \u0421\u0431\u0440\u0430\u0441\u044B\u0432\u0430\u0435\u043C \u043F\u0435\u0440\u0438\u043E\u0434 \u043F\u043E\u0441\u043B\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E\u0439 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438
        if (sent) await database.markCashReportSent();

        await ctx.answerCbQuery(sent ? '\u2705 \u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E!' : '\u274C \u041E\u0448\u0438\u0431\u043A\u0430 WhatsApp');
        await ctx.editMessageText(
          (sent ? '\u2705 \u041E\u0442\u0447\u0451\u0442 \u043F\u0435\u0440\u0435\u0434\u0430\u043D \u043A\u0430\u0441\u0441\u0438\u0440\u0443!\\n\\n' : '\u26A0\uFE0F WhatsApp \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\\n\\n') + msg
        );
      } catch (error) {
        console.error('\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u043E\u0442\u0447\u0451\u0442\u0430:', error);
        await ctx.answerCbQuery('\u274C \u041E\u0448\u0438\u0431\u043A\u0430');
      }
    }

`;

const newContent = c.slice(0, startIdx) + newBlock + c.slice(endIdx);
fs.writeFileSync('bot.js', newContent, 'utf8');
console.log('done');
