const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// постоянный путь базы (Railway persistent storage)
const dbPath = process.env.DB_PATH || '/data/orders.db';

// создаём папку если не существует
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

console.log('📁 DB PATH:', dbPath);

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

      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telegram_id INTEGER UNIQUE NOT NULL,
          name TEXT,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

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

      this.db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          quantity TEXT NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS warehouses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          whatsapp_group_id TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

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

  close() {
    this.db.close();
  }
}

module.exports = new Database();
