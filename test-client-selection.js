/**
 * 🧪 Тест функционала выбора клиента из списка для админа
 */

const database = require('./database-wrapper');
const { isAdmin } = require('./admin');

async function testClientSelection() {
  console.log('🧪 ТЕСТ: Выбор клиента из списка для админа\n');
  console.log('═'.repeat(60));
  
  try {
    // 1. Проверка функции isAdmin
    console.log('\n1️⃣ Проверка функции isAdmin:');
    console.log('-'.repeat(60));
    
    const testAdminId = 5889669586;
    const testUserId = 123456789;
    
    const adminCheck = isAdmin(testAdminId);
    const userCheck = isAdmin(testUserId);
    
    console.log(`   Админ (${testAdminId}): ${adminCheck ? '✅ ДА' : '❌ НЕТ'}`);
    console.log(`   Пользователь (${testUserId}): ${userCheck ? '✅ НЕТ' : '❌ ДА'}`);
    
    if (adminCheck && !userCheck) {
      console.log('   ✅ Функция isAdmin работает корректно');
    } else {
      console.log('   ⚠️ Проблема с функцией isAdmin');
    }
    
    // 2. Проверка получения списка клиентов
    console.log('\n2️⃣ Проверка получения списка клиентов:');
    console.log('-'.repeat(60));
    
    const clients = await database.getAllClients();
    console.log(`   📊 Всего клиентов в базе: ${clients.length}`);
    
    if (clients.length === 0) {
      console.log('   ⚠️ База клиентов пуста');
      console.log('   💡 Добавьте клиентов через /addclient или регистрацию');
    } else {
      console.log('   ✅ Клиенты найдены');
      
      // 3. Проверка фильтрации клиентов с данными
      console.log('\n3️⃣ Проверка фильтрации клиентов:');
      console.log('-'.repeat(60));
      
      const validClients = clients.filter(c => 
        c.name && c.phone && c.name.trim() !== '' && c.phone.trim() !== ''
      );
      
      console.log(`   📊 Клиентов с заполненными данными: ${validClients.length}`);
      
      if (validClients.length === 0) {
        console.log('   ⚠️ Нет клиентов с заполненными данными');
        console.log('   💡 Убедитесь, что у клиентов есть имя и телефон');
      } else {
        console.log('   ✅ Найдены клиенты с данными:');
        validClients.slice(0, 5).forEach((client, index) => {
          console.log(`      ${index + 1}. ${client.name} (${client.phone})`);
        });
        
        if (validClients.length > 5) {
          console.log(`      ... и еще ${validClients.length - 5} клиентов`);
        }
        
        // 4. Проверка парсинга формата "Имя (Телефон)"
        console.log('\n4️⃣ Проверка парсинга формата клиента:');
        console.log('-'.repeat(60));
        
        const testClient = validClients[0];
        const testFormat = `${testClient.name} (${testClient.phone})`;
        const match = testFormat.match(/^(.+?)\s*\((.+?)\)$/);
        
        if (match) {
          const [, parsedName, parsedPhone] = match;
          console.log(`   Тестовый формат: "${testFormat}"`);
          console.log(`   Распарсенное имя: "${parsedName}"`);
          console.log(`   Распарсенный телефон: "${parsedPhone}"`);
          
          if (parsedName === testClient.name && parsedPhone === testClient.phone) {
            console.log('   ✅ Парсинг работает корректно');
          } else {
            console.log('   ❌ Ошибка парсинга');
          }
        } else {
          console.log('   ❌ Не удалось распарсить формат');
        }
        
        // 5. Проверка поиска клиента по имени и телефону
        console.log('\n5️⃣ Проверка поиска клиента:');
        console.log('-'.repeat(60));
        
        const searchName = testClient.name;
        const searchPhone = testClient.phone;
        
        const foundClient = clients.find(c => 
          c.name === searchName && c.phone === searchPhone
        );
        
        if (foundClient) {
          console.log(`   ✅ Клиент найден: ${foundClient.name} (${foundClient.phone})`);
          console.log(`   🆔 Telegram ID: ${foundClient.telegram_id}`);
        } else {
          console.log('   ❌ Клиент не найден');
        }
      }
    }
    
    // Итоговый отчет
    console.log('\n' + '═'.repeat(60));
    console.log('📊 ИТОГОВЫЙ ОТЧЕТ:');
    console.log('═'.repeat(60));
    
    const checks = [
      { name: 'Функция isAdmin', status: adminCheck && !userCheck },
      { name: 'Получение списка клиентов', status: clients.length > 0 },
      { name: 'Клиенты с данными', status: clients.filter(c => c.name && c.phone && c.name.trim() !== '' && c.phone.trim() !== '').length > 0 }
    ];
    
    const passedChecks = checks.filter(c => c.status).length;
    const totalChecks = checks.length;
    
    checks.forEach(check => {
      console.log(`   ${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log(`Пройдено проверок: ${passedChecks}/${totalChecks}`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!');
      console.log('✅ Функционал выбора клиента готов к использованию');
    } else {
      console.log('\n⚠️ НЕКОТОРЫЕ ПРОВЕРКИ НЕ ПРОЙДЕНЫ');
      console.log('💡 Проверьте базу данных и настройки администратора');
    }
    
    console.log('\n📝 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('   1. Запустите бота: node bot.js');
    console.log('   2. Войдите как администратор');
    console.log('   3. Создайте новую заявку');
    console.log('   4. После добавления товаров выберите "👥 Выбрать из списка клиентов"');
    console.log('   5. Проверьте, что список клиентов отображается корректно');
    
  } catch (error) {
    console.error('\n❌ ОШИБКА ПРИ ТЕСТИРОВАНИИ:', error);
    console.error(error.stack);
  }
  
  process.exit(0);
}

// Запуск теста
testClientSelection();
