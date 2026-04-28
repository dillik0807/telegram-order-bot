/**
 * 🔄 Скрипт переключения на SQLite
 * Восстанавливает database.js для SQLite
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Переключение на SQLite...\n');

const currentDb = path.join(__dirname, 'database.js');
const sqliteDb = path.join(__dirname, 'database-sqlite.js');

try {
    if (fs.existsSync(sqliteDb)) {
        fs.copyFileSync(sqliteDb, currentDb);
        console.log('✅ Восстановлена SQLite версия: database.js');
    } else {
        console.error('❌ Файл database-sqlite.js не найден!');
        console.log('💡 Резервная копия не создана. Используйте оригинальный database.js');
        process.exit(1);
    }
    
    console.log('\n🎉 Переключение завершено!');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Убедитесь что DB_PATH указывает на SQLite файл в .env');
    console.log('2. Запустите бота: npm start');
    
} catch (error) {
    console.error('❌ Ошибка переключения:', error);
    process.exit(1);
}
