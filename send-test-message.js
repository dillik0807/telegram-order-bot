require('dotenv').config();
const whatsapp = require('./whatsapp');

async function sendTestMessage() {
  const phoneNumber = process.argv[2];
  
  if (!phoneNumber) {
    console.log('❌ Укажите номер телефона!');
    console.log('');
    console.log('Использование:');
    console.log('node telegram-order-bot/send-test-message.js 992900000000');
    console.log('');
    console.log('Примеры:');
    console.log('node telegram-order-bot/send-test-message.js 992900000000');
    console.log('node telegram-order-bot/send-test-message.js 992901234567');
    return;
  }
  
  // Проверяем формат номера
  if (!/^\d+$/.test(phoneNumber)) {
    console.log('❌ Неверный формат номера!');
    console.log('Номер должен содержать только цифры без + и пробелов');
    console.log('');
    console.log('Примеры правильных номеров:');
    console.log('992900000000');
    console.log('992901234567');
    return;
  }
  
  console.log('📤 Отправка тестового сообщения на WhatsApp');
  console.log('');
  console.log(`Номер: +${phoneNumber}`);
  console.log(`ChatId: ${phoneNumber}@c.us`);
  console.log('');
  
  // Проверяем настройки Green-API
  if (!process.env.GREEN_API_INSTANCE_ID || !process.env.GREEN_API_TOKEN) {
    console.log('❌ Green-API не настроен!');
    console.log('');
    console.log('Добавьте в .env файл:');
    console.log('GREEN_API_INSTANCE_ID=ваш_instance_id');
    console.log('GREEN_API_TOKEN=ваш_токен');
    return;
  }
  
  console.log('✅ Green-API настроен');
  console.log(`   Instance ID: ${process.env.GREEN_API_INSTANCE_ID}`);
  console.log('');
  
  const testMessage = `🧪 ТЕСТОВОЕ СООБЩЕНИЕ

📦 Это тестовое сообщение от бота заявок

📱 Номер получателя: +${phoneNumber}
⏰ Время отправки: ${new Date().toLocaleString('ru-RU')}

✅ Если вы получили это сообщение, значит отправка работает корректно!`;
  
  console.log('📨 Текст сообщения:');
  console.log('---');
  console.log(testMessage);
  console.log('---');
  console.log('');
  
  try {
    console.log('⏳ Отправка...');
    const sent = await whatsapp.sendMessage(testMessage, phoneNumber);
    
    if (sent) {
      console.log('');
      console.log('✅ Сообщение успешно отправлено!');
      console.log('');
      console.log('📱 Проверьте WhatsApp на номере +' + phoneNumber);
      console.log('');
      console.log('💡 Если сообщение не пришло:');
      console.log('   1. Проверьте, что номер правильный');
      console.log('   2. Проверьте статус Green-API инстанса');
      console.log('   3. Убедитесь, что номер добавлен в контакты');
      console.log('   4. Проверьте, что Green-API авторизован');
    } else {
      console.log('');
      console.log('❌ Ошибка отправки сообщения');
      console.log('');
      console.log('💡 Возможные причины:');
      console.log('   1. Неправильный номер телефона');
      console.log('   2. Green-API не авторизован');
      console.log('   3. Инстанс Green-API не активен');
      console.log('   4. Недостаточно средств на балансе Green-API');
      console.log('   5. Номер заблокирован WhatsApp');
    }
  } catch (error) {
    console.error('');
    console.error('❌ Ошибка:', error.message);
  }
}

sendTestMessage();
