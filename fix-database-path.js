/**
 * 🔧 Исправление пути к базе данных для контейнера
 */

const fs = require('fs');
const path = require('path');

// Определяем правильный путь для базы данных
function getCorrectDbPath() {
    // В контейнере используем /tmp или /app/data
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
        // Railway или другой контейнер
        const dataDir = '/app/data';
        
        // Создаем директорию если не существует
        if (!fs.existsSync(dataDir)) {
            try {
                fs.mkdirSync(dataDir, { recursive: true });
                console.log(`✅ Создана директория для БД: ${dataDir}`);
            } catch (error) {
                console.error(`❌ Не удалось создать директорию ${dataDir}:`, error);
                // Fallback на /tmp
                return '/tmp/orders.db';
            }
        }
        
        return path.join(dataDir, 'orders.db');
    }
    
    // Локальная разработка
    return process.env.DB_PATH || './orders.db';
}

// Устанавливаем правильный путь
const correctPath = getCorrectDbPath();
process.env.DB_PATH = correctPath;

console.log(`📁 Путь к базе данных: ${correctPath}`);

module.exports = {
    getCorrectDbPath,
    dbPath: correctPath
};
