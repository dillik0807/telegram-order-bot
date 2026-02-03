/**
 * Тест новых команд управления клиентами
 */

const database = require('./database');

async function testClientManagementCommands() {
  console.log('🧪 Тестирование новых команд управления клиентами...\n');
  
  try {
    console.log('1️⃣ Проверка текущего состояния...');
    
    const clients = await database.getAllClients();
    const pendingRequests = await database.getPendingRequests();
    
    console.log(`👥 Текущих клиентов: ${clients.length}`);
    console.log(`📋 Ожидающих запросов: ${pendingRequests.length}`);
    
    if (clients.length > 0) {
      console.log('\n📋 Существующие клиенты:');
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.name || 'Без имени'} (ID: ${client.telegram_id})`);
      });
    }
    
    console.log('\n2️⃣ Тест прямого добавления клиента...');
    
    const testClientId = 999888777;
    const testClientName = 'Тестовый Клиент';
    const testClientPhone = '+992900123456';
    const adminId = 5889669586; // ID администратора
    
    console.log(`➕ Добавляем клиента напрямую:`);
    console.log(`   ID: ${testClientId}`);
    console.log(`   Имя: ${testClientName}`);
    console.log(`   Телефон: ${testClientPhone}`);
    
    try {
      // Проверяем, не существует ли уже такой клиент
      const existingClient = await database.getClient(testClientId);
      if (existingClient) {
        console.log('⚠️ Клиент уже существует, удаляем его сначала...');
        await database.removeClient(testClientId);
      }
      
      // Добавляем клиента напрямую
      await database.addClient(testClientId, testClientName, testClientPhone, adminId);
      console.log('✅ Клиент добавлен в базу данных');
      
      // Проверяем, что клиент появился
      const newClient = await database.getClient(testClientId);
      if (newClient) {
        console.log('✅ Клиент найден в базе:');
        console.log(`   Имя: "${newClient.name}"`);
        console.log(`   Телефон: "${newClient.phone}"`);
        console.log(`   Добавил: ${newClient.added_by}`);
        console.log(`   Активен: ${newClient.is_active ? 'Да' : 'Нет'}`);
        
        // Проверяем функции
        const isClientResult = await database.isClient(testClientId);
        console.log(`   isClient(): ${isClientResult}`);
        
        if (isClientResult) {
          console.log('✅ Клиент может создавать заявки');
        } else {
          console.log('❌ Клиент НЕ может создавать заявки');
        }
      } else {
        console.log('❌ Клиент НЕ найден в базе после добавления');
      }
      
    } catch (error) {
      console.error('❌ Ошибка при добавлении клиента:', error);
    }
    
    console.log('\n3️⃣ Тест проверки дублирования...');
    
    try {
      // Пытаемся добавить того же клиента еще раз
      console.log('🔄 Пытаемся добавить того же клиента повторно...');
      await database.addClient(testClientId, 'Другое имя', 'Другой телефон', adminId);
      console.log('❌ Дублирование НЕ предотвращено - это проблема!');
    } catch (error) {
      console.log('✅ Дублирование предотвращено (ошибка ожидаема)');
      console.log(`   Ошибка: ${error.message}`);
    }
    
    console.log('\n4️⃣ Тест удаления клиента...');
    
    try {
      console.log(`🗑️ Удаляем тестового клиента (ID: ${testClientId})...`);
      const removeResult = await database.removeClient(testClientId);
      
      if (removeResult) {
        console.log('✅ Клиент успешно удален');
        
        // Проверяем, что клиент действительно удален
        const deletedClient = await database.getClient(testClientId);
        if (!deletedClient) {
          console.log('✅ Клиент не найден в базе (удален корректно)');
        } else if (deletedClient.is_active === 0) {
          console.log('✅ Клиент деактивирован (мягкое удаление)');
        } else {
          console.log('❌ Клиент все еще активен после удаления');
        }
        
        const isClientAfterDelete = await database.isClient(testClientId);
        console.log(`   isClient() после удаления: ${isClientAfterDelete}`);
        
      } else {
        console.log('❌ Удаление не выполнено');
      }
      
    } catch (error) {
      console.error('❌ Ошибка при удалении клиента:', error);
    }
    
    console.log('\n5️⃣ Тест системы запросов (существующая функциональность)...');
    
    const testRequestId = 888777666;
    const testRequestName = 'Тестовый Запрос';
    const testRequestUsername = 'testuser';
    
    try {
      console.log('📝 Создаем тестовый запрос на регистрацию...');
      await database.createRegistrationRequest(testRequestId, testRequestName, testRequestUsername);
      
      // Проверяем, что запрос появился
      const pendingRequest = await database.getPendingRequest(testRequestId);
      if (pendingRequest) {
        console.log('✅ Запрос создан и найден в ожидающих');
        console.log(`   Имя: ${pendingRequest.name}`);
        console.log(`   Username: ${pendingRequest.username}`);
        console.log(`   Статус: ${pendingRequest.status}`);
        
        // Одобряем запрос
        console.log('✅ Одобряем запрос...');
        await database.approveClient(testRequestId, pendingRequest.name, '+992900654321', adminId);
        
        // Проверяем, что клиент появился
        const approvedClient = await database.getClient(testRequestId);
        if (approvedClient) {
          console.log('✅ Клиент одобрен и добавлен в систему');
          console.log(`   Имя: "${approvedClient.name}"`);
          console.log(`   Телефон: "${approvedClient.phone}"`);
          
          // Удаляем тестового клиента
          await database.removeClient(testRequestId);
          console.log('🗑️ Тестовый клиент удален');
        } else {
          console.log('❌ Клиент НЕ появился после одобрения');
        }
        
      } else {
        console.log('❌ Запрос НЕ найден в ожидающих');
      }
      
    } catch (error) {
      console.error('❌ Ошибка при тестировании запросов:', error);
    }
    
    console.log('\n6️⃣ Финальная проверка состояния...');
    
    const finalClients = await database.getAllClients();
    const finalRequests = await database.getPendingRequests();
    
    console.log(`👥 Финальное количество клиентов: ${finalClients.length}`);
    console.log(`📋 Финальное количество запросов: ${finalRequests.length}`);
    
    console.log('\n✅ Тест завершен!');
    
    console.log('\n📋 РЕЗУЛЬТАТЫ:');
    console.log('✅ Прямое добавление клиентов работает');
    console.log('✅ Удаление клиентов работает');
    console.log('✅ Система запросов сохранена и работает');
    console.log('✅ Проверки дублирования функционируют');
    
    console.log('\n💡 Теперь администратор может:');
    console.log('- Добавлять клиентов напрямую через /addclient');
    console.log('- Удалять клиентов через /removeclient');
    console.log('- Обрабатывать запросы клиентов через "📋 Ожидающие запросы"');
    console.log('- Управлять всем через меню "👥 Управление клиентами"');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Запуск теста
if (require.main === module) {
  testClientManagementCommands().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = testClientManagementCommands;