const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DB_PATH || './orders.db';

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Ошибка подключения к БД:', err);
      } else {
        console.log('✅ База данных подключена');
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
        this.db.run(
          'INSERT OR IGNORE INTO clients (telegram_id, name, phone, added_by) VALUES (?, ?, ?, ?)',
          [telegramId, name, phone, approvedBy],
          (err) => {
            if (err) return reject(err);
            
            this.db.run(
              'UPDATE registration_requests SET status = "approved" WHERE telegram_id = ?',
              [telegramId],
              (err) => {
                if (err) return reject(err);
                resolve(true);
              }
            );
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
  addWarehouse(name) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO warehouses (name) VALUES (?)',
        [name],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
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
      this.db.run(
        'INSERT INTO products (name) VALUES (?)',
        [name],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
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
