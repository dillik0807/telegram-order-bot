const { Pool } = require('pg');

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addWhatsAppPhoneColumn() {
  try {
    console.log('🔧 Добавление колонки whatsapp_phone в таблицу warehouses...');
    
    // Проверяем, существует ли колонка
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'warehouses' 
      AND column_name = 'whatsapp_phone'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Колонка whatsapp_phone уже существует');
    } else {
      // Добавляем колонку для личного номера WhatsApp
      await pool.query(`
        ALTER TABLE warehouses 
        ADD COLUMN whatsapp_phone TEXT
      `);
      
      console.log('✅ Колонка whatsapp_phone успешно добавлена!');
    }
    
    // Показываем текущую структуру таблицы
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'warehouses'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Структура таблицы warehouses:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Показываем текущие склады
    const warehouses = await pool.query('SELECT * FROM warehouses');
    
    console.log('\n🏬 Текущие склады:');
    if (warehouses.rows.length === 0) {
      console.log('  (нет складов)');
    } else {
      warehouses.rows.forEach(w => {
        console.log(`  - ${w.name}`);
        console.log(`    WhatsApp группа: ${w.whatsapp_group_id || 'не указана'}`);
        console.log(`    WhatsApp номер: ${w.whatsapp_phone || 'не указан'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

addWhatsAppPhoneColumn();
