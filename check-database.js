/**
 * 🔍 Проверка типа базы данных
 */

require('dotenv').config();

console.log('🔍 Проверка конфигурации базы данных\n');

const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasDbPath = !!process.env.DB_PATH;

console.log('📋 Переменные окружения:');
console.log(`   DATABASE_URL: ${hasDatabaseUrl ? '✅ установлен' : '❌ не установлен'}`);
console.log(`   DB_PATH: ${hasDbPath ? '✅ установлен' : '❌ не установлен'}`);

if (hasDatabaseUrl) {
    console.log(`   Значение: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);
}

if (hasDbPath) {
    console.log(`   Значение: ${process.env.DB_PATH}`);
}

console.log('\n🎯 Определенный тип БД:');

if (hasDatabaseUrl) {
    console.log('   ✅ PostgreSQL');
    console.log('\n💡 Рекомендация:');
    console.log('   - Используйте: node switch-to-postgres.js');
    console.log('   - Убедитесь что установлен пакет pg: npm install pg');
} else if (hasDbPath) {
    console.log('   ✅ SQLite');
    console.log('\n💡 Рекомендация:');
    console.log('   - Используйте: node switch-to-sqlite.js');
    console.log('   - Убедитесь что установлен пакет sqlite3: npm install sqlite3');
} else {
    console.log('   ❌ Не настроено');
    console.log('\n💡 Рекомендация:');
    console.log('   - Для PostgreSQL: добавьте DATABASE_URL в .env');
    console.log('   - Для SQLite: добавьте DB_PATH=./orders.db в .env');
}

console.log('\n📦 Установленные пакеты:');
try {
    require('pg');
    console.log('   ✅ pg (PostgreSQL)');
} catch (e) {
    console.log('   ❌ pg не установлен');
}

try {
    require('sqlite3');
    console.log('   ✅ sqlite3');
} catch (e) {
    console.log('   ❌ sqlite3 не установлен');
}

console.log('\n📄 Текущий database.js:');
const fs = require('fs');
const databaseContent = fs.readFileSync('./database.js', 'utf8');

if (databaseContent.includes('require(\'pg\')') || databaseContent.includes('Pool')) {
    console.log('   ✅ Настроен для PostgreSQL');
} else if (databaseContent.includes('sqlite3')) {
    console.log('   ✅ Настроен для SQLite');
} else {
    console.log('   ❌ Неизвестный тип');
}

console.log('\n' + '='.repeat(50));
console.log('Проверка завершена');
console.log('='.repeat(50));
