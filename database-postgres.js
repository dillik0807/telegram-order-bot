/**
 * PostgreSQL адаптер для базы данных
 * Совместим с существующим SQLite интерфейсом
 */

const { Pool } = require('pg');

class DatabasePostgres {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL не установлен в переменных окружения');
    }
    
    // Создаем пул подключений
    this.pool = new Pool({
      connectionString: connectionString,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    });
    
    console.log('✅ PostgreSQL подключен');
    this.init();
  }

  async init() {
    try {
      // Создаем таблицы, если их нет
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          telegram_id BIGINT UNIQUE NOT NULL,
          name TEXT,
          phone TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS registration_requests (
          id SERIAL PRIMARY KEY,
          telegram_id BIGINT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          username TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          telegram_id BIGINT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          added_by BIGINT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          warehouse TEXT,
          transport_number TEXT,
          comment TEXT,
          status TEXT DEFAULT 'new',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          quantity TEXT NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS warehouses (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          whatsapp_group_id TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Таблицы PostgreSQL инициализированы');
    } catch (error) {
      console.error('❌ Ошибка инициализации таблиц:', error);
      throw error;
    }
  }

  async getOrCreateUser(telegramId, name, phone) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      const insertResult = await this.pool.query(
        'INSERT INTO users (telegram_id, name, phone) VALUES ($1, $2, $3) RETURNING *',
        [telegramId, name, phone]
      );
      
      return insertResult.rows[0];
    } catch (error) {
      throw error;
    }
  }

  async createOrder(userId, warehouse, transportNumber, comment) {
    try {
      const result = await this.pool.query(
        'INSERT INTO orders (user_id, warehouse, transport_number, comment) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, warehouse, transportNumber, comment]
      );
      
      return result.rows[0].id;
    } catch (error) {
      throw error;
    }
  }

  async addOrderItem(orderId, productName, quantity) {
    try {
      const result = await this.pool.query(
        'INSERT INTO order_items (order_id, product_name, quantity) VALUES ($1, $2, $3) RETURNING id',
        [orderId, productName, quantity]
      );
      
      return result.rows[0].id;
    } catch (error) {
      throw error;
    }
  }

  async getOrderWithItems(orderId) {
    try {
      const orderResult = await this.pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );
      
      if (orderResult.rows.length === 0) {
        return null;
      }
      
      const itemsResult = await this.pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [orderId]
      );
      
      return {
        ...orderResult.rows[0],
        items: itemsResult.rows
      };
    } catch (error) {
      throw error;
    }
  }

  async addClient(telegramId, name, phone, addedBy) {
    try {
      const result = await this.pool.query(
        'INSERT INTO clients (telegram_id, name, phone, added_by) VALUES ($1, $2, $3, $4) RETURNING id',
        [telegramId, name || '', phone || '', addedBy]
      );
      
      return result.rows[0].id;
    } catch (error) {
      throw error;
    }
  }

  async isClient(telegramId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM clients WHERE telegram_id = $1 AND is_active = 1',
        [telegramId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async getAllClients() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM clients WHERE is_active = 1 ORDER BY created_at DESC'
      );
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async removeClient(telegramId) {
    try {
      const result = await this.pool.query(
        'UPDATE clients SET is_active = 0 WHERE telegram_id = $1',
        [telegramId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  async getStats() {
    try {
      const clientsResult = await this.pool.query(
        'SELECT COUNT(*) as count FROM clients WHERE is_active = 1'
      );
      
      const ordersResult = await this.pool.query(
        'SELECT COUNT(*) as count FROM orders'
      );
      
      const todayResult = await this.pool.query(
        'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE'
      );
      
      const weekResult = await this.pool.query(
        'SELECT COUNT(*) as count FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\''
      );
      
      return {
        totalClients: parseInt(clientsResult.rows[0].count),
        totalOrders: parseInt(ordersResult.rows[0].count),
        ordersToday: parseInt(todayResult.rows[0].count),
        ordersWeek: parseInt(weekResult.rows[0].count)
      };
    } catch (error) {
      throw error;
    }
  }

  async getDetailedOrderStats() {
    try {
      const result = await this.pool.query(`
        SELECT 
          c.name as client_name,
          c.telegram_id,
          c.phone,
          COUNT(o.id) as orders_count,
          MAX(o.created_at) as last_order_date,
          MIN(o.created_at) as first_order_date
        FROM clients c
        LEFT JOIN orders o ON c.telegram_id = (
          SELECT u.telegram_id FROM users u WHERE u.id = o.user_id
        )
        WHERE c.is_active = 1
        GROUP BY c.telegram_id, c.name, c.phone
        ORDER BY orders_count DESC, last_order_date DESC
      `);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getRecentOrdersWithClients(limit = 10) {
    try {
      const result = await this.pool.query(`
        SELECT 
          o.id,
          o.warehouse,
          o.transport_number,
          o.comment,
          o.status,
          o.created_at,
          c.name as client_name,
          c.telegram_id,
          c.phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN clients c ON u.telegram_id = c.telegram_id
        WHERE c.is_active = 1
        ORDER BY o.created_at DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getWarehouseStats() {
    try {
      const result = await this.pool.query(`
        SELECT 
          o.warehouse,
          COUNT(*) as orders_count,
          COUNT(DISTINCT u.telegram_id) as unique_clients
        FROM orders o
        JOIN users u ON o.user_id = u.id
        GROUP BY o.warehouse
        ORDER BY orders_count DESC
      `);
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async createRegistrationRequest(telegramId, name, username) {
    try {
      await this.pool.query(
        'INSERT INTO registration_requests (telegram_id, name, username) VALUES ($1, $2, $3) ON CONFLICT (telegram_id) DO UPDATE SET name = $2, username = $3, status = \'pending\'',
        [telegramId, name, username || '']
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  async getRegistrationRequest(telegramId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM registration_requests WHERE telegram_id = $1 AND status = \'pending\'',
        [telegramId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async getPendingRequests() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM registration_requests WHERE status = \'pending\' ORDER BY created_at DESC'
      );
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async getPendingRequest(telegramId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM registration_requests WHERE telegram_id = $1 AND status = \'pending\'',
        [telegramId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async approveClient(telegramId, name, phone, approvedBy) {
    try {
      // Проверяем, существует ли уже клиент
      const existingResult = await this.pool.query(
        'SELECT * FROM clients WHERE telegram_id = $1',
        [telegramId]
      );
      
      if (existingResult.rows.length > 0) {
        console.log(`⚠️ Клиент ${telegramId} уже существует в базе`);
        
        await this.pool.query(
          'UPDATE registration_requests SET status = \'approved\' WHERE telegram_id = $1',
          [telegramId]
        );
        
        return false;
      }
      
      // Добавляем клиента
      await this.pool.query(
        'INSERT INTO clients (telegram_id, name, phone, added_by) VALUES ($1, $2, $3, $4)',
        [telegramId, name, phone, approvedBy]
      );
      
      console.log(`✅ Клиент ${telegramId} (${name}) добавлен в базу`);
      
      await this.pool.query(
        'UPDATE registration_requests SET status = \'approved\' WHERE telegram_id = $1',
        [telegramId]
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  async rejectRequest(telegramId) {
    try {
      const result = await this.pool.query(
        'UPDATE registration_requests SET status = \'rejected\' WHERE telegram_id = $1',
        [telegramId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  async getClient(telegramId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM clients WHERE telegram_id = $1 AND is_active = 1',
        [telegramId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  async updateClient(telegramId, name, phone) {
    try {
      const result = await this.pool.query(
        'UPDATE clients SET name = $1, phone = $2 WHERE telegram_id = $3',
        [name, phone, telegramId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Управление складами
  async addWarehouse(name, whatsappGroupId = null) {
    try {
      // Проверяем существование
      const existingResult = await this.pool.query(
        'SELECT * FROM warehouses WHERE name = $1 AND is_active = 1',
        [name]
      );
      
      if (existingResult.rows.length > 0) {
        console.log(`⚠️ Склад "${name}" уже существует (ID: ${existingResult.rows[0].id})`);
        const error = new Error(`Склад "${name}" уже существует`);
        error.code = 'WAREHOUSE_EXISTS';
        error.existingId = existingResult.rows[0].id;
        throw error;
      }
      
      const result = await this.pool.query(
        'INSERT INTO warehouses (name, whatsapp_group_id) VALUES ($1, $2) RETURNING id',
        [name, whatsappGroupId]
      );
      
      console.log(`✅ Склад "${name}" добавлен (ID: ${result.rows[0].id})`);
      return result.rows[0].id;
    } catch (error) {
      throw error;
    }
  }

  async updateWarehouseWhatsApp(warehouseName, whatsappGroupId) {
    try {
      const result = await this.pool.query(
        'UPDATE warehouses SET whatsapp_group_id = $1 WHERE name = $2 AND is_active = 1',
        [whatsappGroupId, warehouseName]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  async getWarehouseWhatsApp(warehouseName) {
    try {
      const result = await this.pool.query(
        'SELECT whatsapp_group_id FROM warehouses WHERE name = $1 AND is_active = 1',
        [warehouseName]
      );
      
      return result.rows[0] ? result.rows[0].whatsapp_group_id : null;
    } catch (error) {
      throw error;
    }
  }

  async getAllWarehouses() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM warehouses WHERE is_active = 1 ORDER BY name'
      );
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async removeWarehouse(id) {
    try {
      const result = await this.pool.query(
        'UPDATE warehouses SET is_active = 0 WHERE id = $1',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Управление товарами
  async addProduct(name) {
    try {
      // Проверяем существование
      const existingResult = await this.pool.query(
        'SELECT * FROM products WHERE name = $1 AND is_active = 1',
        [name]
      );
      
      if (existingResult.rows.length > 0) {
        console.log(`⚠️ Товар "${name}" уже существует (ID: ${existingResult.rows[0].id})`);
        const error = new Error(`Товар "${name}" уже существует`);
        error.code = 'PRODUCT_EXISTS';
        error.existingId = existingResult.rows[0].id;
        throw error;
      }
      
      const result = await this.pool.query(
        'INSERT INTO products (name) VALUES ($1) RETURNING id',
        [name]
      );
      
      console.log(`✅ Товар "${name}" добавлен (ID: ${result.rows[0].id})`);
      return result.rows[0].id;
    } catch (error) {
      throw error;
    }
  }

  async getAllProducts() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM products WHERE is_active = 1 ORDER BY name'
      );
      
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  async removeProduct(id) {
    try {
      const result = await this.pool.query(
        'UPDATE products SET is_active = 0 WHERE id = $1',
        [id]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  close() {
    this.pool.end();
  }
}

module.exports = new DatabasePostgres();
