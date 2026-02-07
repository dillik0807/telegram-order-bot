/**
 * Менеджер данных для складов и товаров
 */

const database = require('./database-wrapper');

// Глобальные переменные для хранения данных
let warehouses = [];
let products = [];

// Функция загрузки данных из базы
async function loadWarehousesAndProducts() {
  try {
    console.log('🔄 Загрузка складов и товаров из базы данных...');
    
    const dbWarehouses = await database.getAllWarehouses();
    const dbProducts = await database.getAllProducts();
    
    console.log(`📦 Найдено в БД: складов ${dbWarehouses.length}, товаров ${dbProducts.length}`);
    
    if (dbWarehouses.length > 0) {
      warehouses = dbWarehouses.map(w => w.name);
      console.log('🏬 Склады из БД:', warehouses);
    } else {
      warehouses = ['Склад №1', 'Склад №2', 'Склад №3', 'Другой'];
      console.log('⚠️ Используются склады по умолчанию:', warehouses);
    }
    
    if (dbProducts.length > 0) {
      products = dbProducts.map(p => p.name);
      console.log('🛒 Товары из БД:', products);
    } else {
      products = ['Цемент', 'Песок', 'Щебень', 'Кирпич', 'Арматура', 'Другое'];
      console.log('⚠️ Используются товары по умолчанию:', products);
    }
    
    console.log(`✅ Загружено складов: ${warehouses.length}, товаров: ${products.length}`);
    return { warehouses, products };
  } catch (error) {
    console.error('❌ Ошибка загрузки складов и товаров:', error);
    // Используем значения по умолчанию
    warehouses = ['Склад №1', 'Склад №2', 'Склад №3', 'Другой'];
    products = ['Цемент', 'Песок', 'Щебень', 'Кирпич', 'Арматура', 'Другое'];
    console.log('⚠️ Используются значения по умолчанию из-за ошибки');
    return { warehouses, products };
  }
}

// Функция получения текущих данных
function getCurrentData() {
  return { warehouses, products };
}

// Функция добавления склада с автоматическим обновлением
async function addWarehouseAndReload(name) {
  try {
    const warehouseId = await database.addWarehouse(name);
    console.log(`✅ Склад "${name}" добавлен в БД с ID: ${warehouseId}`);
    
    // Перезагружаем данные
    await loadWarehousesAndProducts();
    console.log('🔄 Данные складов обновлены в памяти');
    
    return warehouseId;
  } catch (error) {
    console.error('❌ Ошибка добавления склада:', error);
    
    // Если склад уже существует, просто обновляем данные
    if (error.code === 'WAREHOUSE_EXISTS') {
      console.log('⚠️ Склад уже существует, обновляем данные...');
      await loadWarehousesAndProducts();
    }
    
    throw error;
  }
}

// Функция добавления товара с автоматическим обновлением
async function addProductAndReload(name) {
  try {
    const productId = await database.addProduct(name);
    console.log(`✅ Товар "${name}" добавлен в БД с ID: ${productId}`);
    
    // Перезагружаем данные
    await loadWarehousesAndProducts();
    console.log('🔄 Данные товаров обновлены в памяти');
    
    return productId;
  } catch (error) {
    console.error('❌ Ошибка добавления товара:', error);
    
    // Если товар уже существует, просто обновляем данные
    if (error.code === 'PRODUCT_EXISTS') {
      console.log('⚠️ Товар уже существует, обновляем данные...');
      await loadWarehousesAndProducts();
    }
    
    throw error;
  }
}

// Функция удаления склада с автоматическим обновлением
async function removeWarehouseAndReload(id) {
  try {
    const result = await database.removeWarehouse(id);
    console.log(`✅ Склад с ID ${id} удален из БД`);
    
    // Перезагружаем данные
    await loadWarehousesAndProducts();
    console.log('🔄 Данные складов обновлены в памяти');
    
    return result;
  } catch (error) {
    console.error('❌ Ошибка удаления склада:', error);
    throw error;
  }
}

// Функция удаления товара с автоматическим обновлением
async function removeProductAndReload(id) {
  try {
    const result = await database.removeProduct(id);
    console.log(`✅ Товар с ID ${id} удален из БД`);
    
    // Перезагружаем данные
    await loadWarehousesAndProducts();
    console.log('🔄 Данные товаров обновлены в памяти');
    
    return result;
  } catch (error) {
    console.error('❌ Ошибка удаления товара:', error);
    throw error;
  }
}

module.exports = {
  loadWarehousesAndProducts,
  getCurrentData,
  addWarehouseAndReload,
  addProductAndReload,
  removeWarehouseAndReload,
  removeProductAndReload,
  // Геттеры для совместимости
  get warehouses() { return warehouses; },
  get products() { return products; }
};