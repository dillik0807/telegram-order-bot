/**
 * 🔍 Отладка Railway - проверка маршрутизации
 */

const database = require('./database');

async function debugRailway() {
    try {
        console.log('🔍 Отладка Railway - проверка маршрутизации\n');
        
        // Проверяем структуру таблицы warehouses
        console.log('📋 Проверка структуры таблицы warehouses...');
        
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = process.env.DB_PATH || './orders.db';
        
        const db = new sqlite3.Database(dbPath);
        
        // Получаем структуру таблицы
        await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(warehouses)", (err, columns) => {
                if (err) {
                    console.error('❌ Ошибка:', err);
                    reject(err);
                    return;
                }
                
                console.log('📊 Колонки таблицы warehouses:');
                columns.forEach(col => {
                    console.log(`   ${col.name} (${col.type})`);
                });
                
                const hasWhatsAppColumn = columns.some(col => col.name === 'whatsapp_group_id');
                console.log(`\n📱 Колонка whatsapp_group_id: ${hasWhatsAppColumn ? '✅ есть' : '❌ нет'}`);
                
                resolve();
            });
        });
        
        db.close();
        
        // Проверяем склады через database.js
        console.log('\n📦 Проверка складов через database.js...');
        const warehouses = await database.getAllWarehouses();
        
        console.log(`✅ Найдено ${warehouses.length} складов:`);
        warehouses.forEach((w, index) => {
            console.log(`${index + 1}. ${w.name} (ID: ${w.id})`);
            console.log(`   📱 WhatsApp: ${w.whatsapp_group_id || 'не настроен'}`);
        });
        
        // Тестируем функцию getWarehouseWhatsApp
        console.log('\n🧪 Тестирование функции getWarehouseWhatsApp...');
        
        for (const warehouse of warehouses) {
            try {
                const whatsappGroup = await database.getWarehouseWhatsApp(warehouse.name);
                console.log(`📱 ${warehouse.name}: ${whatsappGroup || 'не настроен'}`);
            } catch (error) {
                console.log(`❌ ${warehouse.name}: ошибка - ${error.message}`);
            }
        }
        
        // Проверяем переменные окружения
        console.log('\n🔧 Переменные окружения:');
        console.log(`WHATSAPP_GROUP_ID: ${process.env.WHATSAPP_GROUP_ID || 'не установлен'}`);
        console.log(`GREEN_API_INSTANCE_ID: ${process.env.GREEN_API_INSTANCE_ID || 'не установлен'}`);
        console.log(`GREEN_API_TOKEN: ${process.env.GREEN_API_TOKEN ? 'установлен' : 'не установлен'}`);
        
        console.log('\n🎯 Рекомендации:');
        console.log('1. Убедись, что код задеплоен на Railway');
        console.log('2. Проверь логи Railway на наличие миграции');
        console.log('3. Если миграция не выполнилась, перезапусти сервис');
        
    } catch (error) {
        console.error('❌ Ошибка отладки:', error);
    } finally {
        database.close();
    }
}

debugRailway();