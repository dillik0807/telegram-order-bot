require('dotenv').config();
const axios = require('axios');

async function checkGreenAPI() {
  const idInstance = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;
  const recipient = process.env.WHATSAPP_RECIPIENT;
  
  console.log('🔍 Проверка Green-API\n');
  console.log('Instance ID:', idInstance);
  console.log('Получатель:', recipient);
  console.log('');
  
  try {
    // Проверка статуса
    const statusUrl = `https://api.green-api.com/waInstance${idInstance}/getStateInstance/${apiToken}`;
    const statusResponse = await axios.get(statusUrl);
    console.log('✅ Статус:', statusResponse.data.stateInstance);
    console.log('');
    
    // Получаем информацию об аккаунте
    const settingsUrl = `https://api.green-api.com/waInstance${idInstance}/getSettings/${apiToken}`;
    const settingsResponse = await axios.get(settingsUrl);
    console.log('📱 Привязанный номер WhatsApp:', settingsResponse.data.wid);
    console.log('');
    
    // Проверяем, существует ли контакт
    console.log('🔍 Проверка контакта:', recipient);
    const checkUrl = `https://api.green-api.com/waInstance${idInstance}/checkWhatsapp/${apiToken}`;
    const checkResponse = await axios.post(checkUrl, {
      phoneNumber: recipient
    });
    
    if (checkResponse.data.existsWhatsapp) {
      console.log('✅ Номер зарегистрирован в WhatsApp');
      console.log('   WhatsApp ID:', checkResponse.data.wid);
    } else {
      console.log('❌ Номер НЕ зарегистрирован в WhatsApp!');
      console.log('');
      console.log('⚠️ ПРОБЛЕМА: Номер', recipient, 'не найден в WhatsApp');
      console.log('');
      console.log('Решение:');
      console.log('1. Убедитесь, что номер правильный');
      console.log('2. Проверьте, что WhatsApp установлен на этом номере');
      console.log('3. Попробуйте другой номер');
    }
    console.log('');
    
    // Получаем последние сообщения
    console.log('📨 Последние отправленные сообщения:');
    const messagesUrl = `https://api.green-api.com/waInstance${idInstance}/lastOutgoingMessages/${apiToken}`;
    const messagesResponse = await axios.get(messagesUrl);
    
    if (messagesResponse.data && messagesResponse.data.length > 0) {
      messagesResponse.data.slice(0, 3).forEach((msg, i) => {
        console.log(`${i + 1}. ID: ${msg.idMessage}`);
        console.log(`   Кому: ${msg.chatId}`);
        console.log(`   Статус: ${msg.statusMessage || 'отправлено'}`);
        console.log(`   Текст: ${msg.textMessage?.substring(0, 50)}...`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

checkGreenAPI();
