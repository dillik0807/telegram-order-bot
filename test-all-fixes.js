/**
 * 🧪 Комплексный тест всех исправлений
 * 
 * Проверяет:
 * 1. Умную маршрутизацию WhatsApp
 * 2. Команды добавления складов и товаров
 * 3. Автоматическое обновление данных
 * 4. Работу с дубликатами
 */

require('dotenv').config();
const database = require('./database');
const dataManager = require('./data-manager');

async function testAllFixes() {
    console.log('🧪 КОМПЛЕКСНЫЙ ТЕСТ ВСЕХ ИСПРАВЛЕНИЙ\n');
    
    let testsPassed = 0;
    let testsTotal = 0;
    
    function runTest(testName, testFunction) {
        return new Promise(async (resolve) => {
            testsTotal++;
            console.log(`🔍 Тест ${testsTotal}: ${testName}`);
            
            try {
                const result = await testFunction();
                if (result) {
                    console.log('✅ ПРОЙДЕН\n');
                    testsPassed++;
                } else {
                    console.log('❌ НЕ ПРОЙДЕН\n');
                }
            } catch (error) {
                console.log(`❌ ОШИБКА: ${error.message}\n`);
            }
            
            resolve();
        });
    }
    
    try {
        // ========================================
        // ТЕСТ 1: Проверка структуры базы данных
        // ========================================
        
        await runTest('Проверка структуры базы данных', async () => {
            const sqlite3 = require('sqlite3').verbose();
            const dbPath = process.env.DB_PATH || './orders.db';
            
            return new Promise((resolve) => {
                const db = new sqlite3.Database(dbPath);
                
                db.all("PRAGMA table_info(warehouses)", (err, columns) => {
                    db.close();
                    
                    if (err) {
                        console.log(`   ❌ Ошибка: ${err.message}`);
                        resolve(false);
                        return;
                    }
                    
                    const hasWhatsAppColumn = columns.some(col => col.name === 'whatsapp_group_id');
                    
                    if (hasWhatsAppColumn) {
                        console.log('   ✅ Колонка whatsapp_group_id существует');
                        resolve(true);
                    } else {
                        console.log('   ❌ Колонка whatsapp_group_id отсутствует');
                        resolve(false);
                    }
                });
            });
        });
        
        // ========================================
        // ТЕСТ 2: Умная маршрутизация WhatsApp
        // ========================================
        
        await runTest('Умная маршрутизация WhatsApp', async () => {
            // Проверяем настройку маршрутизации для ЧБалхи
            const balkhiGroup = await database.getWarehouseWhatsApp('ЧБалхи');
            const expectedBalkhiGroup = '120363419535622239@g.us';
            
            if (balkhiGroup === expectedBalkhiGroup) {
                console.log('   ✅ ЧБалхи → Бахор ойл склад');
            } else {
                console.log(`   ❌ ЧБалхи: ожидалось ${expectedBalkhiGroup}, получено ${balkhiGroup}`);
                return false;
            }
            
            // Проверяем настройку маршрутизации для ЗаводТЧ
            const zavodGroup = await database.getWarehouseWhatsApp('ЗаводТЧ');
            const expectedZavodGroup = '120363422710745455@g.us';
            
            if (zavodGroup === expectedZavodGroup) {
                console.log('   ✅ ЗаводТЧ → точик азод');
                return true;
            } else {
                console.log(`   ❌ ЗаводТЧ: ожидалось ${expectedZavodGroup}, получено ${zavodGroup}`);
                return false;
            }
        });
        
        // ========================================
        // ТЕСТ 3: Добавление склада без дубликатов
        // ========================================
        
        await runTest('Добавление склада без дубликатов', async () => {
            const testWarehouseName = `Тест склад ${Date.now()}`;
            
            // Добавляем склад первый раз
            const warehouseId1 = await database.addWarehouse(testWarehouseName, null);
            console.log(`   ✅ Склад добавлен с ID: ${warehouseId1}`);
            
            // Пытаемся добавить дубликат
            try {
                await database.addWarehouse(testWarehouseName, null);
                console.log('   ❌ Дубликат был добавлен (не должен был)');
                return false;
            } catch (error) {
                if (error.code === 'SQLITE_CONSTRAINT') {
                    console.log('   ✅ Дубликат корректно отклонен');
                } else {
                    console.log(`   ❌ Неожиданная ошибка: ${error.message}`);
                    return false;
                }
            }
            
            // Удаляем тестовый склад
            await database.removeWarehouse(warehouseId1);
            console.log('   ✅ Тестовый склад удален');
            
            return true;
        });
        
        // ========================================
        // ТЕСТ 4: Добавление товара без дубликатов
        // ========================================
        
        await runTest('Добавление товара без дубликатов', async () => {
            const testProductName = `Тест товар ${Date.now()}`;
            
            // Добавляем товар первый раз
            const productId1 = await database.addProduct(testProductName);
            console.log(`   ✅ Товар добавлен с ID: ${productId1}`);
            
            // Пытаемся добавить дубликат
            try {
                await database.addProduct(testProductName);
                console.log('   ❌ Дубликат был добавлен (не должен был)');
                return false;
            } catch (error) {
                if (error.code === 'SQLITE_CONSTRAINT') {
                    console.log('   ✅ Дубликат корректно отклонен');
                } else {
                    console.log(`   ❌ Неожиданная ошибка: ${error.message}`);
                    return false;
                }
            }
            
            // Удаляем тестовый товар
            await database.removeProduct(productId1);
            console.log('   ✅ Тестовый товар удален');
            
            return true;
        });
        
        // ========================================
        // ТЕСТ 5: Автоматическое обновление данных
        // ========================================
        
        await runTest('Автоматическое обновление данных', async () => {
            // Получаем текущее количество складов и товаров
            const warehousesBefore = await database.getAllWarehouses();
            const productsBefore = await database.getAllProducts();
            
            console.log(`   📊 До обновления: складов ${warehousesBefore.length}, товаров ${productsBefore.length}`);
            
            // Загружаем данные через dataManager
            await dataManager.loadWarehousesAndProducts();
            
            // Проверяем, что данные загружены в память
            const currentData = dataManager.getCurrentData();
            
            console.log(`   📊 После обновления: складов ${currentData.warehouses.length}, товаров ${currentData.products.length}`);
            
            // Проверяем, что количество совпадает
            if (currentData.warehouses.length >= warehousesBefore.length && 
                currentData.products.length >= productsBefore.length) {
                console.log('   ✅ Данные корректно загружены в память');
                return true;
            } else {
                console.log('   ❌ Данные в памяти не соответствуют БД');
                return false;
            }
        });
        
        // ========================================
        // ТЕСТ 6: Функция reloadWarehousesAndProducts
        // ========================================
        
        await runTest('Функция принудительного обновления', async () => {
            // Добавляем тестовый склад
            const testWarehouseName = `Тест обновление ${Date.now()}`;
            const warehouseId = await database.addWarehouse(testWarehouseName, null);
            
            // Обновляем данные через dataManager
            await dataManager.loadWarehousesAndProducts();
            
            // Проверяем, что новый склад появился в памяти
            const currentData = dataManager.getCurrentData();
            const foundWarehouse = currentData.warehouses.includes(testWarehouseName);
            
            if (foundWarehouse) {
                console.log('   ✅ Новый склад появился в памяти после обновления');
            } else {
                console.log('   ❌ Новый склад не найден в памяти');
                return false;
            }
            
            // Удаляем тестовый склад
            await database.removeWarehouse(warehouseId);
            
            // Снова обновляем данные
            await dataManager.loadWarehousesAndProducts();
            
            // Проверяем, что склад исчез из памяти
            const updatedData = dataManager.getCurrentData();
            const stillFound = updatedData.warehouses.includes(testWarehouseName);
            
            if (!stillFound) {
                console.log('   ✅ Удаленный склад исчез из памяти после обновления');
                return true;
            } else {
                console.log('   ❌ Удаленный склад все еще в памяти');
                return false;
            }
        });
        
        // ========================================
        // ТЕСТ 7: Проверка админских команд
        // ========================================
        
        await runTest('Проверка админских функций', async () => {
            const adminId = 5889669586;
            
            // Проверяем, что админ определяется корректно
            const admin = require('./admin');
            const isAdminResult = admin.isAdmin(adminId);
            
            if (isAdminResult) {
                console.log(`   ✅ Админ ${adminId} корректно определен`);
            } else {
                console.log(`   ❌ Админ ${adminId} не определен`);
                return false;
            }
            
            // Проверяем получение статистики
            const stats = await database.getStats();
            
            if (typeof stats.totalClients === 'number' && 
                typeof stats.totalOrders === 'number') {
                console.log(`   ✅ Статистика получена: ${stats.totalClients} клиентов, ${stats.totalOrders} заявок`);
                return true;
            } else {
                console.log('   ❌ Ошибка получения статистики');
                return false;
            }
        });
        
        // ========================================
        // ИТОГОВЫЙ ОТЧЕТ
        // ========================================
        
        console.log('📊 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ');
        console.log('=' .repeat(50));
        console.log(`✅ Пройдено тестов: ${testsPassed}`);
        console.log(`❌ Не пройдено тестов: ${testsTotal - testsPassed}`);
        console.log(`📊 Общий результат: ${testsPassed}/${testsTotal}`);
        
        const successRate = (testsPassed / testsTotal * 100).toFixed(1);
        console.log(`📈 Процент успеха: ${successRate}%`);
        
        if (testsPassed === testsTotal) {
            console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
            console.log('🚀 Система готова к работе на Railway!');
        } else {
            console.log('\n⚠️ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ');
            console.log('🔧 Требуется дополнительная настройка');
        }
        
        // Дополнительная информация
        console.log('\n📋 ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:');
        
        const warehouses = await database.getAllWarehouses();
        const products = await database.getAllProducts();
        const clients = await database.getAllClients();
        
        console.log(`🏬 Складов в БД: ${warehouses.length}`);
        console.log(`🛒 Товаров в БД: ${products.length}`);
        console.log(`👥 Клиентов в БД: ${clients.length}`);
        
        const warehousesWithWhatsApp = warehouses.filter(w => w.whatsapp_group_id);
        console.log(`📱 Складов с WhatsApp: ${warehousesWithWhatsApp.length}`);
        
        console.log('\n🎯 НАСТРОЕННЫЕ МАРШРУТЫ:');
        for (const warehouse of warehousesWithWhatsApp) {
            console.log(`   ${warehouse.name} → ${warehouse.whatsapp_group_id}`);
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка при тестировании:', error);
    } finally {
        database.close();
    }
}

// Запускаем тесты
testAllFixes();