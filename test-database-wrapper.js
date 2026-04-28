/**
 * Тест database-wrapper
 * Проверяет, что правильная база данных выбирается автоматически
 */

require('dotenv').config();

console.log('🧪 Тестирование database-wrapper\n');
console.log('═'.repeat(60));

// Проверяем переменную окружения
console.log('\n📋 Переменные окружения:');
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Установлен' : '❌ Не установлен'}`);

if (process.env.DATABASE_URL) {
  const isPostgres = process.env.DATABASE_URL.startsWith('postgres');
  console.log(`   Тип: ${isPostgres ? '🐘 PostgreSQL' : '❓ Неизвестный'}`);
}

console.log('\n' + '═'.repeat(60));

// Загружаем database-wrapper
console.log('\n🔄 Загрузка database-wrapper...\n');

try {
  const database = require('./database-wrapper');
  
  console.log('✅ Database-wrapper загружен успешно!');
  
  // Проверяем доступные методы
  console.log('\n📋 Доступные методы:');
  const methods = [
    'getAllClients',
    'getAllWarehouses', 
    'getAllProducts',
    'addClient',
    'addWarehouse',
    'addProduct',
    'isClient',
    'getStats'
  ];
  
  methods.forEach(method => {
    const exists = typeof database[method] === 'function';
    console.log(`   ${exists ? '✅' : '❌'} ${method}`);
  });
  
  // Пробуем получить статистику
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Тест получения статистики...\n');
  
  setTimeout(async () => {
    try {
      const stats = await database.getStats();
      
      console.log('✅ Статистика получена успешно!');
      console.log(`   👥 Клиентов: ${stats.totalClients}`);
      console.log(`   📦 Заявок: ${stats.totalOrders}`);
      console.log(`   📅 Заявок сегодня: ${stats.ordersToday}`);
      console.log(`   📅 Заявок за неделю: ${stats.ordersWeek}`);
      
      console.log('\n' + '═'.repeat(60));
      console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
      console.log('\n✅ Database-wrapper работает корректно');
      
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
        console.log('✅ Используется PostgreSQL');
        console.log('\n💡 Данные будут сохраняться между деплоями на Railway!');
      } else {
        console.log('✅ Используется SQLite');
        console.log('\n💡 Для Railway добавьте DATABASE_URL в переменные окружения');
      }
      
      console.log('\n' + '═'.repeat(60));
      
      database.close();
      process.exit(0);
      
    } catch (error) {
      console.error('\n❌ Ошибка получения статистики:', error.message);
      console.error('\n📋 Stack trace:', error.stack);
      
      database.close();
      process.exit(1);
    }
  }, 2000); // Даем время на инициализацию PostgreSQL
  
} catch (error) {
  console.error('\n❌ Ошибка загрузки database-wrapper:', error.message);
  console.error('\n📋 Stack trace:', error.stack);
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n🔧 Возможные причины:');
  console.log('   1. Не установлены зависимости: npm install');
  console.log('   2. Ошибка в DATABASE_URL (если используется PostgreSQL)');
  console.log('   3. PostgreSQL не доступен (если используется PostgreSQL)');
  
  process.exit(1);
}
