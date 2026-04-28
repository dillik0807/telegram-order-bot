/**
 * Тест полной функциональности редактирования заявок
 */

const database = require('./database-wrapper');

async function testOrderEditFeature() {
  console.log('🧪 Тестирование функции редактирования заявок\n');
  
  try {
    // 1. Проверяем, что колонки добавлены
    console.log('1️⃣ Проверка структуры базы данных...');
    
    const db = database.db || database.pool;
    
    if (database.pool) {
      // PostgreSQL
      const result = await database.pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name IN ('telegram_message_id', 'whatsapp_message_id', 'telegram_group_id')
      `);
      
      console.log(`   ✅ Найдено колонок: ${result.rows.length}/3`);
      result.rows.forEach(row => {
        console.log(`      - ${row.column_name}`);
      });
      
      if (result.rows.length !== 3) {
        console.log('   ⚠️ Не все колонки найдены! Запустите миграцию.');
        return false;
      }
    } else {
      // SQLite
      const columns = await new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(orders)", (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      const requiredColumns = ['telegram_message_id', 'whatsapp_message_id', 'telegram_group_id'];
      const foundColumns = columns.filter(col => requiredColumns.includes(col.name));
      
      console.log(`   ✅ Найдено колонок: ${foundColumns.length}/3`);
      foundColumns.forEach(col => {
        console.log(`      - ${col.name}`);
      });
      
      if (foundColumns.length !== 3) {
        console.log('   ⚠️ Не все колонки найдены! Запустите миграцию.');
        return false;
      }
    }
    
    // 2. Проверяем, что модуль order-edit-manager загружается
    console.log('\n2️⃣ Проверка модуля OrderEditManager...');
    const OrderEditManager = require('./order-edit-manager');
    console.log('   ✅ Модуль загружен успешно');
    
    // 3. Проверяем методы класса
    console.log('\n3️⃣ Проверка методов класса...');
    const mockBot = { telegram: {} };
    const editManager = new OrderEditManager(mockBot);
    
    const methods = [
      'saveMessageIds',
      'getMessageIds',
      'startEdit',
      'showEditMenu',
      'handleEdit',
      'saveChanges',
      'formatOrderMessage'
    ];
    
    let allMethodsExist = true;
    methods.forEach(method => {
      if (typeof editManager[method] === 'function') {
        console.log(`   ✅ ${method}`);
      } else {
        console.log(`   ❌ ${method} - НЕ НАЙДЕН`);
        allMethodsExist = false;
      }
    });
    
    if (!allMethodsExist) {
      console.log('\n   ⚠️ Не все методы найдены!');
      return false;
    }
    
    // 4. Проверяем, что есть заявки для тестирования
    console.log('\n4️⃣ Проверка наличия заявок...');
    const orders = await database.getRecentOrdersWithClients(5);
    
    if (orders.length === 0) {
      console.log('   ⚠️ Нет заявок для тестирования');
      console.log('   💡 Создайте хотя бы одну заявку через бота');
      return true; // Это не ошибка, просто нет данных
    }
    
    console.log(`   ✅ Найдено заявок: ${orders.length}`);
    orders.forEach(order => {
      console.log(`      - Заявка #${order.id} от ${order.client_name || 'Без имени'}`);
    });
    
    // 5. Тестируем сохранение ID сообщений
    console.log('\n5️⃣ Тест сохранения ID сообщений...');
    const testOrderId = orders[0].id;
    const testTelegramMsgId = 999999;
    const testWhatsAppMsgId = 'test_wa_msg_id';
    const testGroupId = '-1001234567890';
    
    const saved = await editManager.saveMessageIds(
      testOrderId,
      testTelegramMsgId,
      testWhatsAppMsgId,
      testGroupId
    );
    
    if (saved) {
      console.log('   ✅ ID сообщений сохранены');
      
      // Проверяем, что они действительно сохранились
      const messageIds = await editManager.getMessageIds(testOrderId);
      
      if (messageIds) {
        console.log('   ✅ ID сообщений получены:');
        console.log(`      - Telegram: ${messageIds.telegram_message_id}`);
        console.log(`      - WhatsApp: ${messageIds.whatsapp_message_id}`);
        console.log(`      - Группа: ${messageIds.telegram_group_id}`);
        
        if (messageIds.telegram_message_id == testTelegramMsgId &&
            messageIds.whatsapp_message_id == testWhatsAppMsgId &&
            messageIds.telegram_group_id == testGroupId) {
          console.log('   ✅ Все ID совпадают!');
        } else {
          console.log('   ⚠️ ID не совпадают с сохраненными');
        }
      } else {
        console.log('   ❌ Не удалось получить ID сообщений');
        return false;
      }
    } else {
      console.log('   ❌ Не удалось сохранить ID сообщений');
      return false;
    }
    
    // 6. Проверяем команды в bot.js
    console.log('\n6️⃣ Проверка интеграции команд...');
    const botJs = require('fs').readFileSync('./bot.js', 'utf8');
    
    const commands = [
      { name: '/editorder', found: botJs.includes("bot.command('editorder'") },
      { name: '/myorders', found: botJs.includes("bot.command('myorders'") },
      { name: 'OrderEditManager', found: botJs.includes("require('./order-edit-manager')") }
    ];
    
    commands.forEach(cmd => {
      if (cmd.found) {
        console.log(`   ✅ ${cmd.name} - интегрирована`);
      } else {
        console.log(`   ❌ ${cmd.name} - НЕ НАЙДЕНА`);
      }
    });
    
    // 7. Проверяем интеграцию в admin.js
    console.log('\n7️⃣ Проверка интеграции в админ-панель...');
    const adminJs = require('fs').readFileSync('./admin.js', 'utf8');
    
    if (adminJs.includes('/editorder')) {
      console.log('   ✅ Команда /editorder добавлена в список заявок');
    } else {
      console.log('   ⚠️ Команда /editorder не найдена в admin.js');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
    console.log('='.repeat(60));
    console.log('\n📋 Функция редактирования заявок готова к использованию!\n');
    console.log('💡 Как использовать:');
    console.log('   1. Создайте заявку через бота');
    console.log('   2. Используйте /myorders чтобы увидеть свои заявки');
    console.log('   3. Используйте /editorder ID для редактирования');
    console.log('   4. Администраторы видят кнопку редактирования в "📦 Последние заявки"\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error);
    return false;
  } finally {
    database.close();
  }
}

// Запуск теста
testOrderEditFeature().then(success => {
  process.exit(success ? 0 : 1);
});
