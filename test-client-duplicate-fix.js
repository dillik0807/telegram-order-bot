/**
 * Тест исправления проблемы с дубликатами клиентов
 * 
 * Проблема: При каждом новом запросе на добавление клиента 
 * весь список клиентов исчезает и приходится добавлять всё заново
 * 
 * Решение: Добавлена проверка на существующих клиентов перед добавлением
 */

require('dotenv').config();
const database = require('./database');

async function testClientDuplicateFix() {
  console.log('🧪 Тест исправления дубликатов клиентов\n');
  
  try {
    // 1. Получаем текущий список клиентов
    console.log('📋 Шаг 1: Получение текущего списка клиентов...');
    const clientsBefore = await database.getAllClients();
    console.log(`✅ Найдено клиентов: ${clientsBefore.length}`);
    
    if (clientsBefore.length > 0) {
      console.log('\n👥 Текущие клиенты:');
      clientsBefore.forEach((client, index) => {
        console.log(`${index + 1}. ${client.name || 'Без имени'} (ID: ${client.telegram_id})`);
        console.log(`   📞 ${client.phone || 'Без телефона'}`);
      });
    }
    
    // 2. Пытаемся добавить тестового клиента
    console.log('\n📝 Шаг 2: Добавление тестового клиента...');
    const testClientId = 999999999; // Тестовый ID
    const testName = 'Тестовый Клиент';
    const testPhone = '+992900000000';
    const adminId = 5889669586;
    
    try {
      await database.addClient(testClientId, testName, testPhone, adminId);
      console.log(`✅ Тестовый клиент добавлен: ${testName} (ID: ${testClientId})`);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        console.log(`⚠️ Тестовый клиент уже существует (это нормально)`);
      } else {
        throw error;
      }
    }
    
    // 3. Проверяем, что список клиентов не исчез
    console.log('\n📋 Шаг 3: Проверка списка клиентов после добавления...');
    const clientsAfter = await database.getAllClients();
    console.log(`✅ Найдено клиентов: ${clientsAfter.length}`);
    
    if (clientsAfter.length > 0) {
      console.log('\n👥 Клиенты после добавления:');
      clientsAfter.forEach((client, index) => {
        console.log(`${index + 1}. ${client.name || 'Без имени'} (ID: ${client.telegram_id})`);
        console.log(`   📞 ${client.phone || 'Без телефона'}`);
      });
    }
    
    // 4. Проверяем результат
    console.log('\n🔍 Шаг 4: Анализ результатов...');
    
    if (clientsAfter.length === 0) {
      console.log('❌ ОШИБКА: Список клиентов исчез!');
      console.log('   Проблема НЕ решена.');
      return false;
    }
    
    if (clientsAfter.length < clientsBefore.length) {
      console.log('❌ ОШИБКА: Количество клиентов уменьшилось!');
      console.log(`   Было: ${clientsBefore.length}, Стало: ${clientsAfter.length}`);
      console.log('   Проблема НЕ решена.');
      return false;
    }
    
    console.log('✅ УСПЕХ: Список клиентов сохранился!');
    console.log(`   Было: ${clientsBefore.length}, Стало: ${clientsAfter.length}`);
    
    // 5. Тестируем повторное добавление того же клиента
    console.log('\n📝 Шаг 5: Попытка повторного добавления того же клиента...');
    
    try {
      await database.addClient(testClientId, testName, testPhone, adminId);
      console.log('⚠️ Клиент добавлен повторно (не должно было произойти)');
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        console.log('✅ Повторное добавление заблокировано (правильно!)');
      } else {
        throw error;
      }
    }
    
    // 6. Проверяем список снова
    console.log('\n📋 Шаг 6: Финальная проверка списка клиентов...');
    const clientsFinal = await database.getAllClients();
    console.log(`✅ Найдено клиентов: ${clientsFinal.length}`);
    
    if (clientsFinal.length !== clientsAfter.length) {
      console.log('❌ ОШИБКА: Количество клиентов изменилось после повторной попытки!');
      console.log(`   Было: ${clientsAfter.length}, Стало: ${clientsFinal.length}`);
      return false;
    }
    
    console.log('✅ Количество клиентов стабильно');
    
    // 7. Тестируем функцию approveClient
    console.log('\n📝 Шаг 7: Тестирование функции approveClient...');
    
    const testRequestId = 888888888;
    const testRequestName = 'Новый Запрос';
    
    // Создаем запрос на регистрацию
    try {
      await database.createRegistrationRequest(testRequestId, testRequestName, 'test_user');
      console.log(`✅ Создан запрос на регистрацию для ID: ${testRequestId}`);
    } catch (error) {
      console.log(`⚠️ Запрос уже существует (это нормально)`);
    }
    
    // Одобряем клиента
    const approved = await database.approveClient(testRequestId, testRequestName, '', adminId);
    
    if (approved) {
      console.log(`✅ Клиент ${testRequestId} успешно одобрен`);
    } else {
      console.log(`⚠️ Клиент ${testRequestId} уже существовал`);
    }
    
    // Проверяем список снова
    const clientsAfterApprove = await database.getAllClients();
    console.log(`✅ Клиентов после одобрения: ${clientsAfterApprove.length}`);
    
    // 8. Пытаемся одобрить того же клиента повторно
    console.log('\n📝 Шаг 8: Попытка повторного одобрения...');
    const approvedAgain = await database.approveClient(testRequestId, testRequestName, '', adminId);
    
    if (approvedAgain) {
      console.log('❌ ОШИБКА: Клиент был добавлен повторно!');
      return false;
    } else {
      console.log('✅ Повторное одобрение заблокировано (правильно!)');
    }
    
    // Финальная проверка
    const clientsEnd = await database.getAllClients();
    console.log(`✅ Финальное количество клиентов: ${clientsEnd.length}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
    console.log('='.repeat(50));
    console.log('\n✅ Проблема с исчезновением клиентов РЕШЕНА!');
    console.log('✅ Дубликаты клиентов блокируются корректно');
    console.log('✅ Список клиентов остается стабильным');
    
    // Очистка тестовых данных
    console.log('\n🧹 Очистка тестовых данных...');
    try {
      await database.removeClient(testClientId);
      await database.removeClient(testRequestId);
      console.log('✅ Тестовые клиенты удалены');
    } catch (error) {
      console.log('⚠️ Не удалось удалить тестовые данные (не критично)');
    }
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ОШИБКА В ТЕСТЕ:', error);
    return false;
  } finally {
    database.close();
  }
}

// Запуск теста
testClientDuplicateFix()
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
