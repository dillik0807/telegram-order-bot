/**
 * 🔧 Добавление колонки whatsapp_group_id в таблицу warehouses
 */

const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DB_PATH || './orders.db';

function addWhatsAppColumn() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Ошибка подключения к БД:', err);
                reject(err);
                return;
            }
            console.log('✅ База данных подключена');
        });

        console.log('🔧 Добавление колонки whatsapp_group_id в таблицу warehouses...');

        // Проверяем, существует ли уже колонка
        db.all("PRAGMA table_info(warehouses)", (err, columns) => {
            if (err) {
                console.error('❌ Ошибка получения информации о таблице:', err);
                db.close();
                reject(err);
                return;
            }

            const hasWhatsAppColumn = columns.some(col => col.name === 'whatsapp_group_id');

            if (hasWhatsAppColumn) {
                console.log('✅ Колонка whatsapp_group_id уже существует');
                db.close();
                resolve(true);
                return;
            }

            // Добавляем колонку
            db.run("ALTER TABLE warehouses ADD COLUMN whatsapp_group_id TEXT", (err) => {
                if (err) {
                    console.error('❌ Ошибка добавления колонки:', err);
                    db.close();
                    reject(err);
                    return;
                }

                console.log('✅ Колонка whatsapp_group_id успешно добавлена!');

                // Проверяем результат
                db.all("SELECT * FROM warehouses", (err, rows) => {
                    if (err) {
                        console.error('❌ Ошибка проверки:', err);
                    } else {
                        console.log('\n📋 Текущие склады:');
                        rows.forEach((row, index) => {
                            console.log(`${index + 1}. ${row.name} (ID: ${row.id})`);
                            console.log(`   📱 WhatsApp: ${row.whatsapp_group_id || 'не настроен'}`);
                        });
                    }

                    db.close();
                    resolve(true);
                });
            });
        });
    });
}

addWhatsAppColumn()
    .then(() => {
        console.log('\n🎉 Миграция завершена! Теперь можно настраивать WhatsApp группы.');
    })
    .catch((error) => {
        console.error('❌ Ошибка миграции:', error);
    });