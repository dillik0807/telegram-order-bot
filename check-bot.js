require('dotenv').config();
const axios = require('axios');

async function checkBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  console.log('🔍 Проверка бота...\n');
  
  try {
    // Получаем информацию о боте
    const meUrl = `https://api.telegram.org/bot${token}/getMe`;
    const meResponse = await axios.get(meUrl);
    
    console.log('✅ Бот найден:');
    console.log('   Имя:', meResponse.data.result.first_name);
    console.log('   Username: @' + meResponse.data.result.username);
    console.log('   ID:', meResponse.data.result.id);
    console.log('');
    
    // Проверяем webhook
    const webhookUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;
    const webhookResponse = await axios.get(webhookUrl);
    
    if (webhookResponse.data.result.url) {
      console.log('⚠️ Webhook установлен:', webhookResponse.data.result.url);
      console.log('   Это может мешать работе бота через polling');
      console.log('');
      console.log('Удалить webhook? Выполните:');
      console.log(`curl -X POST https://api.telegram.org/bot${token}/deleteWebhook`);
    } else {
      console.log('✅ Webhook не установлен (polling режим)');
    }
    console.log('');
    
    // Проверяем последние обновления
    const updatesUrl = `https://api.telegram.org/bot${token}/getUpdates?limit=1`;
    const updatesResponse = await axios.get(updatesUrl);
    
    if (updatesResponse.data.result.length > 0) {
      console.log('✅ Бот получает обновления');
    } else {
      console.log('ℹ️ Нет новых обновлений');
    }
    
  } catch (error) {
    if (error.response?.data?.description?.includes('Conflict')) {
      console.log('❌ КОНФЛИКТ: Бот запущен в другом месте!');
      console.log('');
      console.log('Возможные причины:');
      console.log('1. Бот открыт в другом терминале');
      console.log('2. Бот запущен на другом компьютере');
      console.log('3. Бот открыт в Telegram Web/Desktop');
      console.log('');
      console.log('Решение: Закройте все экземпляры бота и попробуйте снова');
    } else {
      console.error('❌ Ошибка:', error.response?.data || error.message);
    }
  }
}

checkBot();
