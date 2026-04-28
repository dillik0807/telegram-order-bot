/**
 * 🧪 Тест маршрутизации WhatsApp
 */

require('dotenv').config();
const database = require('./database');

async function testRouting() {
    try {
        console.log('🧪 Тест маршрутизации WhatsApp\n');
        
        // Тестируем каждый склад
        const testWarehouses = ['ЧБалхи', 'ЗаводТЧ', 'Регар', 'Хисор', 'Сугд'];
        
        for (const warehouse of testWarehouses) {
            console.log(`🔍 Тестируем склад: ${warehouse}`);
            
            try {
                const whatsappGroup = await database.getWarehouseWhatsApp(warehouse);
                
                if (whatsappGroup) {
                    console.log(`✅ ${warehouse} → ${whatsappGroup}`);
                    
                    // Определяем название группы
                    if (whatsappGroup === '120363419535622239@g.us') {
                        console.log(`   📝 Группа: "Бахор ойл склад"`);
                    } else if (whatsappGroup === '120363422710745455@g.us') {
                        console.log(`   📝 Группа: "точик азод"`);
                    } else {
                        console.log(`   📝 Группа: неизвестная`);
                    }
                } else {
                    console.log(`❌ ${warehouse} → общая группа (не настроен)`);
                }
            } catch (error) {
                console.log(`❌ ${warehouse} → ОШИБКА: ${error.message}`);
            }
            
            console.log('');
        }
        
        // Проверяем переменные окружения
        console.log('🔧 Переменные окружения:');
        console.log(`WHATSAPP_GROUP_ID: ${process.env.WHATSAPP_GROUP_ID || 'НЕ УСТАНОВЛЕН'}`);
        console.log(`GREEN_API_INSTANCE_ID: ${process.env.GREEN_API_INSTANCE_ID || 'НЕ УСТАНОВЛЕН'}`);
        
        console.log('\n🎯 Ожидаемое поведение:');
        console.log('• ЧБалхи → "Бахор ойл склад"');
        console.log('• ЗаводТЧ → "точик азод"');
        console.log('• Остальные → общая группа');
        
    } catch (error) {
        console.error('❌ Ошибка теста:', error);
    } finally {
        database.close();
    }
}

testRouting();