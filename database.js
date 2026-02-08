const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || './orders.db';

// 🔧 Создаем директорию для базы данных, если её нет (для Railway Volume)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Создана директория для БД: ${dbDir}`);
  } catch (error) {
    console.error(`❌ Ошибка создания директории ${dbDir}:`, error);
  }
}

console.log(`📊 Путь к базе данных: ${dbPath}`);

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Ошибка подключения к БД:', err);
      } else {
        console.log('✅ База данных подключена');
        
        // Проверяем размер файла БД
        if (fs.existsSync(dbPath)) {
          const stats = fs.statSync(dbPath);
          console.log(`📊 Размер БД: ${(stats.size / 1024).toFixed(2)} KB`);
          console.log(`📅 Последнее изменение: ${stats.mtime.toLocaleString('ru-RU')}`);
        }
        
        this.init();
      }
    });
  }

  init() {
    this.db.serialize(() => {
      // Таблица пользователей
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telegram_id INTEGER UNIQUE NOT NULL,
          name TEXT,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Таблица запросов на регистрацию
      this.db.run(`
        CREATE TABLE IF NOT EXISTS registration_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telegram_id INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          username TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Таблица клиентов (разрешенные пользователи)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telegram_id INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          added_by INTEGER NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Таблица заявок
      this.db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          warehouse TEXT,
          transport_number TEXT,
          comment TEXT,
          status TEXT DEFAULT 'new',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица товаров в заявке
      this.db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          quantity TEXT NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `);

      // Таблица складов
      this.db.run(`
        CREATE TABLE IF NOT EXISTS warehouses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          whatsapp_group_id TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Таблица товаров
      this.db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
  }

  getOrCreateUser(telegramId, name, phone) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE telegram_id = ?',
        [telegramId],
        (err, row) => {
          if (err) return reject(err);
          
          if (row) {
            resolve(row);
          } else {
            this.db.run(
              'INSERT INTO users (telegram_id, name, phone) VALUES (?, ?, ?)',
              [telegramId, name, phone],
              function(err) {
                if (err) return reject(err);
                resolve({ id: this.lastID, telegram_id: telegramId, name, phone });
              }
            );
          }
        }
      );
    });
  }

  createOrder(userId, warehouse, transportNumber, comment) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO orders (user_id, warehouse, transport_number, comment) VALUES (?, ?, ?, ?)',
        [userId, warehouse, transportNumber, comment],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  addOrderItem(orderId, productName, quantity) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO order_items (order_id, product_name, quantity) VALUES (?, ?, ?)',
        [orderId, productName, quantity],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  getOrderWithItems(orderId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM orders WHERE id = ?',
        [orderId],
        (err, order) => {
          if (err) return reject(err);
          
          this.db.all(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId],
            (err, items) => {
              if (err) return reject(err);
              resolve({ ...order, items });
            }
          );
        }
      );
    });
  }

  addClient(telegramId, name, phone, addedBy) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO clients (telegram_id, name, phone, added_by) VALUES (?, ?, ?, ?)',
        [telegramId, name || '', phone || '', addedBy],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  isClient(telegramId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM clients WHERE telegram_id = ? AND is_active = 1',
        [telegramId],
        (err, row) => {
          if (err) return reject(err);
          resolve(!!row);
        }
      );
    });
  }

  getAllClients() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM clients WHERE is_active = 1 ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  removeClient(telegramId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE clients SET is_active = 0 WHERE telegram_id = ?',
        [telegramId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  getStats() {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      this.db.get('SELECT COUNT(*) as count FROM clients WHERE is_active = 1', [], (err, row) => {
        if (err) return reject(err);
        stats.totalClients = row.count;
        
        this.db.get('SELECT COUNT(*) as count FROM orders', [], (err, row) => {
          if (err) return reject(err);
          stats.totalOrders = row.count;
          
          this.db.get(
            'SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE("now")',
            [],
            (err, row) => {
              if (err) return reject(err);
              stats.ordersToday = row.count;
              
              this.db.get(
                'SELECT COUNT(*) as count FROM orders WHERE created_at >= DATE("now", "-7 days")',
                [],
                (err, row) => {
                  if (err) return reject(err);
                  stats.ordersWeek = row.count;
                  resolve(stats);
                }
              );
            }
          );
        });
      });
    });
  }

  // Получить детальную статистику заявок по пользователям
  getDetailedOrderStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COALESCE(c.name, u.name) as client_name,
          u.telegram_id,
          COALESCE(c.phone, u.phone) as phone,
          COUNT(o.id) as orders_count,
          MAX(o.created_at) as last_order_date,
          MIN(o.created_at) as first_order_date
        FROM users u
        LEFT JOIN clients c ON u.telegram_id = c.telegram_id AND c.is_active = 1
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.telegram_id IS NOT NULL
        GROUP BY u.telegram_id, COALESCE(c.name, u.name), COALESCE(c.phone, u.phone)
        HAVING COUNT(o.id) > 0
        ORDER BY orders_count DESC, last_order_date DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  // Получить последние заявки с информацией о клиентах
  getRecentOrdersWithClients(limit = 10) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          o.id,
          o.warehouse,
          o.transport_number,
          o.comment,
          o.status,
          o.created_at,
          COALESCE(c.name, u.name) as client_name,
          u.telegram_id,
          COALESCE(c.phone, u.phone) as phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN clients c ON u.telegram_id = c.telegram_id AND c.is_active = 1
        ORDER BY o.created_at DESC
        LIMIT ?
      `;
      
      this.db.all(query, [limit], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  // Получить статистику по складам
  getWarehouseStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          o.warehouse,
          COUNT(*) as orders_count,
          COUNT(DISTINCT u.telegram_id) as unique_clients
        FROM orders o
        JOIN users u ON o.user_id = u.id
        GROUP BY o.warehouse
        ORDER BY orders_count DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  createRegistrationRequest(telegramId, name, username) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO registration_requests (telegram_id, name, username) VALUES (?, ?, ?)',
        [telegramId, name, username || ''],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  getRegistrationRequest(telegramId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM registration_requests WHERE telegram_id = ? AND status = "pending"',
        [telegramId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  getPendingRequests() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM registration_requests WHERE status = "pending" ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  getPendingRequest(telegramId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM registration_requests WHERE telegram_id = ? AND status = "pending"',
        [telegramId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  approveClient(telegramId, name, phone, approvedBy) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Сначала проверяем, существует ли уже клиент
        this.db.get(
          'SELECT * FROM clients WHERE telegram_id = ?',
          [telegramId],
          (err, existingClient) => {
            if (err) return reject(err);
            
            if (existingClient) {
              // Клиент уже существует - обновляем статус запроса и возвращаем false
              console.log(`⚠️ Клиент ${telegramId} уже существует в базе`);
              this.db.run(
                'UPDATE registration_requests SET status = "approved" WHERE telegram_id = ?',
                [telegramId],
                (err) => {
                  if (err) return reject(err);
                  resolve(false); // Возвращаем false, так как клиент не был добавлен
                }
              );
            } else {
              // Клиент не существует - добавляем его
              this.db.run(
                'INSERT INTO clients (telegram_id, name, phone, added_by) VALUES (?, ?, ?, ?)',
                [telegramId, name, phone, approvedBy],
                (err) => {
                  if (err) return reject(err);
                  
                  console.log(`✅ Клиент ${telegramId} (${name}) добавлен в базу`);
                  
                  this.db.run(
                    'UPDATE registration_requests SET status = "approved" WHERE telegram_id = ?',
                    [telegramId],
                    (err) => {
                      if (err) return reject(err);
                      resolve(true); // Возвращаем true, так как клиент был успешно добавлен
                    }
                  );
                }
              );
            }
          }
        );
      });
    });
  }

  rejectRequest(telegramId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE registration_requests SET status = "rejected" WHERE telegram_id = ?',
        [telegramId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Получить данные клиента
  getClient(telegramId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM clients WHERE telegram_id = ? AND is_active = 1',
        [telegramId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  // Обновить данные клиента
  updateClient(telegramId, name, phone) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE clients SET name = ?, phone = ? WHERE telegram_id = ?',
        [name, phone, telegramId],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Управление складами
  addWarehouse(name, whatsappGroupId = null) {
    return new Promise((resolve, reject) => {
      // Сначала проверяем, существует ли уже такой склад
      this.db.get(
        'SELECT * FROM warehouses WHERE name = ? AND is_active = 1',
        [name],
        (err, existingWarehouse) => {
          if (err) return reject(err);
          
          if (existingWarehouse) {
            // Склад уже существует
            console.log(`⚠️ Склад "${name}" уже существует (ID: ${existingWarehouse.id})`);
            const error = new Error(`Склад "${name}" уже существует`);
            error.code = 'WAREHOUSE_EXISTS';
            error.existingId = existingWarehouse.id;
            return reject(error);
          }
          
          // Склад не существует - добавляем
          this.db.run(
            'INSERT INTO warehouses (name, whatsapp_group_id) VALUES (?, ?)',
            [name, whatsappGroupId],
            function(err) {
              if (err) {
                console.error(`❌ Ошибка добавления склада "${name}":`, err);
                return reject(err);
              }
              console.log(`✅ Склад "${name}" добавлен (ID: ${this.lastID})`);
              resolve(this.lastID);
            }
          );
        }
      );
    });
  }

  // Обновить WhatsApp группу склада
  updateWarehouseWhatsApp(warehouseName, whatsappGroupId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE warehouses SET whatsapp_group_id = ? WHERE name = ? AND is_active = 1',
        [whatsappGroupId, warehouseName],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Получить WhatsApp группу склада
  getWarehouseWhatsApp(warehouseName) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT whatsapp_group_id FROM warehouses WHERE name = ? AND is_active = 1',
        [warehouseName],
        (err, row) => {
          if (err) return reject(err);
          resolve(row ? row.whatsapp_group_id : null);
        }
      );
    });
  }

  getAllWarehouses() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM warehouses WHERE is_active = 1 ORDER BY name',
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  removeWarehouse(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE warehouses SET is_active = 0 WHERE id = ?',
        [id],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Управление товарами
  addProduct(name) {
    return new Promise((resolve, reject) => {
      // Сначала проверяем, существует ли уже такой товар
      this.db.get(
        'SELECT * FROM products WHERE name = ? AND is_active = 1',
        [name],
        (err, existingProduct) => {
          if (err) return reject(err);
          
          if (existingProduct) {
            // Товар уже существует
            console.log(`⚠️ Товар "${name}" уже существует (ID: ${existingProduct.id})`);
            const error = new Error(`Товар "${name}" уже существует`);
            error.code = 'PRODUCT_EXISTS';
            error.existingId = existingProduct.id;
            return reject(error);
          }
          
          // Товар не существует - добавляем
          this.db.run(
            'INSERT INTO products (name) VALUES (?)',
            [name],
            function(err) {
              if (err) {
                console.error(`❌ Ошибка добавления товара "${name}":`, err);
                return reject(err);
              }
              console.log(`✅ Товар "${name}" добавлен (ID: ${this.lastID})`);
              resolve(this.lastID);
            }
          );
        }
      );
    });
  }

  getAllProducts() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM products WHERE is_active = 1 ORDER BY name',
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  removeProduct(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE products SET is_active = 0 WHERE id = ?',
        [id],
        function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = new Database();
