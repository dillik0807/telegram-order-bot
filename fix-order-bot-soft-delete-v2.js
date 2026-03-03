/**
 * 🗑️ Система мягкого удаления для Telegram Order Bot
 * Версия: 2.0 (исправленная)
 * Дата: 03.03.2026
 */

console.log('🗑️ Загрузка системы мягкого удаления для Order Bot v2...');

/**
 * Исправления для базы данных SQLite
 */
function fixDatabaseSoftDelete() {
    console.log('🗑️ Применение системы мягкого удаления к базе данных...');
    
    try {
        // Получаем экземпляр базы данных
        const database = require('./database');
        
        // Проверяем что database существует
        if (!database || !database.db) {
            console.error('❌ База данных не инициализирована');
            return false;
        }
        
        // Добавляем методы мягкого удаления напрямую к экземпляру
        database.softDeleteOrder = function(orderId, deletedBy = 'admin') {
            return new Promise((resolve, reject) => {
                const query = `
                    UPDATE orders 
                    SET is_deleted = 1, 
                        deleted_at = datetime('now'), 
                        deleted_by = ?
                    WHERE id = ?
                `;
                
                this.db.run(query, [deletedBy, orderId], function(err) {
                    if (err) {
                        console.error('❌ Ошибка мягкого удаления заявки:', err);
                        reject(err);
                    } else {
                        console.log(`✅ Заявка ${orderId} помечена как удаленная`);
                        resolve({ changes: this.changes });
                    }
                });
            });
        };
        
        // Восстановление из корзины
        database.restoreOrder = function(orderId, restoredBy = 'admin') {
            return new Promise((resolve, reject) => {
                const query = `
                    UPDATE orders 
                    SET is_deleted = 0, 
                        deleted_at = NULL, 
                        deleted_by = NULL,
                        restored_at = datetime('now'),
                        restored_by = ?
                    WHERE id = ?
                `;
                
                this.db.run(query, [restoredBy, orderId], function(err) {
                    if (err) {
                        console.error('❌ Ошибка восстановления заявки:', err);
                        reject(err);
                    } else {
                        console.log(`✅ Заявка ${orderId} восстановлена из корзины`);
                        resolve({ changes: this.changes });
                    }
                });
            });
        };
        
        // Получение удаленных заявок (корзина)
        database.getDeletedOrders = function() {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT o.*, u.name as client_name, u.phone 
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    WHERE o.is_deleted = 1
                    ORDER BY o.deleted_at DESC
                `;
                
                this.db.all(query, [], (err, rows) => {
                    if (err) {
                        console.error('❌ Ошибка получения удаленных заявок:', err);
                        reject(err);
                    } else {
                        console.log(`📊 Найдено удаленных заявок: ${rows ? rows.length : 0}`);
                        resolve(rows || []);
                    }
                });
            });
        };
        
        console.log('✅ Методы мягкого удаления добавлены в Database');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка в fixDatabaseSoftDelete:', error);
        return false;
    }
}

/**
 * Создание таблиц для мягкого удаления
 */
function createSoftDeleteTables() {
    console.log('🗄️ Создание таблиц для мягкого удаления...');
    
    try {
        const database = require('./database');
        
        if (!database || !database.db) {
            console.log('⚠️ База данных еще не готова, пропускаем создание таблиц');
            return false;
        }
        
        // Добавляем колонки для мягкого удаления в таблицу orders
        const alterQueries = [
            `ALTER TABLE orders ADD COLUMN is_deleted INTEGER DEFAULT 0`,
            `ALTER TABLE orders ADD COLUMN deleted_at TEXT`,
            `ALTER TABLE orders ADD COLUMN deleted_by TEXT`,
            `ALTER TABLE orders ADD COLUMN restored_at TEXT`,
            `ALTER TABLE orders ADD COLUMN restored_by TEXT`
        ];
        
        alterQueries.forEach(query => {
            database.db.run(query, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.log(`⚠️ Ошибка добавления колонки: ${err.message}`);
                }
            });
        });
        
        console.log('✅ Таблицы для мягкого удаления подготовлены');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка в createSoftDeleteTables:', error);
        return false;
    }
}

/**
 * Основная функция инициализации
 */
function initializeOrderBotFixes() {
    console.log('🚀 Инициализация исправлений Order Bot v2...');
    
    try {
        // Даем время базе данных инициализироваться
        setTimeout(() => {
            createSoftDeleteTables();
            fixDatabaseSoftDelete();
            
            console.log('✅ Все исправления Order Bot v2 применены успешно!');
            global.ORDER_BOT_FIXES_LOADED = true;
        }, 2000);
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при инициализации исправлений Order Bot:', error);
        return false;
    }
}

// Функция проверки статуса
global.checkOrderBotFixesStatus = function() {
    try {
        const database = require('./database');
        
        const status = {
            databaseExists: !!database,
            dbConnected: !!(database && database.db),
            softDeleteMethods: typeof database.softDeleteOrder === 'function',
            restoreMethods: typeof database.restoreOrder === 'function',
            trashMethods: typeof database.getDeletedOrders === 'function',
            allLoaded: global.ORDER_BOT_FIXES_LOADED === true
        };
        
        console.log('📊 Статус исправлений Order Bot v2:', status);
        return status;
    } catch (error) {
        console.error('❌ Ошибка проверки статуса:', error);
        return { error: error.message };
    }
};

// Автоматическая инициализация
initializeOrderBotFixes();

console.log('✅ Модуль исправлений Order Bot v2 загружен');

module.exports = {
    initializeOrderBotFixes,
    checkOrderBotFixesStatus: global.checkOrderBotFixesStatus
};
