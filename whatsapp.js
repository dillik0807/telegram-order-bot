const axios = require('axios');

// Отправка сообщения через Green-API
async function sendMessage(message) {
  const idInstance = process.env.GREEN_API_INSTANCE_ID;
  const apiTokenInstance = process.env.GREEN_API_TOKEN;
  const recipient = process.env.WHATSAPP_RECIPIENT;
  
  if (!idInstance || !apiTokenInstance) {
    console.log('⚠️ Green-API не настроен (отсутствуют idInstance или apiToken)');
    return false;
  }
  
  if (!recipient) {
    console.log('⚠️ Номер получателя WhatsApp не указан');
    return false;
  }
  
  try {
    const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
    
    const data = {
      chatId: recipient + '@c.us', // Формат для личного чата
      message: message
    };
    
    console.log('📤 Отправка в WhatsApp через Green-API...');
    
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.idMessage) {
      console.log('✅ Сообщение отправлено в WhatsApp!');
      console.log('📨 ID сообщения:', response.data.idMessage);
      return true;
    } else {
      console.log('⚠️ Неожиданный ответ от Green-API:', response.data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Ошибка отправки в WhatsApp:', error.response?.data || error.message);
    return false;
  }
}

// Отправка в WhatsApp группу через Green-API
async function sendToGroup(message, groupId) {
  const idInstance = process.env.GREEN_API_INSTANCE_ID;
  const apiTokenInstance = process.env.GREEN_API_TOKEN;
  
  if (!idInstance || !apiTokenInstance) {
    console.log('⚠️ Green-API не настроен');
    return false;
  }
  
  if (!groupId) {
    console.log('⚠️ ID группы WhatsApp не указан');
    return false;
  }
  
  try {
    const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
    
    const data = {
      chatId: groupId, // ID группы в формате 120363XXXXXXXXXX@g.us
      message: message
    };
    
    console.log('📤 Отправка в WhatsApp группу через Green-API...');
    
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.idMessage) {
      console.log('✅ Сообщение отправлено в WhatsApp группу!');
      console.log('📨 ID сообщения:', response.data.idMessage);
      return true;
    } else {
      console.log('⚠️ Неожиданный ответ от Green-API:', response.data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Ошибка отправки в WhatsApp группу:', error.response?.data || error.message);
    return false;
  }
}

module.exports = {
  sendMessage,
  sendToGroup
};
