require('dotenv').config();
const database = require('./database-wrapper');

async function testNewOrders() {
  console.log('🧪 ПРОВЕРКА НОВЫХ ЗАЯВОК\n');
  console.log('=' .repeat(60));
  
  try {
    // Получаем все заявки из базы
    console.log('\n📋 ВСЕ ЗАЯВКИ В БАЗЕ ДАННЫХ:');
    console.log('-'.repeat(60));
    
    const db = database.db;
    
    const allOrders = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          o.id,
          o.user_id,
          o.warehouse,
          o.transport_number,
          o.created_at,
          u.telegram_id,
          u.name as user_name,
          u.phone as user_phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 20
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (allOrders.length === 0) {
      console.log('⚠️ Нет заявок в базе данных');
    } else {
      allOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Заявка #${order.id}`);
        console.log(`   User ID: ${order.user_id}`);
        console.log(`   Telegram ID: ${order.telegram_id}`);
        console.log(`   Имя: ${order.user_name || 'Не указано'}`);
        console.log(`   Телефон: ${order.user_phone || 'Не указан'}`);
        console.log(`   Склад: ${order.warehouse || 'Не указан'}`);
        console.log(`   Транспорт: ${order.transport_number || 'Не указан'}`);
        console.log(`   Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}`);
      });
    }
    
    // Проверяем, есть ли заявки от администратора
    console.log('\n\n📊 ЗАЯВКИ ОТ АДМИНИСТРАТОРА (ID: 5889669586):');
    console.log('-'.repeat(60));
    
    const adminOrders = allOrders.filter(o => o.telegram_id === 5889669586);
    
    if (adminOrders.length === 0) {
      console.log('⚠️ Нет заявок от администратора');
      console.log('💡 Создайте тестовую заявку от администратора');
    } else {
      console.log(`✅ Найдено заявок от администратора: ${adminOrders.length}`);
      adminOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Заявка #${order.id}`);
        console.log(`   Имя: ${order.user_name}`);
        console.log(`   Телефон: ${order.user_phone}`);
        console.log(`   Склад: ${order.warehouse}`);
        console.log(`   Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}`);
      });
    }
    
    // Проверяем таблицу users
    console.log('\n\n👥 ПОЛЬЗОВАТЕЛИ В ТАБЛИЦЕ USERS:');
    console.log('-'.repeat(60));
    
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM users ORDER BY id DESC LIMIT 10', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`);
      console.log(`   Telegram ID: ${user.telegram_id}`);
      console.log(`   Имя: ${user.name || 'Не указано'}`);
      console.log(`   Телефон: ${user.phone || 'Не указан'}`);
    });
    
    // Проверяем таблицу clients
    console.log('\n\n👥 КЛИЕНТЫ В ТАБЛИЦЕ CLIENTS:');
    console.log('-'.repeat(60));
    
    const clients = await database.getAllClients();
    
    clients.forEach((client, index) => {
      console.log(`\n${index + 1}. Telegram ID: ${client.telegram_id}`);
      console.log(`   Имя: ${client.name || 'Не указано'}`);
      console.log(`   Телефон: ${client.phone || 'Не указан'}`);
      console.log(`   Активен: ${client.is_active ? 'Да' : 'Нет'}`);
    });
    
    // Итог
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 ИТОГ:');
    console.log('='.repeat(60));
    console.log(`\n✅ Всего заявок: ${allOrders.length}`);
    console.log(`✅ Заявок от администратора: ${adminOrders.length}`);
    console.log(`✅ Пользователей в users: ${users.length}`);
    console.log(`✅ Клиентов в clients: ${clients.length}`);
    
    if (adminOrders.length > 0) {
      console.log('\n💡 Заявки администратора ЕСТЬ в базе данных');
      console.log('   Проверьте, отображаются ли они в статистике бота');
    } else {
      console.log('\n⚠️ Заявок администратора НЕТ в базе данных');
      console.log('   Создайте тестовую заявку от администратора');
    }
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    console.error(error);
  } finally {
    database.close();
  }
}

testNewOrders();
