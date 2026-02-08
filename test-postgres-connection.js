/**
 * 🧪 Тест подключения к PostgreSQL
 */

require('dotenv').config();

async function testConnection() {
    console.log('🧪 Тестирование подключения к PostgreSQL\n');
    
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL не установлен в .env файле');
        console.log('\n💡 Добавьте в .env:');
        console.log('DATABASE_URL=postgresql://user:password@host:port/database');
        process.exit(1);
    }
    
    console.log('📋 DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
    
    try {
        const { Pool } = require('pg');
        console.log('✅ Модуль pg установлен');
        
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        console.log('\n🔌 Попытка подключения...');
        const client = await pool.connect();
        console.log('✅ Подключение успешно!');
        
        console.log('\n📊 Информация о БД:');
        const versionResult = await client.query('SELECT version()');
        console.log('   Версия:', versionResult.rows[0].version.split(',')[0]);
        
        const dbResult = await client.query('SELECT current_database()');
        console.log('   База данных:', dbResult.rows[0].current_database);
        
        const userResult = await client.query('SELECT current_user');
        console.log('   Пользователь:', userResult.rows[0].current_user);
        
        console.log('\n📋 Существующие таблицы:');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (tablesResult.rows.length === 0) {
            console.log('   ⚠️  Таблицы не найдены (будут созданы при запуске бота)');
        } else {
            tablesResult.rows.forEach((row, index) => {
                console.log(`   ${index + 1}. ${row.table_name}`);
            });
        }
        
        client.release();
        await pool.end();
        
        console.log('\n✅ Тест завершен успешно!');
        console.log('💡 Можно запускать бота: npm start');
        
    } catch (error) {
        console.error('\n❌ Ошибка подключения:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.log('\n💡 Хост не найден. Проверьте:');
            console.log('   - Правильность DATABASE_URL');
            console.log('   - Доступность сервера PostgreSQL');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Подключение отклонено. Проверьте:');
            console.log('   - Запущен ли PostgreSQL сервер');
            console.log('   - Правильность порта в DATABASE_URL');
        } else if (error.message.includes('password authentication failed')) {
            console.log('\n💡 Ошибка аутентификации. Проверьте:');
            console.log('   - Правильность пароля в DATABASE_URL');
            console.log('   - Существование пользователя');
        } else if (error.message.includes('database') && error.message.includes('does not exist')) {
            console.log('\n💡 База данных не существует. Создайте её:');
            console.log('   CREATE DATABASE orders;');
        }
        
        process.exit(1);
    }
}

// Проверяем наличие pg модуля
try {
    require('pg');
} catch (error) {
    console.error('❌ Модуль pg не установлен');
    console.log('\n💡 Установите его:');
    console.log('   npm install pg');
    process.exit(1);
}

testConnection();
