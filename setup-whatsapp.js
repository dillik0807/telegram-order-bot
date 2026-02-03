/**
 * 🔧 Прямая настройка WhatsApp группы для склада ЧБалхи
 */

const database = require('./database');

async function setupWhatsApp() {
    try {
        console.log('🔧 Настройка WhatsApp группы для склада ЧБалхи...\n');
        
        const warehouseName = 'ЧБалхи';
        const whatsappGroupId = '120363419535622239@g.us';
        
        // Обновляем WhatsApp группу для склада
        const updated = await database.updateWarehouseWhatsApp(warehouseName, whatsappGroupId);
        
        if (updated) {
            console.log('✅ WhatsApp группа успешно привязана!');
            console.log(`🏬 Склад: ${warehouseName}`);
            console.log(`📱 WhatsApp группа: ${whatsappGroupId}`);
            console.log(`🎯 Теперь заявки для склада "${warehouseName}" будут отправляться в группу "Бахор ойл склад"!`);
        } else {
            console.log(`❌ Склад "${warehouseName}" не найден`);
        }
        
        // Проверяем результат
        console.log('\n📋 Проверка настроек...');
        const warehouses = await database.getAllWarehouses();
        
        warehouses.forEach((w, index) => {
            const whatsappStatus = w.whatsapp_group_id ? '✅ WhatsApp настроен' : '❌ WhatsApp не настроен';
            console.log(`${index + 1}. ${w.name}`);
            console.log(`   📱 ${whatsappStatus}`);
            if (w.whatsapp_group_id) {
                console.log(`   🆔 Группа: ${w.whatsapp_group_id}`);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        database.close();
    }
}

setupWhatsApp();