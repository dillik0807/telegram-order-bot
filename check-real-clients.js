/**
 * Проверка реальных клиентов и запросов в базе данных
 */

require('dotenv').config();
const database = require('./database');

async function checkRealClients() {
  console.log('🔍 Проверка реальных данных в базе данных\n');
  
  try {
    // 1. Проверяем всех клиентов
    console.log('📋 Шаг 1: Все клиенты в базе данных...\n');
    const clients = await database.getAllClients();
    
    if (clients.length === 0) {
      console.log('⚠️ Нет клиентов в базе данных');
    } else {
      console.log(`✅ Найдено клиентов: ${clients.length}\n`);
      
      clients.forEach((client, index) => {
        console.log(`${index + 1}. ${client.name || 'Без имени'}`);
        console.log(`   🆔 Telegram ID: ${client.telegram_id}`);
        console.log(`   📞 Телефон: ${client.phone || 'Не указан'}`);
        console.log(`   ✅ Активен: ${client.is_active === 1 ? 'Да' : 'Нет'}`);
        console.log(`   👨‍💼 Добавил: ${client.added_by}`);
        console.log(`   📅 Создан: ${new Date(client.created_at).toLocaleString('ru-RU')}`);
        console.log('');
      });
    }
    
    // 2. Проверяем ожидающие запросы
    console.log('\n📋 Шаг 2: Ожидающие запросы на регистрацию...\n');
    const pendingRequests = await database.getPendingRequests();
    
    if (pendingRequests.length === 0) {
      console.log('✅ Нет ожидающих запросов');
    } else {
      console.log(`⚠️ Найдено ожидающих запросов: ${pendingRequests.length}\n`);
      
      pendingRequests.forEach((request, index) => {
        console.log(`${index + 1}. ${request.name}`);
        console.log(`   🆔 Telegram ID: ${request.telegram_id}`);
        console.log(`   📱 Username: @${request.username || 'не указан'}`);
        console.log(`   📊 Статус: ${request.status}`);
        console.log(`   📅 Создан: ${new Date(request.created_at).toLocaleString('ru-RU')}`);
        console.log('');
      });
    }
    
    // 3. Проверяем конкретных клиентов из вашего примера
    console.log('\n📋 Шаг 3: Проверка конкретных клиентов...\n');
    
    const testIds = [5769223361, 663607890]; // ID из предыдущего теста
    
    for (const testId of testIds) {
      console.log(`🔍 Проверка клиента ${testId}:`);
      
      const isClient = await database.isClient(testId);
      console.log(`   isClient: ${isClient}`);
      
      const client = await database.getClient(testId);
      if (client) {
        console.log(`   ✅ Найден в таблице clients`);
        console.log(`   👤 Имя: ${client.name}`);
        console.log(`   ✅ Активен: ${client.is_active === 1 ? 'Да' : 'Нет'}`);
      } else {
        console.log(`   ❌ НЕ найден в таблице clients`);
      }
      
      const pendingRequest = await database.getPendingRequest(testId);
      if (pendingRequest) {
        console.log(`   ⚠️ Есть ожидающий запрос (статус: ${pendingRequest.status})`);
      } else {
        console.log(`   ✅ Нет ожидающих запросов`);
      }
      
      console.log('');
    }
    
    // 4. Проверяем все запросы (не только pending)
    console.log('\n📋 Шаг 4: Все запросы на регистрацию (включая обработанные)...\n');
    
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = process.env.DB_PATH || './orders.db';
    
    await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) return reject(err);
        
        db.all(
          'SELECT * FROM registration_requests ORDER BY created_at DESC LIMIT 10',
          [],
          (err, rows) => {
            if (err) return reject(err);
            
            if (rows.length === 0) {
              console.log('⚠️ Нет запросов на регистрацию');
            } else {
              console.log(`✅ Последние ${rows.length} запросов:\n`);
              
              rows.forEach((request, index) => {
                console.log(`${index + 1}. ${request.name}`);
                console.log(`   🆔 Telegram ID: ${request.telegram_id}`);
                console.log(`   📊 Статус: ${request.status}`);
                console.log(`   📅 Создан: ${new Date(request.created_at).toLocaleString('ru-RU')}`);
                console.log('');
              });
            }
            
            db.close();
            resolve();
          }
        );
      });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Проверка завершена');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    database.close();
  }
}

// Запуск проверки
checkRealClients()
  .then(() => {
    console.log('\n✅ Проверка завершена успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Критическая ошибка:', error);
    process.exit(1);
  });
