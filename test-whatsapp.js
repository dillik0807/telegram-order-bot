require('dotenv').config();
const axios = require('axios');

async function testWhatsApp() {
  const idInstance = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;
  const recipient = process.env.WHATSAPP_RECIPIENT;
  
  console.log('🔍 Проверка настроек:');
  console.log('Instance ID:', idInstance);
  console.log('API Token:', apiToken ? apiToken.substring(0, 10) + '...' : 'не указан');
  console.log('Получатель:', recipient);
  console.log('');
  
  // Проверка статуса инстанса
  console.log('📡 Проверка статуса инстанса...');
  try {
    const statusUrl = `https://api.green-api.com/waInstance${idInstance}/getStateInstance/${apiToken}`;
    const statusResponse = await axios.get(statusUrl);
    console.log('✅ Статус инстанса:', statusResponse.data.stateInstance);
    
    if (statusResponse.data.stateInstance !== 'authorized') {
      console.log('');
      console.log('⚠️ ВНИМАНИЕ: WhatsApp не привязан!');
      console.log('');
      console.log('Что делать:');
      console.log('1. Перейдите на https://green-api.com');
      console.log('2. Войдите в личный кабинет');
      console.log('3. Найдите инстанс:', idInstance);
      console.log('4. Отсканируйте QR-код через WhatsApp');
      console.log('   (Настройки → Связанные устройства → Привязать устройство)');
      console.log('');
      return;
    }
  } catch (error) {
    console.error('❌ Ошибка проверки статуса:', error.response?.data || error.message);
    return;
  }
  
  // Отправка тестового сообщения
  console.log('');
  console.log('📤 Отправка тестового сообщения...');
  try {
    const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`;
    
    const data = {
      chatId: recipient + '@c.us',
      message: '🧪 Тестовое сообщение от бота\n\nЕсли вы видите это сообщение, значит Green-API настроен правильно! ✅'
    };
    
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.idMessage) {
      console.log('✅ Сообщение отправлено успешно!');
      console.log('📨 ID сообщения:', response.data.idMessage);
      console.log('');
      console.log('Проверьте WhatsApp номер:', recipient);
    } else {
      console.log('⚠️ Неожиданный ответ:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Ошибка отправки:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('');
      console.log('Детали ошибки:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWhatsApp();
