/**
 * Тест исправлений регистрации клиентов
 */

const database = require('./database');

async function testClientRegistrationFix() {
  console.log('🧪 Тестирование исправлений регистрации клиентов...\n');
  
  try {
    // Тест 1: Проверка клиентов с неполными данными
    console.log('1️⃣ Проверка списка клиентов...');
    const clients = await database.getAllClients();
    
    console.log(`📋 Найдено клиентов: ${clients.length}`);
    
    clients.forEach((client, index) => {
      const hasName = client.name && client.name.trim() !== '';
      const hasPhone = client.phone && client.phone.trim() !== '';
      const status = hasName && hasPhone ? '✅ Полные данные' : '⚠️ Неполные данные';
      
      console.log(`${index + 1}. ID: ${client.telegram_id}`);
      console.log(`   Имя: ${client.name || 'НЕ УКАЗАНО'}`);
      console.log(`   Телефон: ${client.phone || 'НЕ УКАЗАН'}`);
      console.log(`   Статус: ${status}`);
      console.log('');
    });
    
    // Тест 2: Проверка функции isClient
    console.log('2️⃣ Проверка функции isClient...');
    for (const client of clients) {
      const isClientResult = await database.isClient(client.telegram_id);
      console.log(`ID ${client.telegram_id}: isClient = ${isClientResult}`);
    }
    
    // Тест 3: Проверка функции getClient
    console.log('\n3️⃣ Проверка функции getClient...');
    for (const client of clients) {
      const clientData = await database.getClient(client.telegram_id);
      if (clientData) {
        console.log(`ID ${client.telegram_id}: данные получены ✅`);
        console.log(`   Имя: "${clientData.name}"`);
        console.log(`   Телефон: "${clientData.phone}"`);
      } else {
        console.log(`ID ${client.telegram_id}: данные НЕ найдены ❌`);
      }
    }
    
    // Тест 4: Статистика
    console.log('\n4️⃣ Общая статистика...');
    const stats = await database.getStats();
    console.log(`👥 Всего клиентов: ${stats.totalClients}`);
    console.log(`📦 Всего заявок: ${stats.totalOrders}`);
    
    const clientsWithIncompleteData = clients.filter(c => 
      !c.name || !c.phone || c.name.trim() === '' || c.phone.trim() === ''
    );
    
    console.log(`⚠️ Клиентов с неполными данными: ${clientsWithIncompleteData.length}`);
    
    if (clientsWithIncompleteData.length > 0) {
      console.log('\n📝 Клиенты с неполными данными:');
      clientsWithIncompleteData.forEach(client => {
        console.log(`- ID: ${client.telegram_id}, Имя: "${client.name || 'НЕТ'}", Телефон: "${client.phone || 'НЕТ'}"`);
      });
      
      console.log('\n💡 Рекомендации:');
      console.log('- Эти клиенты заполнят данные при создании первой заявки');
      console.log('- Администратор может обновить данные через /editclient');
      console.log('- В списке клиентов они отмечены как "неполные данные"');
    }
    
    console.log('\n✅ Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Запуск теста
if (require.main === module) {
  testClientRegistrationFix().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = testClientRegistrationFix;