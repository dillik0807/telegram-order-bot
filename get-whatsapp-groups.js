/**
 * 📱 Скрипт для получения ID WhatsApp групп через Green-API
 */

require('dotenv').config();
const axios = require('axios');

const idInstance = process.env.GREEN_API_INSTANCE_ID;
const apiTokenInstance = process.env.GREEN_API_TOKEN;

if (!idInstance || !apiTokenInstance) {
    console.error('❌ GREEN_API_INSTANCE_ID или GREEN_API_TOKEN не настроены в .env');
    process.exit(1);
}

// Получить список чатов
async function getChats() {
    try {
        const url = `https://api.green-api.com/waInstance${idInstance}/getChats/${apiTokenInstance}`;
        
        console.log('📡 Получаем список чатов из Green-API...');
        
        const response = await axios.post(url, {
            count: 100 // Получить последние 100 чатов
        });
        
        if (response.data && response.data.length > 0) {
            console.log('\n📋 Найденные чаты:\n');
            
            const groups = [];
            
            response.data.forEach((chat, index) => {
                const chatId = chat.id;
                const name = chat.name || 'Без названия';
                const isGroup = chatId.includes('@g.us');
                
                if (isGroup) {
                    groups.push({ name, chatId });
                    console.log(`${index + 1}. 👥 ГРУППА: ${name}`);
                    console.log(`   🆔 ID: ${chatId}`);
                    console.log('');
                }
            });
            
            if (groups.length > 0) {
                console.log('\n🎯 Команды для настройки маршрутизации:\n');
                
                groups.forEach(group => {
                    // Пытаемся угадать название склада по названию группы
                    let warehouseName = group.name;
                    
                    if (group.name.toLowerCase().includes('точики')) {
                        warehouseName = 'Точики завод';
                    } else if (group.name.toLowerCase().includes('бахор')) {
                        warehouseName = 'Бахор ойл склад';
                    } else if (group.name.toLowerCase().includes('толло')) {
                        warehouseName = 'Толло';
                    }
                    
                    console.log(`/setwhatsapp ${warehouseName} | ${group.chatId}`);
                });
                
                console.log('\n💡 Скопируйте нужные команды и отправьте их боту!');
            } else {
                console.log('❌ Групп не найдено');
            }
            
        } else {
            console.log('❌ Чаты не найдены');
        }
        
    } catch (error) {
        console.error('❌ Ошибка получения чатов:', error.response?.data || error.message);
    }
}

// Получить информацию об аккаунте
async function getAccountInfo() {
    try {
        const url = `https://api.green-api.com/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`;
        
        const response = await axios.get(url);
        
        console.log('📱 Статус Green-API:', response.data.stateInstance);
        
        if (response.data.stateInstance !== 'authorized') {
            console.log('⚠️ Green-API не авторизован! Проверьте QR код в панели.');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка проверки статуса:', error.response?.data || error.message);
        return false;
    }
}

// Основная функция
async function main() {
    console.log('🚀 Получение ID WhatsApp групп через Green-API\n');
    
    // Проверяем статус
    const isAuthorized = await getAccountInfo();
    
    if (!isAuthorized) {
        console.log('\n❌ Сначала авторизуйте Green-API в панели управления');
        return;
    }
    
    // Получаем чаты
    await getChats();
}

main();