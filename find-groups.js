/**
 * 🔍 Поиск WhatsApp групп по названиям
 */

require('dotenv').config();
const axios = require('axios');

const idInstance = process.env.GREEN_API_INSTANCE_ID;
const apiTokenInstance = process.env.GREEN_API_TOKEN;

// Названия групп, которые ищем
const targetGroups = [
    'точики завод',
    'бахор ойл склад', 
    'толло',
    'точики',
    'бахор',
    'завод',
    'склад'
];

async function findGroups() {
    try {
        console.log('🔍 Поиск WhatsApp групп...\n');
        
        // Получаем список чатов
        const url = `https://api.green-api.com/waInstance${idInstance}/getChats/${apiTokenInstance}`;
        
        const response = await axios.post(url, {
            count: 100
        });
        
        if (!response.data || response.data.length === 0) {
            console.log('❌ Чаты не найдены');
            return;
        }
        
        console.log(`📋 Найдено ${response.data.length} чатов\n`);
        
        const foundGroups = [];
        
        response.data.forEach((chat, index) => {
            const chatId = chat.id;
            const name = chat.name || 'Без названия';
            const isGroup = chatId.includes('@g.us');
            
            if (isGroup) {
                console.log(`${index + 1}. 👥 ${name}`);
                console.log(`   🆔 ${chatId}`);
                
                // Проверяем, содержит ли название искомые слова
                const lowerName = name.toLowerCase();
                const isTarget = targetGroups.some(target => 
                    lowerName.includes(target.toLowerCase())
                );
                
                if (isTarget) {
                    console.log(`   ✅ НАЙДЕНА ЦЕЛЕВАЯ ГРУППА!`);
                    foundGroups.push({ name, chatId });
                }
                
                console.log('');
            }
        });
        
        if (foundGroups.length > 0) {
            console.log('\n🎯 НАЙДЕННЫЕ ЦЕЛЕВЫЕ ГРУППЫ:\n');
            
            foundGroups.forEach((group, index) => {
                console.log(`${index + 1}. ${group.name}`);
                console.log(`   ID: ${group.chatId}`);
                console.log('');
            });
            
            console.log('📝 КОМАНДЫ ДЛЯ НАСТРОЙКИ:\n');
            
            foundGroups.forEach(group => {
                // Определяем название склада
                let warehouseName = group.name;
                const lowerName = group.name.toLowerCase();
                
                if (lowerName.includes('точики')) {
                    warehouseName = 'Точики завод';
                } else if (lowerName.includes('бахор')) {
                    warehouseName = 'Бахор ойл склад';
                } else if (lowerName.includes('толло')) {
                    warehouseName = 'Толло';
                }
                
                console.log(`/setwhatsapp ${warehouseName} | ${group.chatId}`);
            });
            
        } else {
            console.log('\n⚠️ Целевые группы не найдены');
            console.log('\n💡 Возможные причины:');
            console.log('1. Группы имеют другие названия');
            console.log('2. Бот не добавлен в эти группы');
            console.log('3. В группах давно не было сообщений');
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error.response?.data || error.message);
    }
}

// Тестовая отправка сообщения для получения ID группы
async function testSendToKnownGroup() {
    const knownGroupId = process.env.WHATSAPP_GROUP_ID;
    
    if (!knownGroupId) {
        console.log('⚠️ WHATSAPP_GROUP_ID не настроен в .env');
        return;
    }
    
    try {
        console.log(`\n🧪 Тестовая отправка в известную группу: ${knownGroupId}`);
        
        const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
        
        const response = await axios.post(url, {
            chatId: knownGroupId,
            message: '🧪 Тест поиска групп - игнорируйте это сообщение'
        });
        
        if (response.data && response.data.idMessage) {
            console.log('✅ Сообщение отправлено успешно!');
            console.log(`📨 ID сообщения: ${response.data.idMessage}`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка тестовой отправки:', error.response?.data || error.message);
    }
}

async function main() {
    console.log('🚀 Поиск WhatsApp групп для маршрутизации\n');
    
    await findGroups();
    await testSendToKnownGroup();
}

main();