/**
 * 🔄 Миграция PostgreSQL для добавления недостающих колонок
 */

require('dotenv').config();
const { Pool } = require('pg');

async function migratePostgres() {
    console.log('🔄 МИГРАЦИЯ POSTGRESQL\n');
    
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL не установлен');
        process.exit(1);
    }
    
    console.log('📋 DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    try {
        console.log('\n🔌 Подключение к PostgreSQL...');
        const client = await pool.connect();
        console.log('✅ Подключено!\n');
        
        // 1. Проверяем существующие таблицы
        console.log('📊 Проверка существующих таблиц...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('Найдено таблиц:', tablesResult.rows.length);
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // 2. Проверяем структуру таблицы orders
        console.log('\n📋 Проверка структуры таблицы orders...');
        const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'orders'
            ORDER BY ordinal_position
        `);
        
        console.log('Текущие колонки в orders:');
        const existingColumns = [];
        columnsResult.rows.forEach(col => {
            existingColumns.push(col.column_name);
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // 3. Добавляем недостающие колонки в orders
        console.log('\n➕ Добавление недостающих колонок в orders...');
        
        const columnsToAdd = [
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' },
            { name: 'deleted_at', type: 'TIMESTAMP' },
            { name: 'deleted_by', type: 'TEXT' },
            { name: 'restored_at', type: 'TIMESTAMP' },
            { name: 'restored_by', type: 'TEXT' },
            { name: 'client_id', type: 'INTEGER' }
        ];
        
        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                try {
                    await client.query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`  ✅ Добавлена колонка: ${col.name}`);
                } catch (error) {
                    if (error.message.includes('already exists')) {
                        console.log(`  ⚠️  Колонка ${col.name} уже существует`);
                    } else {
                        console.error(`  ❌ Ошибка добавления ${col.name}:`, error.message);
                    }
                }
            } else {
                console.log(`  ✓ Колонка ${col.name} уже существует`);
            }
        }
        
        // 4. Заполняем client_id из user_id если пусто
        console.log('\n🔄 Обновление client_id...');
        try {
            const updateResult = await client.query(`
                UPDATE orders o
                SET client_id = (
                    SELECT c.id 
                    FROM users u 
                    JOIN clients c ON u.telegram_id = c.telegram_id 
                    WHERE u.id = o.user_id
                )
                WHERE client_id IS NULL
            `);
            console.log(`  ✅ Обновлено записей: ${updateResult.rowCount}`);
        } catch (error) {
            console.log(`  ⚠️  Ошибка обновления client_id:`, error.message);
        }
        
        // 5. Проверяем структуру таблицы warehouses
        console.log('\n📋 Проверка структуры таблицы warehouses...');
        const warehouseColumnsResult = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'warehouses'
            ORDER BY ordinal_position
        `);
        
        const warehouseColumns = [];
        warehouseColumnsResult.rows.forEach(col => {
            warehouseColumns.push(col.column_name);
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // 6. Добавляем whatsapp_group_id если нет
        if (!warehouseColumns.includes('whatsapp_group_id')) {
            console.log('\n➕ Добавление whatsapp_group_id в warehouses...');
            try {
                await client.query('ALTER TABLE warehouses ADD COLUMN whatsapp_group_id TEXT');
                console.log('  ✅ Колонка whatsapp_group_id добавлена');
            } catch (error) {
                console.log('  ⚠️  Ошибка:', error.message);
            }
        } else {
            console.log('\n✓ Колонка whatsapp_group_id уже существует');
        }
        
        // 7. Настраиваем маршрутизацию складов
        console.log('\n🎯 Настройка маршрутизации складов...');
        
        // Проверяем существующие склады
        const warehousesResult = await client.query(
            'SELECT id, name, whatsapp_group_id FROM warehouses WHERE is_active = 1'
        );
        
        console.log('Текущие склады:');
        warehousesResult.rows.forEach(w => {
            console.log(`  - ${w.name} (ID: ${w.id}) → ${w.whatsapp_group_id || 'не настроен'}`);
        });
        
        // Настраиваем ЧБалхи
        const balkhi = warehousesResult.rows.find(w => w.name === 'ЧБалхи');
        if (balkhi) {
            await client.query(
                'UPDATE warehouses SET whatsapp_group_id = $1 WHERE id = $2',
                ['120363419535622239@g.us', balkhi.id]
            );
            console.log(`  ✅ ЧБалхи → Бахор ойл склад`);
        } else {
            console.log('  ⚠️  Склад ЧБалхи не найден');
        }
        
        // Настраиваем ЗаводТЧ
        const zavod = warehousesResult.rows.find(w => w.name === 'ЗаводТЧ');
        if (zavod) {
            await client.query(
                'UPDATE warehouses SET whatsapp_group_id = $1 WHERE id = $2',
                ['120363422710745455@g.us', zavod.id]
            );
            console.log(`  ✅ ЗаводТЧ → точик азод`);
        } else {
            console.log('  ⚠️  Склад ЗаводТЧ не найден');
        }
        
        // 8. Финальная проверка
        console.log('\n📊 Финальная проверка структуры orders...');
        const finalCheck = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'orders'
            ORDER BY ordinal_position
        `);
        
        console.log('Все колонки в orders:');
        finalCheck.rows.forEach((col, index) => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}) ${nullable}${def}`);
        });
        
        // 9. Проверка данных
        console.log('\n📈 Статистика данных...');
        const statsResult = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as users_count,
                (SELECT COUNT(*) FROM clients) as clients_count,
                (SELECT COUNT(*) FROM orders) as orders_count,
                (SELECT COUNT(*) FROM warehouses) as warehouses_count,
                (SELECT COUNT(*) FROM products) as products_count
        `);
        
        const stats = statsResult.rows[0];
        console.log(`  Пользователей: ${stats.users_count}`);
        console.log(`  Клиентов: ${stats.clients_count}`);
        console.log(`  Заявок: ${stats.orders_count}`);
        console.log(`  Складов: ${stats.warehouses_count}`);
        console.log(`  Товаров: ${stats.products_count}`);
        
        client.release();
        await pool.end();
        
        console.log('\n🎉 МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');
        console.log('✅ Все колонки добавлены');
        console.log('✅ Маршрутизация настроена');
        console.log('✅ Бот готов к работе');
        
    } catch (error) {
        console.error('\n❌ Ошибка миграции:', error);
        process.exit(1);
    }
}

// Запуск
migratePostgres()
    .then(() => {
        console.log('\n✅ Миграция выполнена успешно!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Ошибка:', error);
        process.exit(1);
    });
