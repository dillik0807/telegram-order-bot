/**
 * Тест добавления складов и товаров с проверкой дубликатов
 */

require('dotenv').config();
const database = require('./database');

async function testWarehousesAndProducts() {
  console.log('🧪 Тест добавления складов и товаров\n');
  
  try {
    // ========== ТЕСТ СКЛАДОВ ==========
    console.log('=' .repeat(60));
    console.log('📦 ТЕСТ СКЛАДОВ');
    console.log('='.repeat(60));
    
    // Шаг 1: Получаем текущий список складов
    console.log('\n📋 Шаг 1: Текущий список складов...');
    const warehousesBefore = await database.getAllWarehouses();
    console.log(`✅ Найдено складов: ${warehousesBefore.length}`);
    
    if (warehousesBefore.length > 0) {
      console.log('\n🏬 Существующие склады:');
      warehousesBefore.forEach((w, index) => {
        console.log(`${index + 1}. ${w.name} (ID: ${w.id})`);
      });
    }
    
    // Шаг 2: Добавляем тестовый склад
    console.log('\n📝 Шаг 2: Добавление тестового склада...');
    const testWarehouseName = 'Тестовый Склад ' + Date.now();
    
    try {
      const warehouseId = await database.addWarehouse(testWarehouseName, null);
      console.log(`✅ Склад "${testWarehouseName}" добавлен (ID: ${warehouseId})`);
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
      return false;
    }
    
    // Шаг 3: Проверяем, что склад добавлен
    console.log('\n📋 Шаг 3: Проверка добавленного склада...');
    const warehousesAfter = await database.getAllWarehouses();
    console.log(`✅ Найдено складов: ${warehousesAfter.length}`);
    
    if (warehousesAfter.length !== warehousesBefore.length + 1) {
      console.log('❌ ОШИБКА: Количество складов не увеличилось!');
      return false;
    }
    console.log('✅ Склад успешно добавлен');
    
    // Шаг 4: Попытка добавить дубликат
    console.log('\n📝 Шаг 4: Попытка добавить дубликат склада...');
    
    try {
      await database.addWarehouse(testWarehouseName, null);
      console.log('❌ ОШИБКА: Дубликат был добавлен!');
      return false;
    } catch (error) {
      if (error.code === 'WAREHOUSE_EXISTS') {
        console.log('✅ Дубликат заблокирован (правильно!)');
        console.log(`   Сообщение: ${error.message}`);
      } else {
        console.log(`❌ Неожиданная ошибка: ${error.message}`);
        return false;
      }
    }
    
    // Шаг 5: Проверяем, что количество не изменилось
    console.log('\n📋 Шаг 5: Проверка количества складов...');
    const warehousesFinal = await database.getAllWarehouses();
    console.log(`✅ Найдено складов: ${warehousesFinal.length}`);
    
    if (warehousesFinal.length !== warehousesAfter.length) {
      console.log('❌ ОШИБКА: Количество складов изменилось!');
      return false;
    }
    console.log('✅ Количество складов стабильно');
    
    // ========== ТЕСТ ТОВАРОВ ==========
    console.log('\n' + '='.repeat(60));
    console.log('🛒 ТЕСТ ТОВАРОВ');
    console.log('='.repeat(60));
    
    // Шаг 6: Получаем текущий список товаров
    console.log('\n📋 Шаг 6: Текущий список товаров...');
    const productsBefore = await database.getAllProducts();
    console.log(`✅ Найдено товаров: ${productsBefore.length}`);
    
    if (productsBefore.length > 0) {
      console.log('\n🛒 Существующие товары:');
      productsBefore.slice(0, 5).forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} (ID: ${p.id})`);
      });
      if (productsBefore.length > 5) {
        console.log(`... и еще ${productsBefore.length - 5} товаров`);
      }
    }
    
    // Шаг 7: Добавляем тестовый товар
    console.log('\n📝 Шаг 7: Добавление тестового товара...');
    const testProductName = 'Тестовый Товар ' + Date.now();
    
    try {
      const productId = await database.addProduct(testProductName);
      console.log(`✅ Товар "${testProductName}" добавлен (ID: ${productId})`);
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
      return false;
    }
    
    // Шаг 8: Проверяем, что товар добавлен
    console.log('\n📋 Шаг 8: Проверка добавленного товара...');
    const productsAfter = await database.getAllProducts();
    console.log(`✅ Найдено товаров: ${productsAfter.length}`);
    
    if (productsAfter.length !== productsBefore.length + 1) {
      console.log('❌ ОШИБКА: Количество товаров не увеличилось!');
      return false;
    }
    console.log('✅ Товар успешно добавлен');
    
    // Шаг 9: Попытка добавить дубликат
    console.log('\n📝 Шаг 9: Попытка добавить дубликат товара...');
    
    try {
      await database.addProduct(testProductName);
      console.log('❌ ОШИБКА: Дубликат был добавлен!');
      return false;
    } catch (error) {
      if (error.code === 'PRODUCT_EXISTS') {
        console.log('✅ Дубликат заблокирован (правильно!)');
        console.log(`   Сообщение: ${error.message}`);
      } else {
        console.log(`❌ Неожиданная ошибка: ${error.message}`);
        return false;
      }
    }
    
    // Шаг 10: Проверяем, что количество не изменилось
    console.log('\n📋 Шаг 10: Проверка количества товаров...');
    const productsFinal = await database.getAllProducts();
    console.log(`✅ Найдено товаров: ${productsFinal.length}`);
    
    if (productsFinal.length !== productsAfter.length) {
      console.log('❌ ОШИБКА: Количество товаров изменилось!');
      return false;
    }
    console.log('✅ Количество товаров стабильно');
    
    // ========== ОЧИСТКА ==========
    console.log('\n' + '='.repeat(60));
    console.log('🧹 ОЧИСТКА ТЕСТОВЫХ ДАННЫХ');
    console.log('='.repeat(60));
    
    // Находим ID тестовых данных
    const testWarehouse = warehousesFinal.find(w => w.name === testWarehouseName);
    const testProduct = productsFinal.find(p => p.name === testProductName);
    
    if (testWarehouse) {
      await database.removeWarehouse(testWarehouse.id);
      console.log(`✅ Тестовый склад удален (ID: ${testWarehouse.id})`);
    }
    
    if (testProduct) {
      await database.removeProduct(testProduct.id);
      console.log(`✅ Тестовый товар удален (ID: ${testProduct.id})`);
    }
    
    // ========== ИТОГИ ==========
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
    console.log('='.repeat(60));
    console.log('\n✅ Склады:');
    console.log('   - Добавление работает');
    console.log('   - Дубликаты блокируются');
    console.log('   - Данные стабильны');
    console.log('\n✅ Товары:');
    console.log('   - Добавление работает');
    console.log('   - Дубликаты блокируются');
    console.log('   - Данные стабильны');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    database.close();
  }
}

// Запуск теста
testWarehousesAndProducts()
  .then(success => {
    if (success) {
      console.log('\n✅ Тест завершен успешно');
      process.exit(0);
    } else {
      console.log('\n❌ Тест провален');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Критическая ошибка:', error);
    process.exit(1);
  });
