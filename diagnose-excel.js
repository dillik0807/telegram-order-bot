/**
 * Диагностика проблем с экспортом Excel
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const database = require('./database-wrapper');

async function diagnoseExcel() {
  console.log('🔍 Диагностика экспорта Excel\n');
  console.log('═'.repeat(60));
  
  try {
    // 1. Проверка базы данных
    console.log('\n📊 Проверка базы данных...');
    const stats = await database.getStats();
    console.log(`✅ База данных подключена`);
    console.log(`   👥 Клиентов: ${stats.totalClients}`);
    console.log(`   📦 Заявок: ${stats.totalOrders}`);
    console.log(`   📅 Заявок сегодня: ${stats.ordersToday}`);
    console.log(`   📅 Заявок за неделю: ${stats.ordersWeek}`);
    
    if (stats.totalOrders === 0) {
      console.log('\n⚠️ ПРОБЛЕМА: В базе данных нет заявок!');
      console.log('   Экспорт будет пустым.');
      console.log('\n💡 Решение:');
      console.log('   1. Создайте хотя бы одну заявку через бота');
      console.log('   2. Или проверьте, что DATABASE_URL настроен правильно');
    }
    
    // 2. Проверка папки exports
    console.log('\n📂 Проверка папки exports...');
    const exportDir = './exports';
    
    if (!fs.existsSync(exportDir)) {
      console.log('⚠️ Папка exports не существует');
      console.log('   Создаю папку...');
      try {
        fs.mkdirSync(exportDir);
        console.log('✅ Папка exports создана');
      } catch (error) {
        console.log(`❌ Ошибка создания папки: ${error.message}`);
        console.log('\n💡 Решение:');
        console.log('   Проверьте права доступа к файловой системе');
      }
    } else {
      console.log('✅ Папка exports существует');
      
      // Проверяем права на запись
      try {
        const testFile = path.join(exportDir, 'test.txt');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('✅ Права на запись в папку exports есть');
      } catch (error) {
        console.log(`❌ Нет прав на запись: ${error.message}`);
        console.log('\n💡 Решение:');
        console.log('   Проверьте права доступа к папке exports');
      }
    }
    
    // 3. Проверка модуля xlsx
    console.log('\n📦 Проверка модуля xlsx...');
    try {
      const XLSX = require('xlsx');
      console.log('✅ Модуль xlsx установлен');
      console.log(`   Версия: ${XLSX.version || 'неизвестна'}`);
    } catch (error) {
      console.log('❌ Модуль xlsx не установлен');
      console.log('\n💡 Решение:');
      console.log('   Запустите: npm install xlsx');
    }
    
    // 4. Проверка методов базы данных
    console.log('\n🔍 Проверка методов базы данных...');
    
    const methods = [
      'getDetailedOrderStats',
      'getRecentOrdersWithClients',
      'getWarehouseStats',
      'getOrderWithItems'
    ];
    
    for (const method of methods) {
      if (typeof database[method] === 'function') {
        console.log(`   ✅ ${method}`);
      } else {
        console.log(`   ❌ ${method} - НЕ НАЙДЕН!`);
      }
    }
    
    // 5. Тестовый экспорт
    console.log('\n🧪 Тестовый экспорт...');
    
    if (stats.totalOrders > 0) {
      try {
        const excelExporter = require('./excel-export');
        const result = await excelExporter.exportClientStats();
        
        if (result.success) {
          console.log('✅ Тестовый экспорт успешен');
          console.log(`   📁 Файл: ${result.fileName}`);
          console.log(`   📂 Путь: ${result.filePath}`);
          
          // Проверяем, что файл существует
          if (fs.existsSync(result.filePath)) {
            const stats = fs.statSync(result.filePath);
            console.log(`   📊 Размер файла: ${stats.size} байт`);
          } else {
            console.log('   ⚠️ Файл не найден после создания!');
          }
        } else {
          console.log(`❌ Ошибка экспорта: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ Ошибка: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
      }
    } else {
      console.log('⚠️ Пропущен (нет заявок в базе)');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 ИТОГИ ДИАГНОСТИКИ:');
    
    if (stats.totalOrders === 0) {
      console.log('\n❌ ОСНОВНАЯ ПРОБЛЕМА: Нет заявок в базе данных');
      console.log('\n💡 ЧТО ДЕЛАТЬ:');
      console.log('   1. Проверьте, что DATABASE_URL настроен правильно');
      console.log('   2. Создайте тестовую заявку через бота');
      console.log('   3. Запустите этот скрипт снова');
    } else {
      console.log('\n✅ Все проверки пройдены!');
      console.log('\n💡 Если экспорт все равно не работает:');
      console.log('   1. Проверьте логи бота на Railway');
      console.log('   2. Убедитесь, что бот перезапущен после обновления');
      console.log('   3. Отправьте боту команду /checkdb');
    }
    
    console.log('\n' + '═'.repeat(60));
    
    database.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    console.error('\n📋 Stack trace:', error.stack);
    
    database.close();
    process.exit(1);
  }
}

// Запуск диагностики
diagnoseExcel();
