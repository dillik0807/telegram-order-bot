require('dotenv').config();
const axios = require('axios');

async function getWhatsAppGroups() {
  const idInstance = process.env.GREEN_API_INSTANCE_ID;
  const apiToken = process.env.GREEN_API_TOKEN;
  
  console.log('🔍 Получение списка WhatsApp чатов и групп...\n');
  
  try {
    const url = `https://api.green-api.com/waInstance${idInstance}/getChats/${apiToken}`;
    const response = await axios.get(url);
    
    if (!response.data || response.data.length === 0) {
      console.log('❌ Чаты не найдены');
      return;
    }
    
    console.log('📋 Найдено чатов:', response.data.length);
    console.log('');
    
    // Фильтруем только группы
    const groups = response.data.filter(chat => chat.id.includes('@g.us'));
    
    if (groups.length === 0) {
      console.log('❌ WhatsApp группы не найдены');
      console.log('');
      console.log('Что делать:');
      console.log('1. Создайте группу в WhatsApp');
      console.log('2. Добавьте туда привязанный номер (992935020807)');
      console.log('3. Запустите этот скрипт снова');
      return;
    }
    
    console.log('📱 WhatsApp ГРУППЫ:\n');
    groups.forEach((group, index) => {
      console.log(`${index + 1}. Название: ${group.name}`);
      console.log(`   ID: ${group.id}`);
      console.log(`   Участников: ${group.metadata?.participants?.length || 'неизвестно'}`);
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Чтобы отправлять заявки в группу:');
    console.log('');
    console.log('1. Скопируйте ID нужной группы (например: 120363XXXXXXXXXX@g.us)');
    console.log('2. Откройте файл .env');
    console.log('3. Раскомментируйте и добавьте:');
    console.log('');
    console.log('   WHATSAPP_GROUP_ID=120363XXXXXXXXXX@g.us');
    console.log('');
    console.log('4. Перезапустите бота');
    console.log('');
    console.log('⚠️ ВАЖНО: Если указан WHATSAPP_GROUP_ID, заявки будут');
    console.log('   отправляться в группу, а не личному получателю!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

getWhatsAppGroups();
