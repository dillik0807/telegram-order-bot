/**
 * Обертка для автоматического выбора базы данных
 * Использует PostgreSQL если DATABASE_URL установлен, иначе SQLite
 */

// Проверяем, какую базу данных использовать
const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

if (usePostgres) {
  console.log('🐘 Используется PostgreSQL');
  module.exports = require('./database-postgres');
} else {
  console.log('📊 Используется SQLite');
  module.exports = require('./database');
}
