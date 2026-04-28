/**
 * Тест складов и товаров
 */

const database = require('./database');

async function testWarehousesAndProducts() {
  console.log('🧪 Тестирование складов и товаров...\n');
  
  try {
    console.log('1️⃣ Проверка складов в базе данных...');
    const warehouses = await database.getAllWarehouses();
    console.log(`📦 Найдено складов: ${warehouses.length}`);
    
    if (warehouses.length > 0) {
      console.log('📋 Список складов:');
      warehouses.forEach((warehouse, index) => {
        console.log(`${index + 1}. ID: ${warehouse.id}, Название: "${warehouse.name}", Активен: ${warehouse.is_active ? 'Да' : 'Нет'}`);
      });
    } else {
      console.log('❌ Складов в базе данных нет');
    }
    
    console.log('\n2️⃣ Проверка товаров в базе данных...');
    const products = await database.getAllProducts();
    console.log(`🛒 Найдено товаров: ${products.length}`);
    
    if (products.length > 0) {
      console.log('📋 Список товаров:');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}, Название: "${product.name}", Активен: ${product.is_active ? 'Да' : 'Нет'}`);
      });
    } else {
      console.log('❌ Товаров в базе данных нет');
    }
    
    console.log('\n3️⃣ Симуляция логики bot.js...');
    
    // Симулируем логику из loadWarehousesAndProducts
    const warehouseNames = warehouses.length > 0 
      ? warehouses.map(w => w.name)
      : ['Склад №1', 'Склад №2', 'Склад №3', 'Другой'];
    
    const productNames = products.length > 0
      ? products.map(p => p.name)
      : ['Цемент', 'Песок', 'Щебень', 'Кирпич', 'Арматура', 'Другое'];
    
    console.log('🏬 Склады, которые увидит пользователь:');
    warehouseNames.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
    console.log('\n🛒 Товары, которые увидит пользователь:');
    productNames.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
    console.log('\n4️⃣ Тест добавления нового склада...');
    
    try {
      const testWarehouseName = 'Тестовый склад ' + Date.now();
      console.log(`➕ Добавляем склад: "${testWarehouseName}"`);
      
      const warehouseId = await database.addWarehouse(testWarehouseName);
      console.log(`✅ Склад добавлен с ID: ${warehouseId}`);
      
      // Проверяем, что склад появился
      const updatedWarehouses = await database.getAllWarehouses();
      const newWarehouse = updatedWarehouses.find(w => w.id === warehouseId);
      
      if (newWarehouse) {
        console.log(`✅ Склад найден в базе: "${newWarehouse.name}"`);
        
        // Симулируем перезагрузку как в bot.js
        const newWarehouseNames = updatedWarehouses.length > 0 
          ? updatedWarehouses.map(w => w.name)
          : ['Склад №1', 'Склад №2', 'Склад №3', 'Другой'];
        
        console.log('🔄 После перезагрузки пользователь увидит:');
        newWarehouseNames.forEach((name, index) => {
          console.log(`${index + 1}. ${name}`);
        });
        
        // Удаляем тестовый склад
        console.log('🗑️ Удаляем тестовый склад...');
        await database.removeWarehouse(warehouseId);
        console.log('✅ Тестовый склад удален');
        
      } else {
        console.log('❌ Склад НЕ найден в базе после добавления');
      }
      
    } catch (error) {
      console.error('❌ Ошибка при тестировании добавления склада:', error);
    }
    
    console.log('\n5️⃣ Тест добавления нового товара...');
    
    try {
      const testProductName = 'Тестовый товар ' + Date.now();
      console.log(`➕ Добавляем товар: "${testProductName}"`);
      
      const productId = await database.addProduct(testProductName);
      console.log(`✅ Товар добавлен с ID: ${productId}`);
      
      // Проверяем, что товар появился
      const updatedProducts = await database.getAllProducts();
      const newProduct = updatedProducts.find(p => p.id === productId);
      
      if (newProduct) {
        console.log(`✅ Товар найден в базе: "${newProduct.name}"`);
        
        // Симулируем перезагрузку как в bot.js
        const newProductNames = updatedProducts.length > 0
          ? updatedProducts.map(p => p.name)
          : ['Цемент', 'Песок', 'Щебень', 'Кирпич', 'Арматура', 'Другое'];
        
        console.log('🔄 После перезагрузки пользователь увидит:');
        newProductNames.forEach((name, index) => {
          console.log(`${index + 1}. ${name}`);
        });
        
        // Удаляем тестовый товар
        console.log('🗑️ Удаляем тестовый товар...');
        await database.removeProduct(productId);
        console.log('✅ Тестовый товар удален');
        
      } else {
        console.log('❌ Товар НЕ найден в базе после добавления');
      }
      
    } catch (error) {
      console.error('❌ Ошибка при тестировании добавления товара:', error);
    }
    
    console.log('\n📋 ДИАГНОЗ:');
    
    if (warehouses.length === 0 && products.length === 0) {
      console.log('🔍 ПРОБЛЕМА НАЙДЕНА:');
      console.log('- В базе данных НЕТ складов и товаров');
      console.log('- Система использует значения по умолчанию');
      console.log('- Добавленные данные сохраняются, но не отображаются');
      console.log('');
      console.log('💡 РЕШЕНИЕ:');
      console.log('- Нужно изменить логику loadWarehousesAndProducts');
      console.log('- Убрать автоматическую замену на значения по умолчанию');
      console.log('- Или добавить базовые склады и товары в БД');
    } else {
      console.log('✅ В базе данных есть склады и/или товары');
      console.log('- Система должна работать корректно');
      console.log('- Возможно проблема в другом месте');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Запуск теста
if (require.main === module) {
  testWarehousesAndProducts().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = testWarehousesAndProducts;