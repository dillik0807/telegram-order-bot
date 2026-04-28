/**
 * 🚀 Надежная миграция для Railway
 * Выполняется через прямые SQL команды
 */

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

async function railwayMigration() {
    console.log('🚀 НАДЕЖНАЯ МИГРАЦИЯ RAILWAY\n');
    
    const dbPath = process.env.DB_PATH || './orders.db';
    console.log(`📂 Путь к БД: ${dbPath}`);
    
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Ошибка подключения к БД:', err);
                reject(err);
                return;
            }
            console.log('✅ База данных подключена');
        });
        
        // Выполняем миграцию пошагово
        db.serialize(() => {
            
            // 1. Проверяем структуру таблицы
            console.log('\n📋 Проверка структуры таблицы warehouses...');
            db.all("PRAGMA table_info(warehouses)", (err, columns) => {
                if (err) {
                    console.error('❌ Ошибка получения структуры:', err);
                    db.close();
                    reject(err);
                    return;
                }
                
                console.log('📊 Текущие колонки:');
                columns.forEach(col => {
                    console.log(`   ${col.name} (${col.type})`);
                });
                
                const hasWhatsAppColumn = columns.some(col => col.name === 'whatsapp_group_id');
                console.log(`\n📱 Колонка whatsapp_group_id: ${hasWhatsAppColumn ? '✅ есть' : '❌ нет'}`);
                
                if (!hasWhatsAppColumn) {
                    // 2. Добавляем колонку
                    console.log('\n➕ Добавляем колонку whatsapp_group_id...');
                    db.run("ALTER TABLE warehouses ADD COLUMN whatsapp_group_id TEXT", (err) => {
                        if (err) {
                            console.error('❌ Ошибка добавления колонки:', err);
                            db.close();
                            reject(err);
                            return;
                        }
                        console.log('✅ Колонка whatsapp_group_id добавлена!');
                        setupRouting();
                    });
                } else {
                    setupRouting();
                }
                
                function setupRouting() {
                    // 3. Настраиваем маршрутизацию
                    console.log('\n🎯 Настройка маршрутизации...');
                    
                    // Сначала проверяем текущие склады
                    db.all("SELECT * FROM warehouses WHERE is_active = 1", (err, warehouses) => {
                        if (err) {
                            console.error('❌ Ошибка получения складов:', err);
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        console.log('\n📦 Текущие склады:');
                        warehouses.forEach((w, index) => {
                            console.log(`${index + 1}. ${w.name} (ID: ${w.id})`);
                        });
                        
                        // Настраиваем ЧБалхи
                        const balkhiWarehouse = warehouses.find(w => w.name === 'ЧБалхи');
                        if (balkhiWarehouse) {
                            db.run(
                                "UPDATE warehouses SET whatsapp_group_id = ? WHERE id = ?",
                                ['120363419535622239@g.us', balkhiWarehouse.id],
                                function(err) {
                                    if (err) {
                                        console.error('❌ Ошибка настройки ЧБалхи:', err);
                                    } else {
                                        console.log(`✅ ЧБалхи (ID: ${balkhiWarehouse.id}) → Бахор ойл склад`);
                                    }
                                    setupZavod();
                                }
                            );
                        } else {
                            console.log('⚠️ Склад ЧБалхи не найден');
                            setupZavod();
                        }
                        
                        function setupZavod() {
                            // Настраиваем ЗаводТЧ
                            const zavodWarehouse = warehouses.find(w => w.name === 'ЗаводТЧ');
                            if (zavodWarehouse) {
                                db.run(
                                    "UPDATE warehouses SET whatsapp_group_id = ? WHERE id = ?",
                                    ['120363422710745455@g.us', zavodWarehouse.id],
                                    function(err) {
                                        if (err) {
                                            console.error('❌ Ошибка настройки ЗаvodТЧ:', err);
                                        } else {
                                            console.log(`✅ ЗаводТЧ (ID: ${zavodWarehouse.id}) → точик азод`);
                                        }
                                        finalizeMigration();
                                    }
                                );
                            } else {
                                // Добавляем ЗаводТЧ если не существует
                                console.log('➕ Добавляем склад ЗаводТЧ...');
                                db.run(
                                    "INSERT INTO warehouses (name, whatsapp_group_id, is_active) VALUES (?, ?, 1)",
                                    ['ЗаводТЧ', '120363422710745455@g.us'],
                                    function(err) {
                                        if (err) {
                                            console.error('❌ Ошибка добавления ЗаводТЧ:', err);
                                        } else {
                                            console.log(`✅ ЗаводТЧ добавлен (ID: ${this.lastID}) → точик азод`);
                                        }
                                        finalizeMigration();
                                    }
                                );
                            }
                        }
                        
                        function finalizeMigration() {
                            // 4. Финальная проверка
                            console.log('\n📋 Финальная проверка:');
                            db.all("SELECT * FROM warehouses WHERE is_active = 1", (err, finalWarehouses) => {
                                if (err) {
                                    console.error('❌ Ошибка финальной проверки:', err);
                                } else {
                                    finalWarehouses.forEach((w, index) => {
                                        const status = w.whatsapp_group_id ? '✅ настроен' : '❌ не настроен';
                                        console.log(`${index + 1}. ${w.name} - ${status}`);
                                        if (w.whatsapp_group_id) {
                                            console.log(`   📱 ${w.whatsapp_group_id}`);
                                        }
                                    });
                                }
                                
                                console.log('\n🎉 МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');
                                console.log('🎯 Маршрутизация настроена:');
                                console.log('   • ЧБалхи → Бахор ойл склад (120363419535622239@g.us)');
                                console.log('   • ЗаводТЧ → точик азод (120363422710745455@g.us)');
                                
                                db.close();
                                resolve(true);
                            });
                        }
                    });
                }
            });
        });
    });
}

// Экспортируем функцию
module.exports = { railwayMigration };

// Запускаем если вызван напрямую
if (require.main === module) {
    railwayMigration()
        .then(() => {
            console.log('\n✅ Миграция выполнена успешно!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Ошибка миграции:', error);
            process.exit(1);
        });
}