/**
 * Скрипт миграции данных из SQLite в PostgreSQL
 */

require('dotenv').config();

async function migrate() {
  console.log('🔄 Миграция данных из SQLite в PostgreSQL\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL не установлен!');
    console.log('\nДобавьте DATABASE_URL в .env файл:');
    console.log('DATABASE_URL=postgresql://user:password@host:port/database');
    process.exit(1);
  }
  
  try {
    // Загружаем обе базы данных
    const sqlite = require('./database');
    const postgres = require('./database-postgres');
    
    console.log('✅ Подключение к обеим базам данных установлено\n');
    
    // Даем время на инициализацию PostgreSQL
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Миграция клиентов
    console.log('📋 Миграция клиентов...');
    const clients = await sqlite.getAllClients();
    console.log(`   Найдено клиентов: ${clients.length}`);
    
    for (const client of clients) {
      try {
        await postgres.addClient(
          client.telegram_id,
          client.name,
          client.phone,
          client.added_by
        );
        console.log(`   ✅ ${client.name} (${client.telegram_id})`);
      } catch (error) {
        if (error.code === '23505') { // Duplicate key
          console.log(`   ⚠️ ${client.name} уже существует`);
        } else {
          console.error(`   ❌ Ошибка: ${error.message}`);
        }
      }
    }
    
    // Миграция складов
    console.log('\n📦 Миграция складов...');
    const warehouses = await sqlite.getAllWarehouses();
    console.log(`   Найдено складов: ${warehouses.length}`);
    
    for (const warehouse of warehouses) {
      try {
        await postgres.addWarehouse(
          warehouse.name,
          warehouse.whatsapp_group_id
        );
        console.log(`   ✅ ${warehouse.name}`);
      } catch (error) {
        if (error.code === 'WAREHOUSE_EXISTS' || error.code === '23505') {
          console.log(`   ⚠️ ${warehouse.name} уже существует`);
        } else {
          console.error(`   ❌ Ошибка: ${error.message}`);
        }
      }
    }
    
    // Миграция товаров
    console.log('\n🛒 Миграция товаров...');
    const products = await sqlite.getAllProducts();
    console.log(`   Найдено товаров: ${products.length}`);
    
    for (const product of products) {
      try {
        await postgres.addProduct(product.name);
        console.log(`   ✅ ${product.name}`);
      } catch (error) {
        if (error.code === 'PRODUCT_EXISTS' || error.code === '23505') {
          console.log(`   ⚠️ ${product.name} уже существует`);
        } else {
          console.error(`   ❌ Ошибка: ${error.message}`);
        }
      }
    }
    
    // Закрываем подключения
    sqlite.close();
    postgres.close();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');
    console.log('='.repeat(60));
    console.log('\n✅ Данные перенесены в PostgreSQL');
    console.log('✅ Теперь можно деплоить на Railway');
    console.log('\n💡 Следующие шаги:');
    console.log('   1. Проверьте данные в PostgreSQL');
    console.log('   2. Закоммитьте изменения: git add . && git commit -m "Add PostgreSQL support"');
    console.log('   3. Деплой: git push');
    
  } catch (error) {
    console.error('\n❌ ОШИБКА МИГРАЦИИ:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Запуск миграции
migrate()
  .then(() => {
    console.log('\n✅ Скрипт завершен');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Критическая ошибка:', error);
    process.exit(1);
  });
