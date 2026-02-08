/**
 * 🔄 Скрипт переключения на PostgreSQL
 * Заменяет database.js на версию для PostgreSQL
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Переключение на PostgreSQL...\n');

// Создаем резервную копию текущего database.js
const currentDb = path.join(__dirname, 'database.js');
const backupDb = path.join(__dirname, 'database-sqlite.js');
const postgresDb = path.join(__dirname, 'database-postgres.js');

try {
    // Сохраняем SQLite версию как резервную копию
    if (fs.existsSync(currentDb)) {
        fs.copyFileSync(currentDb, backupDb);
        console.log('✅ Создана резервная копия: database-sqlite.js');
    }
    
    // Копируем PostgreSQL версию как основную
    if (fs.existsSync(postgresDb)) {
        fs.copyFileSync(postgresDb, currentDb);
        console.log('✅ Установлена PostgreSQL версия: database.js');
    } else {
        console.error('❌ Файл database-postgres.js не найден!');
        process.exit(1);
    }
    
    // Обновляем package.json для добавления pg
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.dependencies.pg) {
        packageJson.dependencies.pg = '^8.11.3';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✅ Добавлена зависимость pg в package.json');
        console.log('\n⚠️  Выполните: npm install');
    }
    
    // Обновляем .env для добавления DATABASE_URL
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    if (!envContent.includes('DATABASE_URL')) {
        envContent += '\n# PostgreSQL Database URL\n';
        envContent += '# Формат: postgresql://user:password@host:port/database\n';
        envContent += 'DATABASE_URL=postgresql://postgres:password@localhost:5432/orders\n';
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Добавлена переменная DATABASE_URL в .env');
        console.log('\n⚠️  Обновите DATABASE_URL в .env файле!');
    }
    
    console.log('\n🎉 Переключение завершено!');
    console.log('\n📋 Следующие шаги:');
    console.log('1. Установите зависимости: npm install');
    console.log('2. Обновите DATABASE_URL в .env файле');
    console.log('3. Запустите бота: npm start');
    console.log('\n💡 Для возврата к SQLite: node switch-to-sqlite.js');
    
} catch (error) {
    console.error('❌ Ошибка переключения:', error);
    process.exit(1);
}
