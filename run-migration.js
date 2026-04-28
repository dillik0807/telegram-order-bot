require('dotenv').config();
const { Pool } = require('pg');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:JnQjhFQbmRYdmEVrevdfAsTGdTgctDvf@interchange.proxy.rlwy.net:17044/railway';

const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('✅ Подключено к PostgreSQL');

    // Показываем текущие таблицы
    const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    console.log('📋 Таблицы:', tables.rows.map(r => r.table_name).join(', '));

    // Колонки для warehouses
    const warehouseCols = [
      { name: 'whatsapp_group_id', type: 'TEXT' },
      { name: 'whatsapp_phone', type: 'TEXT' },
      { name: 'green_api_instance_id', type: 'TEXT' },
      { name: 'green_api_token', type: 'TEXT' },
      { name: 'is_active', type: 'INTEGER DEFAULT 1' }
    ];

    for (const col of warehouseCols) {
      const check = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name='warehouses' AND column_name=$1`,
        [col.name]
      );
      if (check.rows.length === 0) {
        await client.query(`ALTER TABLE warehouses ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ warehouses.${col.name} добавлена`);
      } else {
        console.log(`⏭️  warehouses.${col.name} уже есть`);
      }
    }

    // Колонки для products
    const prodCheck = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name='is_active'`
    );
    if (prodCheck.rows.length === 0) {
      await client.query(`ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1`);
      console.log('✅ products.is_active добавлена');
    } else {
      console.log('⏭️  products.is_active уже есть');
    }

    // Колонки для clients
    const clientCheck = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='clients' AND column_name='is_active'`
    );
    if (clientCheck.rows.length === 0) {
      await client.query(`ALTER TABLE clients ADD COLUMN is_active INTEGER DEFAULT 1`);
      console.log('✅ clients.is_active добавлена');
    } else {
      console.log('⏭️  clients.is_active уже есть');
    }

    // Показываем итоговые колонки warehouses
    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='warehouses' ORDER BY ordinal_position`
    );
    console.log('\n📋 Колонки warehouses:', cols.rows.map(r => r.column_name).join(', '));

    console.log('\n🎉 Миграция завершена!');
  } catch (e) {
    console.error('❌ Ошибка:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
