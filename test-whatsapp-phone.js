require('dotenv').config();
const database = require('./database');
const whatsapp = require('./whatsapp');

async function testWhatsAppPhone() {
  console.log('🔍 Диагностика отправки на личный номер WhatsApp\n');
  
  try {
    // 1. Проверяем настройки Green-API
    console.log('1️⃣ Проверка настроек Green-API:');
    console.log(`   GREEN_API_INSTANCE_ID: ${process.env.GREEN_API_INSTANCE_ID ? '✅ Настроен' : '❌ Не настроен'}`);
    console.log(`   GREEN_API_TOKEN: ${process.env.GREEN_API_TOKEN ? '✅ Настроен' : '❌ Не настроен'}`);
    console.log('');
    
    // 2. Получаем список складов
    console.log('2️⃣ Проверка складов в базе данных:');
    const warehouses = await database.getAllWarehouses();
    
    if (warehouses.length === 0) {
      console.log('   ❌ Нет складов в базе данных');
      return;
    }
    
    console.log(`   Найдено складов: ${warehouses.length}\n`);
    
    // 3. Проверяем каждый склад
    for (const warehouse of warehouses) {
      console.log(`📦 Склад: ${warehouse.name}`);
      console.log(`   ID: ${warehouse.id}`);
      
      // Получаем настройки WhatsApp
      const settings = await database.getWarehouseWhatsAppSettings(warehouse.name);
      
      console.log(`   WhatsApp группа: ${settings.whatsapp_group_id || '❌ не настроена'}`);
      console.log(`   WhatsApp номер: ${settings.whatsapp_phone || '❌ не настроен'}`);
      
      // Если есть личный номер, проверяем формат
      if (settings.whatsapp_phone) {
        const phone = settings.whatsapp_phone;
        const isValidFormat = /^\d+$/.test(phone);
        
        console.log(`   Формат номера: ${isValidFormat ? '✅ Правильный' : '❌ Неправильный'}`);
        console.log(`   Полный номер: +${phone}`);
        console.log(`   ChatId для Green-API: ${phone}@c.us`);
        
        // Предлагаем отправить тестовое сообщение
        console.log(`\n   💡 Для теста отправки на этот номер выполните:`);
        console.log(`   node telegram-order-bot/send-test-message.js ${phone}\n`);
      }
      
      console.log('');
    }
    
    // 4. Проверяем, какой склад будет использоваться для теста
    console.log('4️⃣ Тест отправки сообщения:');
    const warehouseWithPhone = warehouses.find(w => w.whatsapp_phone);
    
    if (!warehouseWithPhone) {
      console.log('   ❌ Нет складов с настроенным личным номером');
      console.log('   💡 Настройте номер командой:');
      console.log('   /setwhatsappphone Название_склада | 992900000000');
      return;
    }
    
    console.log(`   Используем склад: ${warehouseWithPhone.name}`);
    console.log(`   Номер: +${warehouseWithPhone.whatsapp_phone}`);
    console.log('');
    
    // 5. Отправляем тестовое сообщение
    const testMessage = `🧪 ТЕСТОВОЕ СООБЩЕНИЕ\n\nВремя: ${new Date().toLocaleString('ru-RU')}\nСклад: ${warehouseWithPhone.name}\nНомер: +${warehouseWithPhone.whatsapp_phone}`;
    
    console.log('   📤 Отправка тестового сообщения...');
    const sent = await whatsapp.sendMessage(testMessage, warehouseWithPhone.whatsapp_phone);
    
    if (sent) {
      console.log('   ✅ Сообщение успешно отправлено!');
      console.log('   📱 Проверьте WhatsApp на номере +' + warehouseWithPhone.whatsapp_phone);
    } else {
      console.log('   ❌ Ошибка отправки сообщения');
      console.log('   💡 Проверьте:');
      console.log('      - Правильность номера');
      console.log('      - Настройки Green-API');
      console.log('      - Статус инстанса Green-API');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await database.close();
  }
}

testWhatsAppPhone();
