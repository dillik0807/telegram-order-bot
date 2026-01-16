require('dotenv').config();
const axios = require('axios');

async function testGroup() {
  const idInstance = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;
  const groupId = process.env.WHATSAPP_GROUP_ID;
  
  console.log('🧪 Тест отправки в WhatsApp группу\n');
  console.log('Группа:', groupId);
  console.log('');
  
  try {
    const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`;
    
    const testMessage = `🧪 ТЕСТОВОЕ СООБЩЕНИЕ

Это тест отправки заявок в WhatsApp группу.

Если вы видите это сообщение, значит бот настроен правильно! ✅

Теперь все заявки будут приходить сюда.`;
    
    const data = {
      chatId: groupId,
      message: testMessage
    };
    
    console.log('📤 Отправка тестового сообщения...');
    
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.idMessage) {
      console.log('✅ Сообщение отправлено в группу!');
      console.log('📨 ID сообщения:', response.data.idMessage);
      console.log('');
      console.log('Проверьте WhatsApp группу "Заявка ва ТТН"');
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

testGroup();
