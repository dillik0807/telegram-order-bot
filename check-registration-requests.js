/**
 * Проверка запросов на регистрацию
 */

const database = require('./database');

async function checkRegistrationRequests() {
  console.log('🔍 Проверка запросов на регистрацию...\n');
  
  try {
    // Проверяем ожидающие запросы
    const pendingRequests = await database.getPendingRequests();
    console.log(`📋 Ожидающих запросов: ${pendingRequests.length}`);
    
    if (pendingRequests.length > 0) {
      console.log('\n📝 Ожидающие запросы:');
      pendingRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.name}`);
        console.log(`   🆔 ID: ${req.telegram_id}`);
        console.log(`   📱 Username: @${req.username || 'не указан'}`);
        console.log(`   📅 Создан: ${new Date(req.created_at).toLocaleString('ru-RU')}`);
        console.log(`   📊 Статус: ${req.status}`);
        console.log('');
      });
    }
    
    // Проверяем все запросы (включая обработанные)
    console.log('\n📊 Проверка всех запросов в базе...');
    
    const db = database.db;
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM registration_requests ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          console.log(`📋 Всего запросов в базе: ${rows.length}`);
          
          if (rows.length > 0) {
            console.log('\n📝 Все запросы:');
            rows.forEach((req, index) => {
              const statusIcon = req.status === 'approved' ? '✅' : 
                               req.status === 'rejected' ? '❌' : '⏳';
              
              console.log(`${index + 1}. ${req.name} ${statusIcon}`);
              console.log(`   🆔 ID: ${req.telegram_id}`);
              console.log(`   📱 Username: @${req.username || 'не указан'}`);
              console.log(`   📅 Создан: ${new Date(req.created_at).toLocaleString('ru-RU')}`);
              console.log(`   📊 Статус: ${req.status}`);
              console.log('');
            });
            
            // Статистика по статусам
            const approved = rows.filter(r => r.status === 'approved').length;
            const rejected = rows.filter(r => r.status === 'rejected').length;
            const pending = rows.filter(r => r.status === 'pending').length;
            
            console.log('📊 Статистика запросов:');
            console.log(`✅ Одобрено: ${approved}`);
            console.log(`❌ Отклонено: ${rejected}`);
            console.log(`⏳ Ожидает: ${pending}`);
          }
          
          resolve();
        }
      );
    });
    
  } catch (error) {
    console.error('❌ Ошибка при проверке запросов:', error);
  }
}

// Запуск проверки
if (require.main === module) {
  checkRegistrationRequests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = checkRegistrationRequests;