/**
 * Тест команды /editorder
 */

const database = require('./database-wrapper');

async function testEditOrder() {
  console.log('🧪 Тестирование функции редактирования заявок\n');
  
  try {
    // 1. Проверяем наличие заявок
    console.log('1️⃣ Получение списка заявок...');
    const orders = await database.getRecentOrdersWithClients(5);
    
    if (orders.length === 0) {
      console.log('❌ Нет заявок для тестирования');
      console.log('💡 Создайте хотя бы одну заявку через бота');
      return;
    }
    
    console.log(`✅ Найдено заявок: ${orders.length}`);
    orders.forEach(order => {
      console.log(`   - Заявка #${order.id} от ${order.client_name || 'Без имени'}`);
    });
    
    // 2. Тестируем getOrderWithItems
    console.log('\n2️⃣ Тест getOrderWithItems...');
    const testOrderId = orders[0].id;
    console.log(`   Тестируем заявку #${testOrderId}`);
    
    const orderWithItems = await database.getOrderWithItems(testOrderId);
    
    if (!orderWithItems) {
      console.log(`❌ Заявка #${testOrderId} не найдена`);
      return;
    }
    
    console.log('✅ Заявка получена:');
    console.log(`   ID: ${orderWithItems.id}`);
    console.log(`   Склад: ${orderWithItems.warehouse}`);
    console.log(`   Транспорт: ${orderWithItems.transport_number}`);
    console.log(`   Комментарий: ${orderWithItems.comment || 'Нет'}`);
    
    if (orderWithItems.items && orderWithItems.items.length > 0) {
      console.log(`   Товары (${orderWithItems.items.length}):`);
      orderWithItems.items.forEach((item, idx) => {
        console.log(`      ${idx + 1}. ${item.product_name} — ${item.quantity}`);
      });
    } else {
      console.log('   ⚠️ Товары не найдены');
    }
    
    // 3. Проверяем наличие колонок для редактирования
    console.log('\n3️⃣ Проверка колонок для редактирования...');
    const hasMessageIds = 'telegram_message_id' in orderWithItems;
    
    if (hasMessageIds) {
      console.log('✅ Колонки для редактирования существуют:');
      console.log(`   telegram_message_id: ${orderWithItems.telegram_message_id || 'NULL'}`);
      console.log(`   whatsapp_message_id: ${orderWithItems.whatsapp_message_id || 'NULL'}`);
      console.log(`   telegram_group_id: ${orderWithItems.telegram_group_id || 'NULL'}`);
    } else {
      console.log('❌ Колонки для редактирования НЕ найдены');
      console.log('💡 Запустите миграцию: node check-columns.js');
    }
    
    // 4. Проверяем загрузку модуля order-edit-manager
    console.log('\n4️⃣ Проверка модуля OrderEditManager...');
    try {
      const OrderEditManager = require('./order-edit-manager');
      console.log('✅ Модуль загружен');
      
      // Создаем экземпляр
      const mockBot = {
        telegram: {
          editMessageText: async () => console.log('   Mock: editMessageText вызван'),
          sendMessage: async () => console.log('   Mock: sendMessage вызван')
        }
      };
      
      const editManager = new OrderEditManager(mockBot);
      console.log('✅ Экземпляр создан');
      
      // Проверяем методы
      const methods = ['saveMessageIds', 'getMessageIds', 'startEdit', 'handleEdit'];
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
        console.log('\n⚠️ Не все методы найдены!');
      }
      
    } catch (error) {
      console.log(`❌ Ошибка загрузки модуля: ${error.message}`);
    }
    
    // 5. Проверяем команду в bot.js
    console.log('\n5️⃣ Проверка команды /editorder в bot.js...');
    const fs = require('fs');
    const botJs = fs.readFileSync('./bot.js', 'utf8');
    
    if (botJs.includes("bot.command('editorder'")) {
      console.log('✅ Команда /editorder найдена в bot.js');
      
      // Проверяем что команда использует OrderEditManager
      if (botJs.includes('OrderEditManager')) {
        console.log('✅ OrderEditManager используется в команде');
      } else {
        console.log('⚠️ OrderEditManager НЕ используется в команде');
      }
      
      // Проверяем что команда вызывает startEdit
      if (botJs.includes('startEdit')) {
        console.log('✅ Метод startEdit вызывается');
      } else {
        console.log('⚠️ Метод startEdit НЕ вызывается');
      }
      
    } else {
      console.log('❌ Команда /editorder НЕ найдена в bot.js');
      console.log('💡 Проверьте что команда добавлена в bot.js');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 ДИАГНОСТИКА ЗАВЕРШЕНА');
    console.log('='.repeat(60));
    
    // Итоговый вывод
    console.log('\n💡 Возможные причины проблемы:');
    
    if (!hasMessageIds) {
      console.log('   1. ❌ Колонки для редактирования не добавлены');
      console.log('      Решение: node check-columns.js');
    }
    
    if (orderWithItems.items && orderWithItems.items.length === 0) {
      console.log('   2. ⚠️ У заявки нет товаров');
      console.log('      Это может вызвать ошибки при редактировании');
    }
    
    console.log('\n📝 Для тестирования команды:');
    console.log(`   1. Запустите бота: node bot.js`);
    console.log(`   2. Отправьте боту: /editorder ${testOrderId}`);
    console.log(`   3. Проверьте ответ бота`);
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error);
    console.error('Stack:', error.stack);
  } finally {
    database.close();
  }
}

// Запуск теста
testEditOrder();
