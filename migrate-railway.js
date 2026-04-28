/**
 * 🚀 Миграция базы данных для Railway
 * Добавляет колонку whatsapp_group_id и настраивает маршрутизацию
 */

const database = require('./database');

async function migrateRailway() {
    try {
        console.log('🚀 Миграция базы данных Railway...\n');
        
        // Проверяем, нужна ли миграция
        try {
            const warehouses = await database.getAllWarehouses();
            console.log('✅ Таблица warehouses доступна');
            
            // Пробуем получить WhatsApp группу (проверяем наличие колонки)
            const testWarehouse = warehouses[0];
            if (testWarehouse) {
                await database.getWarehouseWhatsApp(testWarehouse.name);
                console.log('✅ Колонка whatsapp_group_id уже существует');
            }
            
        } catch (error) {
            if (error.message.includes('no such column: whatsapp_group_id')) {
                console.log('⚠️ Колонка whatsapp_group_id не найдена, добавляем...');
                
                // Добавляем колонку через SQL
                const sqlite3 = require('sqlite3').verbose();
                const dbPath = process.env.DB_PATH || './orders.db';
                
                const db = new sqlite3.Database(dbPath);
                
                await new Promise((resolve, reject) => {
                    db.run("ALTER TABLE warehouses ADD COLUMN whatsapp_group_id TEXT", (err) => {
                        if (err) {
                            console.error('❌ Ошибка добавления колонки:', err);
                            reject(err);
                        } else {
                            console.log('✅ Колонка whatsapp_group_id добавлена!');
                            resolve();
                        }
                    });
                });
                
                db.close();
            } else {
                throw error;
            }
        }
        
        // Настраиваем маршрутизацию для складов
        console.log('\n🔧 Настройка маршрутизации...');
        
        // ЧБалхи → Бахор ойл склад
        const balkhiUpdated = await database.updateWarehouseWhatsApp('ЧБалхи', '120363419535622239@g.us');
        if (balkhiUpdated) {
            console.log('✅ Склад "ЧБалхи" привязан к группе "Бахор ойл склад"');
        } else {
            console.log('⚠️ Склад "ЧБалхи" не найден');
        }
        
        // ЗаводТЧ → точик азод
        let zavodUpdated = false;
        try {
            zavodUpdated = await database.updateWarehouseWhatsApp('ЗаводТЧ', '120363422710745455@g.us');
        } catch (error) {
            console.log('⚠️ Склад "ЗаводТЧ" не найден, добавляем...');
        }
        
        if (!zavodUpdated) {
            try {
                const warehouseId = await database.addWarehouse('ЗаводТЧ', '120363422710745455@g.us');
                console.log(`✅ Склад "ЗаводТЧ" добавлен и привязан к группе "точик азод"`);
            } catch (error) {
                console.log('⚠️ Ошибка добавления склада ЗаводТЧ:', error.message);
            }
        } else {
            console.log('✅ Склад "ЗаводТЧ" привязан к группе "точик азод"');
        }
        
        // Показываем итоговые настройки
        console.log('\n📋 Итоговые настройки складов:');
        const warehouses = await database.getAllWarehouses();
        
        warehouses.forEach((w, index) => {
            const status = w.whatsapp_group_id ? '✅ WhatsApp настроен' : '❌ WhatsApp не настроен';
            console.log(`${index + 1}. ${w.name} - ${status}`);
            if (w.whatsapp_group_id) {
                console.log(`   📱 Группа: ${w.whatsapp_group_id}`);
            }
        });
        
        console.log('\n🎉 Миграция завершена успешно!');
        console.log('🎯 Настроена маршрутизация:');
        console.log('   • ЧБалхи → "Бахор ойл склад"');
        console.log('   • ЗаводТЧ → "точик азод"');
        
    } catch (error) {
        console.error('❌ Ошибка миграции:', error);
    } finally {
        database.close();
    }
}

// Запускаем миграцию только если скрипт вызван напрямую
if (require.main === module) {
    migrateRailway();
}

module.exports = { migrateRailway };