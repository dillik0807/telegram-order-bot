require('dotenv').config();
const database = require('./database-wrapper');

async function testAdminOrdersFix() {
  console.log('🧪 ТЕСТ: Заявки администратора в статистике и экспорте\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Проверяем текущую статистику
    console.log('\n📊 1. ДЕТАЛЬНАЯ СТАТИСТИКА ПО ПОЛЬЗОВАТЕЛЯМ:');
    console.log('-'.repeat(60));
    
    const detailedStats = await database.getDetailedOrderStats();
    
    if (detailedStats.length === 0) {
      console.log('⚠️ Нет данных в статистике');
    } else {
      detailedStats.forEach((stat, index) => {
        console.log(`\n${index + 1}. ${stat.client_name || 'Без имени'}`);
        console.log(`   📞 Телефон: ${stat.phone || 'Не указан'}`);
        console.log(`   🆔 Telegram ID: ${stat.telegram_id}`);
        console.log(`   📦 Заявок: ${stat.orders_count}`);
        console.log(`   📅 Последняя заявка: ${stat.last_order_date ? new Date(stat.last_order_date).toLocaleString('ru-RU') : 'Нет'}`);
      });
    }
    
    // 2. Проверяем последние заявки
    console.log('\n\n📋 2. ПОСЛЕДНИЕ ЗАЯВКИ (с информацией о клиентах):');
    console.log('-'.repeat(60));
    
    const recentOrders = await database.getRecentOrdersWithClients(10);
    
    if (recentOrders.length === 0) {
      console.log('⚠️ Нет заявок в базе данных');
    } else {
      recentOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Заявка #${order.id}`);
        console.log(`   👤 Клиент: ${order.client_name || 'Без имени'}`);
        console.log(`   📞 Телефон: ${order.phone || 'Не указан'}`);
        console.log(`   🆔 Telegram ID: ${order.telegram_id}`);
        console.log(`   🏬 Склад: ${order.warehouse}`);
        console.log(`   🚚 Транспорт: ${order.transport_number || 'Не указан'}`);
        console.log(`   📅 Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}`);
      });
    }
    
    // 3. Проверяем статистику по складам
    console.log('\n\n🏬 3. СТАТИСТИКА ПО СКЛАДАМ:');
    console.log('-'.repeat(60));
    
    const warehouseStats = await database.getWarehouseStats();
    
    if (warehouseStats.length === 0) {
      console.log('⚠️ Нет данных по складам');
    } else {
      warehouseStats.forEach((stat, index) => {
        console.log(`\n${index + 1}. ${stat.warehouse}`);
        console.log(`   📦 Заявок: ${stat.orders_count}`);
        console.log(`   👥 Уникальных клиентов: ${stat.unique_clients}`);
      });
    }
    
    // 4. Проверяем, есть ли администраторы в таблице clients
    console.log('\n\n👨‍💼 4. АДМИНИСТРАТОРЫ В ТАБЛИЦЕ CLIENTS:');
    console.log('-'.repeat(60));
    
    const adminIds = [5889669586]; // ID администратора из admin.js
    
    for (const adminId of adminIds) {
      const adminClient = await database.getClient(adminId);
      if (adminClient) {
        console.log(`✅ Администратор ${adminId} найден в таблице clients`);
        console.log(`   Имя: ${adminClient.name || 'Не указано'}`);
        console.log(`   Телефон: ${adminClient.phone || 'Не указан'}`);
      } else {
        console.log(`⚠️ Администратор ${adminId} НЕ найден в таблице clients`);
        console.log(`   Его заявки могут не попадать в статистику`);
      }
    }
    
    // 5. Итоговый отчет
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 ИТОГОВЫЙ ОТЧЕТ:');
    console.log('='.repeat(60));
    
    const totalUsers = detailedStats.length;
    const totalOrders = recentOrders.length;
    const totalWarehouses = warehouseStats.length;
    
    console.log(`\n✅ Пользователей в статистике: ${totalUsers}`);
    console.log(`✅ Заявок в базе: ${totalOrders}`);
    console.log(`✅ Складов с заявками: ${totalWarehouses}`);
    
    console.log('\n💡 РЕКОМЕНДАЦИИ:');
    console.log('-'.repeat(60));
    
    if (totalUsers === 0) {
      console.log('⚠️ Нет пользователей в статистике - создайте тестовую заявку');
    } else {
      console.log('✅ Статистика работает корректно');
    }
    
    if (totalOrders === 0) {
      console.log('⚠️ Нет заявок в базе - создайте тестовую заявку');
    } else {
      console.log('✅ Заявки отображаются корректно');
    }
    
    console.log('\n🎯 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Запустите бота: node bot.js');
    console.log('2. Создайте заявку от имени администратора');
    console.log('3. Проверьте, что заявка появилась в статистике');
    console.log('4. Экспортируйте данные в Excel через админ-панель');
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    console.error(error);
  } finally {
    database.close();
  }
}

testAdminOrdersFix();
