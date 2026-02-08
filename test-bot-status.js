require('dotenv').config();
const database = require('./database-wrapper');

async function checkBotStatus() {
  console.log('🔍 ПРОВЕРКА СТАТУСА TELEGRAM ORDER BOT\n');
  console.log('=' .repeat(50));
  
  // 1. Проверка конфигурации
  console.log('\n📋 КОНФИГУРАЦИЯ:');
  console.log('✓ Telegram Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Установлен' : '❌ НЕ УСТАНОВЛЕН');
  console.log('✓ Telegram Group ID:', process.env.TELEGRAM_GROUP_ID || '❌ НЕ УСТАНОВЛЕН');
  console.log('✓ WhatsApp Instance ID:', process.env.GREEN_API_INSTANCE_ID || '❌ НЕ УСТАНОВЛЕН');
  console.log('✓ WhatsApp Token:', process.env.GREEN_API_TOKEN ? 'Установлен' : '❌ НЕ УСТАНОВЛЕН');
  console.log('✓ WhatsApp Group ID:', process.env.WHATSAPP_GROUP_ID || '❌ НЕ УСТАНОВЛЕН');
  console.log('✓ Database Path:', process.env.DB_PATH || './orders.db');
  
  // 2. Проверка базы данных
  console.log('\n📊 БАЗА ДАННЫХ:');
  try {
    const clients = await database.getAllClients();
    const warehouses = await database.getAllWarehouses();
    const products = await database.getAllProducts();
    const pendingRequests = await database.getPendingRequests();
    
    console.log(`✓ Клиентов: ${clients.length}`);
    console.log(`✓ Складов: ${warehouses.length}`);
    console.log(`✓ Товаров: ${products.length}`);
    console.log(`✓ Ожидающих запросов: ${pendingRequests.length}`);
    
    // 3. Детали складов
    if (warehouses.length > 0) {
      console.log('\n🏬 СКЛАДЫ:');
      warehouses.forEach((w, i) => {
        const whatsappStatus = w.whatsapp_group_id ? `✅ ${w.whatsapp_group_id}` : '❌ не настроен';
        console.log(`${i + 1}. ${w.name} - WhatsApp: ${whatsappStatus}`);
      });
    }
    
    // 4. Детали клиентов
    if (clients.length > 0) {
      console.log('\n👥 КЛИЕНТЫ:');
      clients.forEach((c, i) => {
        const status = c.name && c.phone ? '✅' : '⚠️ неполные данные';
        console.log(`${i + 1}. ${c.name || 'Без имени'} (ID: ${c.telegram_id}) ${status}`);
      });
    }
    
    // 5. Ожидающие запросы
    if (pendingRequests.length > 0) {
      console.log('\n⏳ ОЖИДАЮЩИЕ ЗАПРОСЫ:');
      pendingRequests.forEach((r, i) => {
        console.log(`${i + 1}. ${r.name} (ID: ${r.telegram_id})`);
      });
    }
    
    // 6. Проверка умной маршрутизации
    console.log('\n📱 УМНАЯ МАРШРУТИЗАЦИЯ WHATSAPP:');
    const balkhiGroup = await database.getWarehouseWhatsApp('ЧБалхи');
    const zavodGroup = await database.getWarehouseWhatsApp('ЗаводТЧ');
    
    console.log(`✓ ЧБалхи → ${balkhiGroup || '❌ не настроен'}`);
    console.log(`✓ ЗаводТЧ → ${zavodGroup || '❌ не настроен'}`);
    
    // 7. Итоговый статус
    console.log('\n' + '='.repeat(50));
    console.log('📊 ИТОГОВЫЙ СТАТУС:');
    
    const issues = [];
    
    if (!process.env.TELEGRAM_BOT_TOKEN) issues.push('❌ Не установлен Telegram Bot Token');
    if (!process.env.GREEN_API_INSTANCE_ID) issues.push('⚠️ Не установлен WhatsApp Instance ID');
    if (!process.env.GREEN_API_TOKEN) issues.push('⚠️ Не установлен WhatsApp Token');
    if (warehouses.length === 0) issues.push('⚠️ Нет складов в базе');
    if (products.length === 0) issues.push('⚠️ Нет товаров в базе');
    if (clients.length === 0) issues.push('⚠️ Нет клиентов в базе');
    
    if (issues.length === 0) {
      console.log('✅ ВСЕ СИСТЕМЫ РАБОТАЮТ НОРМАЛЬНО!');
      console.log('🚀 Бот готов к работе!');
    } else {
      console.log('⚠️ ОБНАРУЖЕНЫ ПРОБЛЕМЫ:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
  } finally {
    database.close();
  }
}

checkBotStatus();
