require('dotenv').config();
const { Telegraf } = require('telegraf');

async function quickTest() {
  console.log('🔍 Быстрая проверка Telegram бота...\n');
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN не установлен в .env');
    process.exit(1);
  }
  
  const bot = new Telegraf(token);
  
  try {
    console.log('📡 Подключение к Telegram API...');
    const botInfo = await bot.telegram.getMe();
    
    console.log('✅ Бот подключен успешно!');
    console.log(`📱 Имя бота: @${botInfo.username}`);
    console.log(`🆔 ID бота: ${botInfo.id}`);
    console.log(`👤 Имя: ${botInfo.first_name}`);
    
    // Проверяем группу
    const groupId = process.env.TELEGRAM_GROUP_ID;
    if (groupId) {
      try {
        const chat = await bot.telegram.getChat(groupId);
        console.log(`\n✅ Telegram группа найдена: ${chat.title || chat.id}`);
      } catch (error) {
        console.log(`\n⚠️ Не удалось получить информацию о группе: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Бот работает корректно!');
    console.log('💡 Для запуска бота используйте: node bot.js');
    
  } catch (error) {
    console.error('\n❌ Ошибка подключения к боту:');
    console.error(`   ${error.message}`);
    
    if (error.response) {
      console.error(`   Код ошибки: ${error.response.error_code}`);
      console.error(`   Описание: ${error.response.description}`);
    }
  }
  
  process.exit(0);
}

quickTest();
