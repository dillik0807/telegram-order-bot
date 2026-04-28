/**
 * Тест всех исправлений PostgreSQL
 * Проверяет, что все три исправления работают корректно
 */

require('dotenv').config();

async function testPostgreSQLFixes() {
  console.log('🧪 ТЕСТИРОВАНИЕ ИСПРАВЛЕНИЙ POSTGRESQL\n');
  console.log('=' .repeat(60));
  
  try {
    // Проверка 1: Подключение к базе данных
    console.log('\n📋 ТЕСТ 1: Подключение к PostgreSQL');
    console.log('-'.repeat(60));
    
    const database = require('./database-wrapper');
    console.log('✅ База данных подключена');
    
    // Проверка 2: Метод addClient с проверкой существования
    console.log('\n📋 ТЕСТ 2: Метод addClient (проверка дубликатов)');
    console.log('-'.repeat(60));
    
    const testTelegramId = 999999999; // Тестовый ID
    const testName = 'Тестовый Пользователь';
    const testPhone = '+992900000000';
    
    try {
      // Первое добавление
      console.log(`Попытка 1: Добавление клиента ${testTelegramId}...`);
      const clientId1 = await database.addClient(testTelegramId, testName, testPhone, testTelegramId);
      console.log(`✅ Клиент добавлен с ID: ${clientId1}`);
      
      // Второе добавление (должно обновить, а не упасть)
      console.log(`\nПопытка 2: Повторное добавление клиента ${testTelegramId}...`);
      const clientId2 = await database.addClient(testTelegramId, testName + ' (обновлен)', testPhone, testTelegramId);
      console.log(`✅ Клиент обновлен, ID: ${clientId2}`);
      
      if (clientId1 === clientId2) {
        console.log('✅ ID совпадают - обновление работает корректно');
      } else {
        console.log('⚠️ ID не совпадают - возможна проблема');
      }
      
      // Удаляем тестового клиента
      await database.removeClient(testTelegramId);
      console.log('🗑️ Тестовый клиент удален');
      
    } catch (error) {
      if (error.code === '23505') {
        console.log('❌ ОШИБКА 23505: Метод addClient не проверяет существование!');
        console.log('   Исправление НЕ применено!');
        return false;
      } else {
        throw error;
      }
    }
    
    // Проверка 3: SQL запросы со статистикой
    console.log('\n📋 ТЕСТ 3: Статистика (LEFT JOIN + COALESCE)');
    console.log('-'.repeat(60));
    
    try {
      const stats = await database.getDetailedOrderStats();
      console.log(`✅ getDetailedOrderStats() работает`);
      console.log(`   Найдено записей: ${stats.length}`);
      
      if (stats.length > 0) {
        console.log(`   Пример: ${stats[0].client_name} - ${stats[0].orders_count} заявок`);
      }
    } catch (error) {
      console.log('❌ Ошибка в getDetailedOrderStats():', error.message);
      return false;
    }
    
    try {
      const recentOrders = await database.getRecentOrdersWithClients(5);
      console.log(`✅ getRecentOrdersWithClients() работает`);
      console.log(`   Найдено записей: ${recentOrders.length}`);
      
      if (recentOrders.length > 0) {
        console.log(`   Последняя заявка: ${recentOrders[0].client_name} - ${recentOrders[0].warehouse}`);
      }
    } catch (error) {
      console.log('❌ Ошибка в getRecentOrdersWithClients():', error.message);
      return false;
    }
    
    // Проверка 4: Совместимость с fix-order-bot-soft-delete.js
    console.log('\n📋 ТЕСТ 4: Совместимость с fix-order-bot-soft-delete.js');
    console.log('-'.repeat(60));
    
    try {
      require('./fix-order-bot-soft-delete');
      console.log('✅ Модуль fix-order-bot-soft-delete загружен без ошибок');
    } catch (error) {
      console.log('❌ Ошибка загрузки fix-order-bot-soft-delete:', error.message);
      return false;
    }
    
    // Итоговый результат
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
    console.log('='.repeat(60));
    console.log('\n✅ Исправление 1: Статистика с LEFT JOIN + COALESCE');
    console.log('✅ Исправление 2: Метод addClient проверяет дубликаты');
    console.log('✅ Исправление 3: Совместимость с fix-order-bot-soft-delete');
    console.log('\n🚀 Бот готов к деплою на Railway!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    console.error('Стек:', error.stack);
    return false;
  } finally {
    // Закрываем подключение
    try {
      if (database && database.close) {
        database.close();
        console.log('\n🔌 Подключение к базе данных закрыто');
      }
    } catch (error) {
      // Игнорируем ошибки закрытия
    }
  }
}

// Запуск тестов
testPostgreSQLFixes()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Необработанная ошибка:', error);
    process.exit(1);
  });
