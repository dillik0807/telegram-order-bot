/**
 * Исправление поврежденного кода в bot.js
 * Запустите: node fix-damaged-code.js
 */

const fs = require('fs');
const path = require('path');

const botFilePath = path.join(__dirname, 'bot.js');

console.log('🔧 Исправление поврежденного кода в bot.js...\n');

// Читаем файл
let content = fs.readFileSync(botFilePath, 'utf8');

// Находим поврежденный блок
const damagedStart = content.indexOf('return ctx.reply(sEach');
if (damagedStart === -1) {
  console.log('✅ Поврежденный код не найден. Файл уже исправлен или повреждение в другом месте.');
  process.exit(0);
}

console.log('❌ Найден поврежденный код на позиции:', damagedStart);

// Находим начало блока "if (text === '✅ Продолжить')"
const blockStart = content.lastIndexOf("if (text === '✅ Продолжить')", damagedStart);
if (blockStart === -1) {
  console.log('❌ Не удалось найти начало блока');
  process.exit(1);
}

// Находим конец блока (следующий "// Шаг 5")
const blockEnd = content.indexOf('// Шаг 5:', damagedStart);
if (blockEnd === -1) {
  console.log('❌ Не удалось найти конец блока');
  process.exit(1);
}

console.log('📍 Блок найден: строки', blockStart, '-', blockEnd);

// Правильный код для замены
const correctCode = `if (text === '✅ Продолжить') {
        // Для администратора - запрашиваем поиск клиента
        if (isAdminUser) {
          data.step = 'search_client';
          orderData.set(userId, data);
          
          let summary = '📋 Ваша заявка:\\n\\n';
          summary += \`🏬 Склад: \${data.warehouse}\\n\\n\`;
          summary += 'Товары:\\n';
          data.items.forEach((item, i) => {
            summary += \`\${i + 1}. \${item.product} — \${item.quantity}\\n\`;
          });
          summary += '\\n🔍 Введите имя клиента для поиска:\\n';
          summary += '(или введите "-" для ручного ввода)';
          
          return ctx.reply(summary, { reply_markup: { remove_keyboard: true } });
        } else {
          // Для обычного клиента - проверяем сохраненные данные
          const client = await database.getClient(userId);
          
          if (client && client.name && client.phone && client.name.trim() !== '' && client.phone.trim() !== '') {
            // Данные уже есть и заполнены - сразу запрашиваем транспорт
            data.name = client.name;
            data.phone = client.phone;
            data.step = 'transport';
            orderData.set(userId, data);
            
            let summary = '📋 Ваша заявка:\\n\\n';
            summary += \`👤 Имя: \${client.name}\\n\`;
            summary += \`📞 Телефон: \${client.phone}\\n\`;
            summary += \`🏬 Склад: \${data.warehouse}\\n\\n\`;
            summary += 'Товары:\\n';
            data.items.forEach((item, i) => {
              summary += \`\${i + 1}. \${item.product} — \${item.quantity}\\n\`;
            });
            summary += '\\n🚚 Введите номер транспорта:\\n(например: 1234 AB)';
            
            return ctx.reply(summary, { reply_markup: { remove_keyboard: true } });
          } else {
            // Данные не заполнены или клиент новый - запрашиваем имя и телефон
            data.step = 'name';
            orderData.set(userId, data);
            
            let summary = '📋 Ваша заявка:\\n\\n';
            summary += \`🏬 Склад: \${data.warehouse}\\n\\n\`;
            summary += 'Товары:\\n';
            data.items.forEach((item, i) => {
              summary += \`\${i + 1}. \${item.product} — \${item.quantity}\\n\`;
            });
            
            if (client && client.name && client.name.trim() !== '') {
              summary += '\\n📝 Обновите ваши контактные данные:\\n\\n';
              summary += \`Ваше текущее имя: \${client.name}\\n\`;
              summary += 'Введите новое имя или отправьте "-" чтобы оставить текущее:';
            } else {
              summary += '\\n📝 Заполните контактные данные:\\n\\n';
              summary += 'Введите ваше имя:';
            }
            
            return ctx.reply(summary, { reply_markup: { remove_keyboard: true } });
          }
        }
      }
    }

    `;

// Заменяем поврежденный блок
const before = content.substring(0, blockStart);
const after = content.substring(blockEnd);
const newContent = before + correctCode + after;

// Создаем резервную копию
const backupPath = path.join(__dirname, 'bot.js.backup-' + Date.now());
fs.writeFileSync(backupPath, content);
console.log('💾 Резервная копия создана:', backupPath);

// Записываем исправленный файл
fs.writeFileSync(botFilePath, newContent);
console.log('✅ Файл bot.js исправлен!');
console.log('\n🧪 Проверьте бота: node bot.js');
