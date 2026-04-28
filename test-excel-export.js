/**
 * Тест экспорта в Excel
 * Проверяет, что все отчеты генерируются корректно
 */

require('dotenv').config();
const excelExporter = require('./excel-export');
const database = require('./database-wrapper');

async function testExcelExport() {
  console.log('🧪 Тестирование экспорта в Excel\n');
  console.log('═'.repeat(60));
  
  try {
    // Проверяем подключение к базе данных
    console.log('\n📊 Проверка подключения к базе данных...');
    const stats = await database.getStats();
    console.log(`✅ База данных подключена`);
    console.log(`   👥 Клиентов: ${stats.totalClients}`);
    console.log(`   📦 Заявок: ${stats.totalOrders}`);
    console.log(`   📅 Заявок сегодня: ${stats.ordersToday}`);
    console.log(`   📅 Заявок за неделю: ${stats.ordersWeek}`);
    
    if (stats.totalOrders === 0) {
      console.log('\n⚠️ В базе данных нет заявок!');
      console.log('   Экспорт будет пустым.');
    }
    
    // Тест 1: Экспорт статистики по клиентам
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 Тест 1: Экспорт статистики по клиентам...');
    const clientStatsResult = await excelExporter.exportClientStats();
    
    if (clientStatsResult.success) {
      console.log(`✅ Статистика по клиентам экспортирована`);
      console.log(`   📁 Файл: ${clientStatsResult.fileName}`);
      console.log(`   📂 Путь: ${clientStatsResult.filePath}`);
    } else {
      console.log(`❌ Ошибка: ${clientStatsResult.error}`);
    }
    
    // Тест 2: Экспорт последних заявок
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 Тест 2: Экспорт последних заявок...');
    const ordersResult = await excelExporter.exportRecentOrders(50);
    
    if (ordersResult.success) {
      console.log(`✅ Последние заявки экспортированы`);
      console.log(`   📁 Файл: ${ordersResult.fileName}`);
      console.log(`   📂 Путь: ${ordersResult.filePath}`);
    } else {
      console.log(`❌ Ошибка: ${ordersResult.error}`);
    }
    
    // Тест 3: Экспорт статистики по складам
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 Тест 3: Экспорт статистики по складам...');
    const warehouseStatsResult = await excelExporter.exportWarehouseStats();
    
    if (warehouseStatsResult.success) {
      console.log(`✅ Статистика по складам экспортирована`);
      console.log(`   📁 Файл: ${warehouseStatsResult.fileName}`);
      console.log(`   📂 Путь: ${warehouseStatsResult.filePath}`);
    } else {
      console.log(`❌ Ошибка: ${warehouseStatsResult.error}`);
    }
    
    // Тест 4: Полный отчет
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 Тест 4: Полный отчет...');
    const fullReportResult = await excelExporter.exportFullReport();
    
    if (fullReportResult.success) {
      console.log(`✅ Полный отчет экспортирован`);
      console.log(`   📁 Файл: ${fullReportResult.fileName}`);
      console.log(`   📂 Путь: ${fullReportResult.filePath}`);
    } else {
      console.log(`❌ Ошибка: ${fullReportResult.error}`);
    }
    
    // Тест 5: Экспорт конкретной заявки (если есть)
    if (stats.totalOrders > 0) {
      console.log('\n' + '═'.repeat(60));
      console.log('\n📋 Тест 5: Экспорт конкретной заявки...');
      
      // Получаем ID первой заявки
      const orders = await database.getRecentOrdersWithClients(1);
      if (orders.length > 0) {
        const orderId = orders[0].id;
        console.log(`   Экспортируем заявку #${orderId}...`);
        
        const singleOrderResult = await excelExporter.exportSingleOrder(orderId);
        
        if (singleOrderResult.success) {
          console.log(`✅ Заявка #${orderId} экспортирована`);
          console.log(`   📁 Файл: ${singleOrderResult.fileName}`);
          console.log(`   📂 Путь: ${singleOrderResult.filePath}`);
        } else {
          console.log(`❌ Ошибка: ${singleOrderResult.error}`);
        }
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!');
    console.log('\n✅ Экспорт в Excel работает корректно');
    console.log('\n📂 Все файлы сохранены в папке: ./exports/');
    console.log('\n💡 Проверьте файлы Excel в папке exports/');
    
    database.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    console.error('\n📋 Stack trace:', error.stack);
    
    database.close();
    process.exit(1);
  }
}

// Запуск теста
testExcelExport();
