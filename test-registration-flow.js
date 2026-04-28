/**
 * Тест полного процесса регистрации клиента
 * 
 * Проверяет:
 * 1. Создание запроса на регистрацию
 * 2. Одобрение клиента администратором
 * 3. Проверка, что клиент добавлен в таблицу clients
 * 4. Проверка, что isClient возвращает true
 */

require('dotenv').config();
const database = require('./database');

async function testRegistrationFlow() {
  console.log('🧪 Тест полного процесса регистрации\n');
  
  const testUserId = 777777777; // Тестовый ID
  const testUserName = 'Тестовый Пользователь';
  const testUsername = 'test_user';
  const adminId = 5889669586;
  
  try {
    // Шаг 1: Очистка тестовых данных (если есть)
    console.log('🧹 Шаг 1: Очистка старых тестовых данных...');
    try {
      await database.removeClient(testUserId);
      console.log('✅ Старые данные очищены');
    } catch (error) {
      console.log('⚠️ Нет старых данных для очистки (это нормально)');
    }
    
    // Шаг 2: Проверяем, что клиент НЕ существует
    console.log('\n📋 Шаг 2: Проверка, что клиент не существует...');
    const isClientBefore = await database.isClient(testUserId);
    console.log(`Результат isClient: ${isClientBefore}`);
    
    if (isClientBefore) {
      console.log('❌ ОШИБКА: Клиент уже существует до регистрации!');
      return false;
    }
    console.log('✅ Клиент не существует (правильно)');
    
    // Шаг 3: Создаем запрос на регистрацию
    console.log('\n📝 Шаг 3: Создание запроса на регистрацию...');
    await database.createRegistrationRequest(testUserId, testUserName, testUsername);
    console.log(`✅ Запрос создан для пользователя ${testUserName} (ID: ${testUserId})`);
    
    // Шаг 4: Проверяем, что запрос создан
    console.log('\n🔍 Шаг 4: Проверка созданного запроса...');
    const pendingRequest = await database.getPendingRequest(testUserId);
    
    if (!pendingRequest) {
      console.log('❌ ОШИБКА: Запрос не найден!');
      return false;
    }
    
    console.log('✅ Запрос найден:');
    console.log(`   👤 Имя: ${pendingRequest.name}`);
    console.log(`   🆔 ID: ${pendingRequest.telegram_id}`);
    console.log(`   📱 Username: ${pendingRequest.username}`);
    console.log(`   📊 Статус: ${pendingRequest.status}`);
    
    // Шаг 5: Проверяем, что клиент ВСЕ ЕЩЕ не существует
    console.log('\n📋 Шаг 5: Проверка, что клиент все еще не существует...');
    const isClientAfterRequest = await database.isClient(testUserId);
    console.log(`Результат isClient: ${isClientAfterRequest}`);
    
    if (isClientAfterRequest) {
      console.log('❌ ОШИБКА: Клиент существует до одобрения!');
      return false;
    }
    console.log('✅ Клиент не существует (правильно)');
    
    // Шаг 6: Одобряем клиента (как администратор)
    console.log('\n✅ Шаг 6: Одобрение клиента администратором...');
    const approved = await database.approveClient(testUserId, testUserName, '', adminId);
    
    if (!approved) {
      console.log('❌ ОШИБКА: approveClient вернул false!');
      console.log('   Это означает, что клиент не был добавлен.');
      return false;
    }
    
    console.log('✅ approveClient вернул true (клиент добавлен)');
    
    // Шаг 7: КРИТИЧЕСКАЯ ПРОВЕРКА - проверяем, что клиент ТЕПЕРЬ существует
    console.log('\n🔍 Шаг 7: КРИТИЧЕСКАЯ ПРОВЕРКА - проверка существования клиента...');
    const isClientAfterApproval = await database.isClient(testUserId);
    console.log(`Результат isClient: ${isClientAfterApproval}`);
    
    if (!isClientAfterApproval) {
      console.log('❌ КРИТИЧЕСКАЯ ОШИБКА: Клиент НЕ существует после одобрения!');
      console.log('   Это и есть причина проблемы!');
      console.log('\n🔍 Проверяем таблицу clients напрямую...');
      
      const client = await database.getClient(testUserId);
      if (client) {
        console.log('✅ Клиент найден в таблице clients:');
        console.log(`   👤 Имя: ${client.name}`);
        console.log(`   📞 Телефон: ${client.phone}`);
        console.log(`   🆔 ID: ${client.telegram_id}`);
        console.log(`   ✅ Активен: ${client.is_active}`);
        
        if (client.is_active === 0) {
          console.log('❌ ПРОБЛЕМА: Клиент неактивен (is_active = 0)!');
        }
      } else {
        console.log('❌ Клиент НЕ найден в таблице clients!');
        console.log('   approveClient не добавил клиента в базу!');
      }
      
      return false;
    }
    
    console.log('✅ Клиент существует после одобрения (правильно!)');
    
    // Шаг 8: Проверяем данные клиента
    console.log('\n📋 Шаг 8: Проверка данных клиента...');
    const client = await database.getClient(testUserId);
    
    if (!client) {
      console.log('❌ ОШИБКА: Не удалось получить данные клиента!');
      return false;
    }
    
    console.log('✅ Данные клиента:');
    console.log(`   👤 Имя: ${client.name}`);
    console.log(`   📞 Телефон: ${client.phone || 'Не указан'}`);
    console.log(`   🆔 Telegram ID: ${client.telegram_id}`);
    console.log(`   👨‍💼 Добавил: ${client.added_by}`);
    console.log(`   ✅ Активен: ${client.is_active}`);
    console.log(`   📅 Создан: ${new Date(client.created_at).toLocaleString('ru-RU')}`);
    
    // Шаг 9: Проверяем статус запроса
    console.log('\n📋 Шаг 9: Проверка статуса запроса...');
    const requestAfterApproval = await database.getRegistrationRequest(testUserId);
    
    if (requestAfterApproval) {
      console.log('⚠️ Запрос все еще существует (статус: pending)');
      console.log('   Это означает, что запрос не был обновлен.');
    } else {
      console.log('✅ Запрос обработан (статус изменен на approved)');
    }
    
    // Шаг 10: Симулируем повторный /start
    console.log('\n🔄 Шаг 10: Симуляция повторного /start...');
    console.log('Проверяем логику:');
    console.log(`1. isAdmin(${testUserId}) = false`);
    console.log(`2. isClient(${testUserId}) = ${await database.isClient(testUserId)}`);
    
    const isClientFinal = await database.isClient(testUserId);
    
    if (isClientFinal) {
      console.log('✅ Клиент будет распознан как зарегистрированный');
      console.log('✅ Будет показано меню "🏬 Склад"');
    } else {
      console.log('❌ Клиент НЕ будет распознан как зарегистрированный');
      console.log('❌ Будет создан новый запрос на регистрацию');
      console.log('\n🔴 ЭТО И ЕСТЬ ПРОБЛЕМА!');
    }
    
    // Итоги
    console.log('\n' + '='.repeat(60));
    
    if (isClientFinal) {
      console.log('🎉 ТЕСТ ПРОЙДЕН УСПЕШНО!');
      console.log('='.repeat(60));
      console.log('\n✅ Процесс регистрации работает корректно:');
      console.log('   1. Запрос создается');
      console.log('   2. Администратор одобряет');
      console.log('   3. Клиент добавляется в базу');
      console.log('   4. isClient возвращает true');
      console.log('   5. При /start показывается меню');
    } else {
      console.log('❌ ТЕСТ ПРОВАЛЕН!');
      console.log('='.repeat(60));
      console.log('\n🔴 Проблема в процессе регистрации:');
      console.log('   Клиент не добавляется в таблицу clients');
      console.log('   или is_active = 0');
    }
    
    // Очистка
    console.log('\n🧹 Очистка тестовых данных...');
    await database.removeClient(testUserId);
    console.log('✅ Тестовые данные удалены');
    
    return isClientFinal;
    
  } catch (error) {
    console.error('\n❌ ОШИБКА В ТЕСТЕ:', error);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    database.close();
  }
}

// Запуск теста
testRegistrationFlow()
  .then(success => {
    if (success) {
      console.log('\n✅ Тест завершен успешно');
      process.exit(0);
    } else {
      console.log('\n❌ Тест провален - проблема найдена');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Критическая ошибка:', error);
    process.exit(1);
  });
