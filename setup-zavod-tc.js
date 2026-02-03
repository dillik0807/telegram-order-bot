/**
 * 🔧 Настройка маршрутизации для склада ЗаводТЧ
 */

const database = require('./database');

async function setupZavodTC() {
    try {
        console.log('🔧 Настройка маршрутизации для склада ЗаводТЧ...\n');
        
        // Проверяем текущие склады
        const warehouses = await database.getAllWarehouses();
        console.log('📋 Текущие склады:');
        warehouses.forEach((w, index) => {
            console.log(`${index + 1}. ${w.name} (ID: ${w.id})`);
        });
        
        // Ищем склад ЗаводТЧ
        const zavodWarehouse = warehouses.find(w => 
            w.name.toLowerCase().includes('заводтч') || 
            w.name.toLowerCase().includes('завод') ||
            w.name.toLowerCase().includes('тч') ||
            w.name === 'ЗаводТЧ'
        );
        
        if (zavodWarehouse) {
            console.log(`\n✅ Склад найден: ${zavodWarehouse.name}`);
            
            // Настраиваем WhatsApp группу
            const updated = await database.updateWarehouseWhatsApp(zavodWarehouse.name, '120363422710745455@g.us');
            
            if (updated) {
                console.log('✅ WhatsApp группа успешно привязана!');
                console.log(`🏬 Склад: ${zavodWarehouse.name}`);
                console.log(`📱 WhatsApp группа: 120363422710745455@g.us (точик азод)`);
            }
        } else {
            console.log('\n⚠️ Склад "ЗаводТЧ" не найден');
            console.log('📝 Добавляем склад...');
            
            // Добавляем склад
            const warehouseId = await database.addWarehouse('ЗаводТЧ', '120363422710745455@g.us');
            console.log(`✅ Склад "ЗаводТЧ" добавлен с ID: ${warehouseId}`);
            console.log(`📱 WhatsApp группа: 120363422710745455@g.us (точик азод)`);
        }
        
        // Показываем итоговые настройки
        console.log('\n📋 Итоговые настройки всех складов:');
        const updatedWarehouses = await database.getAllWarehouses();
        
        updatedWarehouses.forEach((w, index) => {
            const status = w.whatsapp_group_id ? '✅ WhatsApp настроен' : '❌ WhatsApp не настроен';
            console.log(`${index + 1}. ${w.name} - ${status}`);
            if (w.whatsapp_group_id) {
                console.log(`   📱 Группа: ${w.whatsapp_group_id}`);
                
                // Определяем название группы
                if (w.whatsapp_group_id === '120363419535622239@g.us') {
                    console.log(`   📝 Название: "Бахор ойл склад"`);
                } else if (w.whatsapp_group_id === '120363422710745455@g.us') {
                    console.log(`   📝 Название: "точик азод"`);
                }
            }
            console.log('');
        });
        
        console.log('🎯 Настройка завершена!');
        console.log('📦 Теперь заявки будут маршрутизироваться:');
        console.log('   • ЧБалхи → "Бахор ойл склад"');
        console.log('   • ЗаводТЧ → "точик азод"');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        database.close();
    }
}

setupZavodTC();