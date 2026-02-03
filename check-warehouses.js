/**
 * 📋 Проверка текущих складов в базе данных
 */

const database = require('./database');

async function checkWarehouses() {
    try {
        console.log('📋 Проверка складов в базе данных...\n');
        
        const warehouses = await database.getAllWarehouses();
        
        if (warehouses.length === 0) {
            console.log('❌ Складов не найдено');
            return;
        }
        
        console.log(`✅ Найдено ${warehouses.length} складов:\n`);
        
        warehouses.forEach((w, index) => {
            const whatsappStatus = w.whatsapp_group_id ? '✅ WhatsApp настроен' : '❌ WhatsApp не настроен';
            console.log(`${index + 1}. ${w.name} (ID: ${w.id})`);
            console.log(`   📱 ${whatsappStatus}`);
            if (w.whatsapp_group_id) {
                console.log(`   🆔 Группа: ${w.whatsapp_group_id}`);
            }
            console.log('');
        });
        
        // Проверяем, есть ли склад "Балхи"
        const balkhiWarehouse = warehouses.find(w => 
            w.name.toLowerCase().includes('балхи') || 
            w.name.toLowerCase().includes('balhi') ||
            w.name.toLowerCase().includes('балх')
        );
        
        if (balkhiWarehouse) {
            console.log(`🎯 Склад "Балхи" найден: ${balkhiWarehouse.name}`);
            if (balkhiWarehouse.whatsapp_group_id) {
                console.log(`📱 WhatsApp группа уже настроена: ${balkhiWarehouse.whatsapp_group_id}`);
            } else {
                console.log('⚠️ WhatsApp группа не настроена');
                console.log('\n📝 Команда для настройки:');
                console.log(`/setwhatsapp ${balkhiWarehouse.name} | 120363419535622239@g.us`);
            }
        } else {
            console.log('⚠️ Склад "Балхи" не найден');
            console.log('\n📝 Команды для добавления и настройки:');
            console.log('/addwarehouse Балхи');
            console.log('/setwhatsapp Балхи | 120363419535622239@g.us');
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        database.close();
    }
}

checkWarehouses();