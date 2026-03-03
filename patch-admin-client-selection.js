/**
 * 🔧 ПАТЧ: Добавление выбора клиента для администратора
 * 
 * Этот файл содержит код который нужно добавить в bot.js
 */

// ============================================
// 1. ДОБАВИТЬ В НАЧАЛО ФАЙЛА (после других require)
// ============================================

const adminClientOrder = require('./admin-order-for-client');

// ============================================
// 2. ЗАМЕНИТЬ ОБРАБОТКУ "✅ Продолжить"
// ============================================

// СТАРЫЙ КОД (строка ~408):
/*
if (text === '✅ Продолжить') {
  // Проверяем, есть ли сохраненные данные клиента
  const client = await database.getClient(userId);
  
  if (client && client.name && client.phone) {
    // ... существующий код
  }
}
*/

// НОВЫЙ КОД:
if (text === '✅ Продолжить') {
  // Проверяем, является ли пользователь администратором
  if (admin.isAdmin(userId)) {
    // АДМИНИСТРАТОР - показываем список клиентов
    data.step = 'select_client';
    orderData.set(userId, data);
    
    const { keyboard, clients } = await adminClientOrder.getClientsKeyboard();
    
    // Сохраняем список клиентов для последующего поиска
    data.clientsList = clients;
    orderData.set(userId, data);
    
    let summary = '📋 Ваша заявка:\n\n';
    summary += `🏬 Склад: ${data.warehouse}\n\n`;
    summary += 'Товары:\n';
    data.items.forEach((item, i) => {
      summary += `${i + 1}. ${item.product} — ${item.quantity}\n`;
    });
    summary += '\n👤 Выберите клиента:';
    
    return ctx.reply(summary, {
      reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true }
    });
  } else {
    // ОБЫЧНЫЙ КЛИЕНТ - существующая логика
    const client = await database.getClient(userId);
    
    if (client && client.name && client.phone) {
      // Данные уже есть - сразу запрашиваем транспорт
      data.name = client.name;
      data.phone = client.phone;
      data.step = 'transport';
      orderData.set(userId, data);
      
      let summary = '📋 Ваша заявка:\n\n';
      summary += `👤 Имя: ${client.name}\n`;
      summary += `📞 Телефон: ${client.phone}\n`;
      summary += `🏬 Склад: ${data.warehouse}\n\n`;
      summary += 'Товары:\n';
      data.items.forEach((item, i) => {
        summary += `${i + 1}. ${item.product} — ${item.quantity}\n`;
      });
      summary += '\n🚚 Введите номер транспорта:\n(например: 1234 AB)';
      
      return ctx.reply(summary, { reply_markup: { remove_keyboard: true } });
    } else {
      // Первый раз - запрашиваем имя и телефон
      data.step = 'name';
      orderData.set(userId, data);
      
      let summary = '📋 Ваша заявка:\n\n';
      summary += `🏬 Склад: ${data.warehouse}\n\n`;
      summary += 'Товары:\n';
      data.items.forEach((item, i) => {
        summary += `${i + 1}. ${item.product} — ${item.quantity}\n`;
      });
      summary += '\n📝 Заполните контактные данные:\n\n';
      summary += 'Введите ваше имя:';
      
      return ctx.reply(summary, { reply_markup: { remove_keyboard: true } });
    }
  }
}

// ============================================
// 3. ДОБАВИТЬ НОВЫЙ ОБРАБОТЧИК (после обработки "✅ Продолжить")
// ============================================

// Шаг: Выбор клиента (только для администратора)
if (data.step === 'select_client') {
  // Проверяем отмену
  if (text === '❌ Отменить') {
    orderData.delete(userId);
    const keyboard = [
      [{ text: '📦 Создать заявку' }],
      [{ text: '👨‍💼 Панель администратора' }]
    ];
    return ctx.reply(
      '❌ Создание заявки отменено',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  }
  
  // Ищем выбранного клиента
  const selectedClient = adminClientOrder.findClientByButtonText(text, data.clientsList);
  
  if (!selectedClient) {
    return ctx.reply('❌ Клиент не найден. Выберите из списка.');
  }
  
  // Сохраняем данные выбранного клиента
  data.selectedClient = selectedClient;
  data.name = selectedClient.name;
  data.phone = selectedClient.phone;
  data.step = 'transport';
  orderData.set(userId, data);
  
  const clientInfo = adminClientOrder.formatClientInfo(selectedClient);
  
  return ctx.reply(
    clientInfo + '\n\n🚚 Введите номер транспорта:\n(например: 1234 AB)',
    { reply_markup: { remove_keyboard: true } }
  );
}

// ============================================
// 4. ИЗМЕНИТЬ ОБРАБОТКУ ПОДТВЕРЖДЕНИЯ (строка ~520)
// ============================================

// В блоке "if (text === '✅ Подтвердить')" заменить:

// СТАРЫЙ КОД:
/*
const orderMessage = formatOrder(data);
*/

// НОВЫЙ КОД:
let orderMessage;
if (data.selectedClient) {
  // Заявка создана администратором для клиента
  orderMessage = adminClientOrder.formatOrderForClient(data, data.selectedClient);
} else {
  // Обычная заявка
  orderMessage = formatOrder(data);
}

// ============================================
// 5. ИЗМЕНИТЬ СОХРАНЕНИЕ В БД (строка ~525)
// ============================================

// СТАРЫЙ КОД:
/*
const user = await database.getOrCreateUser(userId, data.name, data.phone);
*/

// НОВЫЙ КОД:
let user;
if (data.selectedClient) {
  // Создаем заявку от имени выбранного клиента
  user = await database.getOrCreateUser(
    data.selectedClient.telegram_id,
    data.selectedClient.name,
    data.selectedClient.phone
  );
} else {
  // Обычная заявка от текущего пользователя
  user = await database.getOrCreateUser(userId, data.name, data.phone);
}

// ============================================
// ГОТОВО! Теперь администратор может выбирать клиента
// ============================================
