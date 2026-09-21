/**
 * Обёртка для выбора базы данных.
 * DATABASE_URL задан → PostgreSQL
 * DATABASE_URL не задан → SQLite (локальный fallback)
 */

const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

if (usePostgres) {
  console.log('🐘 Используется PostgreSQL:', process.env.DATABASE_URL.split('@')[1]);
  module.exports = require('./database');
} else {
  console.log('📊 Используется SQLite (DATABASE_URL не задан)');
  module.exports = require('./database-sqlite');
}
