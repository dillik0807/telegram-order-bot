/**
 * 🔧 НОВЫЙ ФУНКЦИОНАЛ: Администратор создает заявку от имени клиента
 * 
 * Процесс:
 * 1. Админ выбирает склад
 * 2. Админ выбирает товары и количество
 * 3. Админ нажимает "✅ Завершить заявку"
 * 4. НОВОЕ: Админ выбирает клиента из списка
 * 5. Админ вводит транспорт и комментарий
 * 6. Заявка создается от имени выбранного клиента
 */

const database = require('./database');

/**
 * Получить список всех клиентов для выбора
 */
async function getClientsKeyboard() {
  try {
    const clients = await database.getAllClients();
    
    if (clients.length === 0) {
      return {
        keyboard: [[{ text: '❌ Нет клиентов' }]],
        clients: []
      };
    }
    
    // Создаем кнопки с клиентами (по 2 в ряд)
    const keyboard = [];
    for (let i = 0; i < clients.length; i += 2) {
      const row = [];
      
      // Первый клиент в ряду
      const client1 = clients[i];
      const displayName1 = client1.name || `ID: ${client1.telegram_id}`;
      const phone1 = client1.phone ? ` (${client1.phone})` : '';
      row.push({ text: `👤 ${displayName1}${phone1}` });
      
      // Второй клиент в ряду (если есть)
      if (i + 1 < clients.length) {
        const client2 = clients[i + 1];
        const displayName2 = client2.name || `ID: ${client2.telegram_id}`;
        const phone2 = client2.phone ? ` (${client2.phone})` : '';
        row.push({ text: `👤 ${displayName2}${phone2}` });
      }
      
      keyboard.push(row);
    }
    
    // Добавляем кнопку отмены
    keyboard.push([{ text: '❌ Отменить' }]);
    
    return {
      keyboard,
      clients
    };
  } catch (error) {
    console.error('Ошибка получения списка клиентов:', error);
    return {
      keyboard: [[{ text: '❌ Ошибка загрузки' }]],
      clients: []
    };
  }
}

/**
 * Найти клиента по тексту кнопки
 */
function findClientByButtonText(buttonText, clients) {
  // Убираем эмодзи и пробелы
  const cleanText = buttonText.replace('👤 ', '').trim();
  
  // Ищем клиента по имени или телефону
  for (const client of clients) {
    const displayName = client.name || `ID: ${client.telegram_id}`;
    const phone = client.phone || '';
    
    // Проверяем совпадение с именем
    if (cleanText.includes(displayName)) {
      return client;
    }
    
    // Проверяем совпадение с телефоном
    if (phone && cleanText.includes(phone)) {
      return client;
    }
  }
  
  return null;
}

/**
 * Форматировать информацию о выбранном клиенте
 */
function formatClientInfo(client) {
  let info = '👤 Выбранный клиент:\n\n';
  info += `Имя: ${client.name || 'Не указано'}\n`;
  info += `Телефон: ${client.phone || 'Не указан'}\n`;
  info += `Telegram ID: ${client.telegram_id}\n`;
  
  return info;
}

/**
 * Создать заявку от имени клиента
 */
async function createOrderForClient(clientTelegramId, orderData) {
  try {
    // Получаем или создаем пользователя
    const client = await database.getClient(clientTelegramId);
    
    if (!client) {
      throw new Error('Клиент не найден');
    }
    
    // Получаем или создаем запись пользователя в таблице users
    const user = await database.getOrCreateUser(
      clientTelegramId,
      client.name,
      client.phone
    );
    
    // Создаем заявку
    const orderId = await database.createOrder(
      user.id,
      orderData.warehouse,
      orderData.transport,
      orderData.comment
    );
    
    // Добавляем товары
    for (const item of orderData.items) {
      await database.addOrderItem(orderId, item.product, item.quantity);
    }
    
    return {
      success: true,
      orderId,
      client
    };
  } catch (error) {
    console.error('Ошибка создания заявки для клиента:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Форматировать заявку для отправки (с информацией о клиенте)
 */
function formatOrderForClient(orderInfo, client) {
  let message = '📦 НОВАЯ ЗАЯВКА\n';
  message += '(создана администратором)\n\n';
  message += `👤 Клиент: ${client.name || 'Не указано'}\n`;
  message += `📞 Телефон: ${client.phone || 'Не указан'}\n`;
  message += `🏬 Склад: ${orderInfo.warehouse}\n\n`;
  message += `🛒 Товары:\n`;
  
  let totalQuantity = 0;
  
  orderInfo.items.forEach((item, index) => {
    message += `${index + 1}) ${item.product} — ${item.quantity}\n`;
    
    // Извлекаем число из quantity для подсчета итога
    const quantityMatch = item.quantity.match(/(\d+)/);
    if (quantityMatch) {
      totalQuantity += parseInt(quantityMatch[1]);
    }
  });
  
  message += `\n📊 Итого: ${totalQuantity} шт\n`;
  message += `\n🚚 Транспорт: ${orderInfo.transport}\n`;
  
  if (orderInfo.comment) {
    message += `📝 Комментарий: ${orderInfo.comment}\n`;
  }
  
  message += `\n⏰ Время: ${new Date().toLocaleString('ru-RU')}`;
  
  return message;
}

module.exports = {
  getClientsKeyboard,
  findClientByButtonText,
  formatClientInfo,
  createOrderForClient,
  formatOrderForClient
};
