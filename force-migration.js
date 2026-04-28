/**
 * 🔧 Принудительная миграция для Railway
 * Запускается отдельно для принудительного обновления БД
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

async function forceMigration() {
    console.log('🔧 ПРИНУДИТЕЛЬНАЯ МИГРАЦИЯ RAILWAY\n');
    
    const dbPath = process.env.DB_PATH || './orders.db';
    console.log(`📂 Путь к БД: ${dbPath}`);
    
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Ошибка подключения к БД:', err);
            return;
        }
        console.log('✅ База данных подключена');
    });
    
    try {
        // 1. Проверяем структуру таблицы
        console.log('\n📋 Проверка структуры таблицы...');
        const columns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(warehouses)", (err, cols) => {
                if (err) reject(err);
                else resolve(cols);
            });
        });
        
        const hasWhatsAppColumn = columns.some(col => col.name === 'whatsapp_group_id');
        console.log(`📱 Колонка whatsapp_group_id: ${hasWhatsAppColumn ? '✅ есть' : '❌ нет'}`);
        
        // 2. Добавляем колонку если нет
        if (!hasWhatsAppColumn) {
            console.log('➕ Добавляем колонку whatsapp_group_id...');
            await new Promise((resolve, reject) => {
                db.run("ALTER TABLE warehouses ADD COLUMN whatsapp_group_id TEXT", (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log('✅ Колонка добавлена!');
        }
        
        // 3. Проверяем текущие склады
        console.log('\n📦 Текущие склады:');
        const warehouses = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM warehouses WHERE is_active = 1", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        warehouses.forEach((w, index) => {
            console.log(`${index + 1}. ${w.name} (ID: ${w.id}) - WhatsApp: ${w.whatsapp_group_id || 'не настроен'}`);
        });
        
        // 4. Настраиваем маршрутизацию
        console.log('\n🔧 Настройка маршрутизации...');
        
        // ЧБалхи → Бахор ойл склад
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE warehouses SET whatsapp_group_id = ? WHERE name = ? AND is_active = 1",
                ['120363419535622239@g.us', 'ЧБалхи'],
                function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`✅ ЧБалхи → Бахор ойл склад (обновлено строк: ${this.changes})`);
                        resolve();
                    }
                }
            );
        });
        
        // Проверяем, есть ли ЗаводТЧ
        const zavodExists = warehouses.some(w => w.name === 'ЗаводТЧ');
        
        if (zavodExists) {
            // Обновляем существующий
            await new Promise((resolve, reject) => {
                db.run(
                    "UPDATE warehouses SET whatsapp_group_id = ? WHERE name = ? AND is_active = 1",
                    ['120363422710745455@g.us', 'ЗаводТЧ'],
                    function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`✅ ЗаводТЧ → точик азод (обновлено строк: ${this.changes})`);
                            resolve();
                        }
                    }
                );
            });
        } else {
            // Добавляем новый
            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT INTO warehouses (name, whatsapp_group_id, is_active) VALUES (?, ?, 1)",
                    ['ЗаводТЧ', '120363422710745455@g.us'],
                    function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`✅ ЗаводТЧ добавлен → точик азод (ID: ${this.lastID})`);
                            resolve();
                        }
                    }
                );
            });
        }
        
        // 5. Финальная проверка
        console.log('\n📋 Финальная проверка:');
        const finalWarehouses = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM warehouses WHERE is_active = 1", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        finalWarehouses.forEach((w, index) => {
            const status = w.whatsapp_group_id ? '✅ настроен' : '❌ не настроен';
            console.log(`${index + 1}. ${w.name} - ${status}`);
            if (w.whatsapp_group_id) {
                console.log(`   📱 ${w.whatsapp_group_id}`);
            }
        });
        
        console.log('\n🎉 ПРИНУДИТЕЛЬНАЯ МИГРАЦИЯ ЗАВЕРШЕНА!');
        console.log('🎯 Маршрутизация настроена:');
        console.log('   • ЧБалхи → Бахор ойл склад');
        console.log('   • ЗаводТЧ → точик азод');
        
    } catch (error) {
        console.error('❌ Ошибка миграции:', error);
    } finally {
        db.close();
    }
}

forceMigration();