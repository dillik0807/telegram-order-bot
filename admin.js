const database = require('./database');
const excelExporter = require('./excel-export');
const dataManager = require('./data-manager');

// Список администраторов (Telegram ID)
// Добавьте сюда ID администраторов
const ADMINS = [
  5889669586, // Ваш ID
  // Добавьте другие ID администраторов здесь
];

// Проверка, является ли пользователь администратором
function isAdmin(userId) {
  return ADMINS.includes(userId);
}

// Команды для администраторов
function setupAdminCommands(bot) {
  
  // Команда /admin - показать админ-панель
  bot.command('admin', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '👥 Управление клиентами' }],
      [{ text: '📋 Список клиентов' }],
      [{ text: '✏️ Изменить данные клиента' }],
      [{ text: '🚫 Заблокировать клиента' }],
      [{ text: '🏬 Управление складами' }],
      [{ text: '🛒 Управление товарами' }],
      [{ text: '📊 Статистика' }],
      [{ text: '📄 Экспорт в Excel' }],
      [{ text: '🔙 Назад' }]
    ];
    
    ctx.reply(
      '👨‍💼 Панель администратора\n\n' +
      'Выберите действие:',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });
  
  // Обработка команд администратора
  bot.hears('👥 Управление клиентами', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '📋 Ожидающие запросы' }],
      [{ text: '➕ Добавить клиента напрямую' }],
      [{ text: '🗑️ Удалить клиента' }],
      [{ text: '🔙 Назад в админ-панель' }]
    ];
    
    ctx.reply(
      '👥 Управление клиентами\n\n' +
      'Выберите действие:',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });
  
  // Обработка ожидающих запросов (старая функция "Добавить клиента")
  bot.hears('📋 Ожидающие запросы', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    // Показываем список ожидающих запросов
    try {
      const requests = await database.getPendingRequests();
      
      if (requests.length === 0) {
        return ctx.reply(
          '📋 Нет ожидающих запросов на регистрацию.\n\n' +
          'Клиенты должны сначала написать боту /start',
          { reply_markup: { remove_keyboard: true } }
        );
      }
      
      let message = '📋 Ожидающие запросы на регистрацию:\n\n';
      
      const keyboard = [];
      requests.forEach((req, index) => {
        message += `${index + 1}. ${req.name}\n`;
        message += `   🆔 ID: ${req.telegram_id}\n`;
        message += `   📱 @${req.username || 'не указан'}\n`;
        message += `   📅 ${new Date(req.created_at).toLocaleString('ru-RU')}\n\n`;
        
        keyboard.push([
          { text: `✅ Одобрить ${req.name}`, callback_data: `approve_${req.telegram_id}` }
        ]);
      });
      
      ctx.reply(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      
    } catch (error) {
      console.error('Ошибка получения запросов:', error);
      ctx.reply('❌ Ошибка при получении списка запросов');
    }
  });
  
  // Прямое добавление клиента администратором
  bot.hears('➕ Добавить клиента напрямую', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '🔙 Назад в управление клиентами' }]
    ];
    
    ctx.reply(
      '➕ Прямое добавление клиента\n\n' +
      'Отправьте команду:\n' +
      '/addclient Telegram_ID | Имя | Телефон\n\n' +
      'Пример:\n' +
      '/addclient 123456789 | Алишер Иванов | +992901234567\n\n' +
      '💡 Клиент будет добавлен сразу без запроса на регистрацию',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });
  
  // Команда для прямого добавления клиента
  bot.command('addclient', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const text = ctx.message.text.replace('/addclient', '').trim();
    const parts = text.split('|').map(p => p.trim());
    
    if (parts.length !== 3) {
      return ctx.reply(
        '❌ Неверный формат!\n\n' +
        'Используйте:\n' +
        '/addclient Telegram_ID | Имя | Телефон\n\n' +
        'Пример:\n' +
        '/addclient 123456789 | Алишер Иванов | +992901234567'
      );
    }
    
    const [telegramId, name, phone] = parts;
    const clientId = parseInt(telegramId);
    
    if (isNaN(clientId)) {
      return ctx.reply('❌ Telegram ID должен быть числом');
    }
    
    try {
      // Проверяем, не существует ли уже такой клиент
      const existingClient = await database.getClient(clientId);
      if (existingClient) {
        return ctx.reply(
          `❌ Клиент с ID ${clientId} уже существует!\n\n` +
          `Имя: ${existingClient.name}\n` +
          `Телефон: ${existingClient.phone}`
        );
      }
      
      // Добавляем клиента напрямую
      await database.addClient(clientId, name, phone, userId);
      
      ctx.reply(
        '✅ Клиент добавлен напрямую!\n\n' +
        `🆔 Telegram ID: ${clientId}\n` +
        `👤 Имя: ${name}\n` +
        `📞 Телефон: ${phone}\n\n` +
        '💡 Клиент может сразу создавать заявки'
      );
      
      // Уведомление клиенту (если возможно)
      try {
        await bot.telegram.sendMessage(
          clientId,
          '✅ Вы были добавлены в систему администратором!\n\n' +
          'Теперь вы можете создавать заявки.\n' +
          'Отправьте /start для начала работы.'
        );
      } catch (error) {
        console.log(`Не удалось отправить уведомление клиенту ${clientId}:`, error.message);
      }
      
    } catch (error) {
      console.error('Ошибка добавления клиента:', error);
      ctx.reply('❌ Ошибка при добавлении клиента');
    }
  });
  
  // Удаление клиента
  bot.hears('🗑️ Удалить клиента', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const clients = await database.getAllClients();
      
      if (clients.length === 0) {
        return ctx.reply('📋 Список клиентов пуст');
      }
      
      const keyboard = [
        [{ text: '🔙 Назад в управление клиентами' }]
      ];
      
      let message = '🗑️ Удаление клиента\n\n';
      message += 'Выберите клиента для удаления:\n\n';
      clients.forEach((client, index) => {
        const name = client.name || 'Без имени';
        const phone = client.phone || 'Без телефона';
        message += `${index + 1}. ${name}\n`;
        message += `   📞 ${phone}\n`;
        message += `   🆔 ID: ${client.telegram_id}\n\n`;
      });
      message += 'Отправьте команду:\n';
      message += '/removeclient Telegram_ID\n\n';
      message += 'Пример:\n';
      message += '/removeclient 123456789';
      
      ctx.reply(message, { reply_markup: { keyboard, resize_keyboard: true } });
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      ctx.reply('❌ Ошибка при получении списка клиентов');
    }
  });
  
  // Кнопка возврата в управление клиентами
  bot.hears('🔙 Назад в управление клиентами', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return;
    }
    
    const keyboard = [
      [{ text: '📋 Ожидающие запросы' }],
      [{ text: '➕ Добавить клиента напрямую' }],
      [{ text: '🗑️ Удалить клиента' }],
      [{ text: '🔙 Назад в админ-панель' }]
    ];
    
    ctx.reply(
      '👥 Управление клиентами',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });
  
  // Обработка кнопок одобрения/отклонения
  bot.action(/approve_(\d+)/, async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.answerCbQuery('❌ У вас нет прав администратора');
    }
    
    const clientId = parseInt(ctx.match[1]);
    
    try {
      const request = await database.getRegistrationRequest(clientId);
      
      if (!request) {
        await ctx.answerCbQuery('❌ Запрос не найден');
        return ctx.editMessageText('❌ Запрос уже обработан или не найден');
      }
      
      // Одобряем клиента с пустым телефоном - клиент заполнит при первой заявке
      await database.approveClient(clientId, request.name, '', userId);
      
      await ctx.answerCbQuery('✅ Клиент одобрен!');
      await ctx.editMessageText(
        `✅ Клиент одобрен!\n\n` +
        `👤 Имя: ${request.name}\n` +
        `🆔 ID: ${clientId}\n` +
        `✅ Одобрил: ${ctx.from.first_name}\n\n` +
        `📝 Клиент заполнит контактные данные при создании первой заявки.`
      );
      
      // Уведомление клиенту
      try {
        await bot.telegram.sendMessage(
          clientId,
          '✅ Ваша регистрация одобрена!\n\n' +
          'Теперь вы можете создавать заявки.\n' +
          'При создании первой заявки вам нужно будет указать ваше имя и телефон.\n\n' +
          'Отправьте /start для начала работы.'
        );
      } catch (error) {
        console.error('Ошибка отправки уведомления клиенту:', error);
      }
      
    } catch (error) {
      console.error('Ошибка одобрения:', error);
      await ctx.answerCbQuery('❌ Ошибка при одобрении');
    }
  });
  
  bot.action(/reject_(\d+)/, async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.answerCbQuery('❌ У вас нет прав администратора');
    }
    
    const clientId = parseInt(ctx.match[1]);
    
    try {
      const request = await database.getRegistrationRequest(clientId);
      
      if (!request) {
        await ctx.answerCbQuery('❌ Запрос не найден');
        return ctx.editMessageText('❌ Запрос уже обработан или не найден');
      }
      
      await database.rejectRequest(clientId);
      
      await ctx.answerCbQuery('❌ Запрос отклонен');
      await ctx.editMessageText(
        `❌ Запрос отклонен\n\n` +
        `👤 Имя: ${request.name}\n` +
        `🆔 ID: ${clientId}\n` +
        `❌ Отклонил: ${ctx.from.first_name}`
      );
      
      // Уведомление клиенту
      try {
        await bot.telegram.sendMessage(
          clientId,
          '❌ К сожалению, ваш запрос на регистрацию был отклонен.\n\n' +
          'Для получения дополнительной информации обратитесь к администратору.'
        );
      } catch (error) {
        console.error('Ошибка отправки уведомления клиенту:', error);
      }
      
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      await ctx.answerCbQuery('❌ Ошибка при отклонении');
    }
  });
  
  // Обработка процесса регистрации клиента - УДАЛЕНО
  // Теперь клиенты регистрируются автоматически через /start
  
  bot.hears('📋 Список клиентов', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const clients = await database.getAllClients();
      
      if (clients.length === 0) {
        return ctx.reply('📋 Список клиентов пуст');
      }
      
      let message = '📋 Список клиентов:\n\n';
      clients.forEach((client, index) => {
        const name = client.name || 'Не указано';
        const phone = client.phone || 'Не указан';
        const status = (!client.name || !client.phone || client.name.trim() === '' || client.phone.trim() === '') 
          ? ' ⚠️ (неполные данные)' : '';
        
        message += `${index + 1}. ${name}${status}\n`;
        message += `   📞 ${phone}\n`;
        message += `   🆔 ID: ${client.telegram_id}\n`;
        message += `   📅 Добавлен: ${new Date(client.created_at).toLocaleDateString('ru-RU')}\n\n`;
      });
      
      ctx.reply(message);
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      ctx.reply('❌ Ошибка при получении списка клиентов');
    }
  });
  
  bot.hears('🗑️ Удалить клиента', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    ctx.reply(
      '🗑️ Удаление клиента\n\n' +
      'Отправьте команду:\n' +
      '/removeclient Telegram_ID\n\n' +
      'Пример:\n' +
      '/removeclient 123456789',
      { reply_markup: { remove_keyboard: true } }
    );
  });
  
  // Изменить данные клиента
  bot.hears('✏️ Изменить данные клиента', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const clients = await database.getAllClients();
      
      if (clients.length === 0) {
        return ctx.reply('📋 Список клиентов пуст');
      }
      
      const keyboard = [
        [{ text: '🔙 Назад в админ-панель' }]
      ];
      
      let message = '✏️ Выберите клиента для изменения:\n\n';
      clients.forEach((client, index) => {
        message += `${index + 1}. ${client.name || 'Без имени'} (ID: ${client.telegram_id})\n`;
      });
      message += '\nОтправьте команду:\n';
      message += '/editclient ID | Новое_имя | Новый_телефон\n\n';
      message += 'Пример:\n';
      message += '/editclient 123456789 | Алишер Иванов | +992901234567';
      
      ctx.reply(message, { reply_markup: { keyboard, resize_keyboard: true } });
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      ctx.reply('❌ Ошибка при получении списка клиентов');
    }
  });
  
  bot.command('editclient', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const text = ctx.message.text.replace('/editclient', '').trim();
    const parts = text.split('|').map(p => p.trim());
    
    if (parts.length !== 3) {
      return ctx.reply(
        '❌ Неверный формат!\n\n' +
        'Используйте:\n' +
        '/editclient ID | Имя | Телефон\n\n' +
        'Пример:\n' +
        '/editclient 123456789 | Алишер | +992901234567'
      );
    }
    
    const [telegramId, name, phone] = parts;
    const clientId = parseInt(telegramId);
    
    if (isNaN(clientId)) {
      return ctx.reply('❌ Telegram ID должен быть числом');
    }
    
    try {
      const updated = await database.updateClient(clientId, name, phone);
      
      if (updated) {
        ctx.reply(
          '✅ Данные клиента обновлены!\n\n' +
          `🆔 ID: ${clientId}\n` +
          `👤 Новое имя: ${name}\n` +
          `📞 Новый телефон: ${phone}`
        );
        
        // Уведомление клиенту
        try {
          await bot.telegram.sendMessage(
            clientId,
            '✏️ Ваши данные были обновлены администратором.\n\n' +
            `👤 Имя: ${name}\n` +
            `📞 Телефон: ${phone}`
          );
        } catch (error) {
          // Игнорируем ошибку
        }
      } else {
        ctx.reply('❌ Клиент не найден');
      }
      
    } catch (error) {
      console.error('Ошибка обновления клиента:', error);
      ctx.reply('❌ Ошибка при обновлении данных');
    }
  });
  
  // Заблокировать клиента
  bot.hears('🚫 Заблокировать клиента', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const clients = await database.getAllClients();
      
      if (clients.length === 0) {
        return ctx.reply('📋 Список клиентов пуст');
      }
      
      const keyboard = [
        [{ text: '🔙 Назад в админ-панель' }]
      ];
      
      let message = '🚫 Выберите клиента для блокировки:\n\n';
      clients.forEach((client, index) => {
        message += `${index + 1}. ${client.name || 'Без имени'} (ID: ${client.telegram_id})\n`;
      });
      message += '\nОтправьте команду:\n';
      message += '/blockclient Telegram_ID\n\n';
      message += 'Пример:\n';
      message += '/blockclient 123456789';
      
      ctx.reply(message, { reply_markup: { keyboard, resize_keyboard: true } });
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      ctx.reply('❌ Ошибка при получении списка клиентов');
    }
  });
  
  bot.command('blockclient', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const telegramId = ctx.message.text.replace('/blockclient', '').trim();
    const clientId = parseInt(telegramId);
    
    if (isNaN(clientId)) {
      return ctx.reply('❌ Telegram ID должен быть числом');
    }
    
    try {
      const result = await database.removeClient(clientId);
      
      if (result) {
        ctx.reply('🚫 Клиент заблокирован');
        
        // Уведомление клиенту
        try {
          await bot.telegram.sendMessage(
            clientId,
            '🚫 Ваш доступ к боту был заблокирован администратором.'
          );
        } catch (error) {
          // Игнорируем ошибку
        }
      } else {
        ctx.reply('❌ Клиент не найден');
      }
      
    } catch (error) {
      console.error('Ошибка блокировки клиента:', error);
      ctx.reply('❌ Ошибка при блокировке клиента');
    }
  });
  
  // Управление складами
  bot.hears('🏬 Управление складами', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '➕ Добавить склад' }],
      [{ text: '📋 Список складов' }],
      [{ text: '📱 Настроить WhatsApp группы' }],
      [{ text: '🗑️ Удалить склад' }],
      [{ text: '🔙 Назад в админ-панель' }]
    ];
    
    ctx.reply(
      '🏬 Управление складами\n\n' +
      'Выберите действие:',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });
  
  bot.hears('➕ Добавить склад', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '🔙 Назад в админ-панель' }]
    ];
    
    ctx.reply(
      '➕ Добавление склада\n\n' +
      'Отправьте команду:\n' +
      '/addwarehouse Название_склада\n\n' +
      'Пример:\n' +
      '/addwarehouse Склад №4',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });
  
  bot.command('addwarehouse', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const name = ctx.message.text.replace('/addwarehouse', '').trim();
    
    if (!name) {
      return ctx.reply('❌ Укажите название склада');
    }
    
    try {
      await dataManager.addWarehouseAndReload(name);
      ctx.reply(`✅ Склад "${name}" добавлен и данные обновлены!`);
    } catch (error) {
      console.error('Ошибка добавления склада:', error);
      ctx.reply('❌ Ошибка при добавлении склада');
    }
  });
  
  bot.hears('📋 Список складов', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const warehouses = await database.getAllWarehouses();
      
      if (warehouses.length === 0) {
        return ctx.reply('📋 Список складов пуст');
      }
      
      let message = '📋 Список складов:\n\n';
      warehouses.forEach((w, index) => {
        const whatsappStatus = w.whatsapp_group_id ? '✅ WhatsApp настроен' : '❌ WhatsApp не настроен';
        message += `${index + 1}. ${w.name} (ID: ${w.id})\n`;
        message += `   📱 ${whatsappStatus}\n`;
        if (w.whatsapp_group_id) {
          message += `   🆔 Группа: ${w.whatsapp_group_id}\n`;
        }
        message += '\n';
      });
      
      ctx.reply(message);
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      ctx.reply('❌ Ошибка при получении списка складов');
    }
  });

  // 📱 Настройка WhatsApp групп для складов
  bot.hears('📱 Настроить WhatsApp группы', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const warehouses = await database.getAllWarehouses();
      
      if (warehouses.length === 0) {
        return ctx.reply('📋 Сначала добавьте склады');
      }
      
      const keyboard = [
        [{ text: '🔙 Назад в управление складами' }]
      ];
      
      let message = '📱 Настройка WhatsApp групп для складов\n\n';
      message += '🎯 Умная маршрутизация заявок:\n';
      message += 'Каждый склад может иметь свою WhatsApp группу.\n';
      message += 'Заявки будут автоматически отправляться в нужную группу!\n\n';
      
      message += '📋 Текущие склады:\n\n';
      warehouses.forEach((w, index) => {
        const status = w.whatsapp_group_id ? '✅' : '❌';
        message += `${index + 1}. ${status} ${w.name}\n`;
        if (w.whatsapp_group_id) {
          message += `   📱 Группа: ${w.whatsapp_group_id}\n`;
        }
        message += '\n';
      });
      
      message += '⚙️ Команды управления:\n\n';
      message += '🔗 Привязать группу к складу:\n';
      message += '/setwhatsapp Название_склада | ID_группы\n\n';
      message += '🗑️ Отвязать группу от склада:\n';
      message += '/removewhatsapp Название_склада\n\n';
      message += '💡 Примеры:\n';
      message += '/setwhatsapp Склад №1 | 120363XXXXXXXXXX@g.us\n';
      message += '/removewhatsapp Склад №1\n\n';
      message += '📝 Как получить ID группы WhatsApp:\n';
      message += '1. Добавьте бота Green-API в группу\n';
      message += '2. Отправьте любое сообщение в группу\n';
      message += '3. Проверьте логи бота - там будет ID группы';
      
      ctx.reply(message, { reply_markup: { keyboard, resize_keyboard: true } });
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      ctx.reply('❌ Ошибка при получении списка складов');
    }
  });

  // Команда привязки WhatsApp группы к складу
  bot.command('setwhatsapp', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const text = ctx.message.text.replace('/setwhatsapp', '').trim();
    const parts = text.split('|').map(p => p.trim());
    
    if (parts.length !== 2) {
      return ctx.reply(
        '❌ Неверный формат!\n\n' +
        'Используйте:\n' +
        '/setwhatsapp Название_склада | ID_группы\n\n' +
        'Пример:\n' +
        '/setwhatsapp Склад №1 | 120363XXXXXXXXXX@g.us'
      );
    }
    
    const [warehouseName, groupId] = parts;
    
    try {
      const updated = await database.updateWarehouseWhatsApp(warehouseName, groupId);
      
      if (updated) {
        ctx.reply(
          '✅ WhatsApp группа привязана к складу!\n\n' +
          `🏬 Склад: ${warehouseName}\n` +
          `📱 WhatsApp группа: ${groupId}\n\n` +
          `🎯 Теперь все заявки для склада "${warehouseName}" будут автоматически отправляться в эту WhatsApp группу!`
        );
      } else {
        ctx.reply(`❌ Склад "${warehouseName}" не найден`);
      }
      
    } catch (error) {
      console.error('Ошибка привязки WhatsApp группы:', error);
      ctx.reply('❌ Ошибка при привязке WhatsApp группы');
    }
  });

  // Команда отвязки WhatsApp группы от склада
  bot.command('removewhatsapp', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const warehouseName = ctx.message.text.replace('/removewhatsapp', '').trim();
    
    if (!warehouseName) {
      return ctx.reply(
        '❌ Укажите название склада!\n\n' +
        'Используйте:\n' +
        '/removewhatsapp Название_склада\n\n' +
        'Пример:\n' +
        '/removewhatsapp Склад №1'
      );
    }
    
    try {
      const updated = await database.updateWarehouseWhatsApp(warehouseName, null);
      
      if (updated) {
        ctx.reply(
          '✅ WhatsApp группа отвязана от склада!\n\n' +
          `🏬 Склад: ${warehouseName}\n\n` +
          `📤 Теперь заявки для этого склада будут отправляться в общую группу WhatsApp.`
        );
      } else {
        ctx.reply(`❌ Склад "${warehouseName}" не найден`);
      }
      
    } catch (error) {
      console.error('Ошибка отвязки WhatsApp группы:', error);
      ctx.reply('❌ Ошибка при отвязке WhatsApp группы');
    }
  });
  
  bot.hears('🗑️ Удалить склад', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const warehouses = await database.getAllWarehouses();
      
      if (warehouses.length === 0) {
        return ctx.reply('📋 Список складов пуст');
      }
      
      const keyboard = [
        [{ text: '🔙 Назад в админ-панель' }]
      ];
      
      let message = '🗑️ Выберите склад для удаления:\n\n';
      warehouses.forEach((w, index) => {
        message += `${index + 1}. ${w.name} (ID: ${w.id})\n`;
      });
      message += '\nОтправьте команду:\n';
      message += '/removewarehouse ID\n\n';
      message += 'Пример:\n';
      message += '/removewarehouse 1';
      
      ctx.reply(message, { reply_markup: { keyboard, resize_keyboard: true } });
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      ctx.reply('❌ Ошибка при получении списка складов');
    }
  });
  
  bot.command('removewarehouse', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const id = parseInt(ctx.message.text.replace('/removewarehouse', '').trim());
    
    if (isNaN(id)) {
      return ctx.reply('❌ ID должен быть числом');
    }
    
    try {
      const result = await dataManager.removeWarehouseAndReload(id);
      
      if (result) {
        ctx.reply('✅ Склад удален и данные обновлены');
      } else {
        ctx.reply('❌ Склад не найден');
      }
      
    } catch (error) {
      console.error('Ошибка удаления склада:', error);
      ctx.reply('❌ Ошибка при удалении склада');
    }
  });
  
  // Управление товарами
  bot.hears('🛒 Управление товарами', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '➕ Добавить товар' }],
      [{ text: '📋 Список товаров' }],
      [{ text: '🗑️ Удалить товар' }],
      [{ text: '🔙 Назад в админ-панель' }]
    ];
    
    ctx.reply(
      '🛒 Управление товарами\n\n' +
      'Выберите действие:',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });
  
  bot.hears('➕ Добавить товар', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '🔙 Назад в админ-панель' }]
    ];
    
    ctx.reply(
      '➕ Добавление товара\n\n' +
      'Отправьте команду:\n' +
      '/addproduct Название_товара\n\n' +
      'Пример:\n' +
      '/addproduct Гравий',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });
  
  bot.command('addproduct', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const name = ctx.message.text.replace('/addproduct', '').trim();
    
    if (!name) {
      return ctx.reply('❌ Укажите название товара');
    }
    
    try {
      await dataManager.addProductAndReload(name);
      ctx.reply(`✅ Товар "${name}" добавлен и данные обновлены!`);
    } catch (error) {
      console.error('Ошибка добавления товара:', error);
      ctx.reply('❌ Ошибка при добавлении товара');
    }
  });
  
  bot.hears('📋 Список товаров', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const products = await database.getAllProducts();
      
      if (products.length === 0) {
        return ctx.reply('📋 Список товаров пуст');
      }
      
      let message = '📋 Список товаров:\n\n';
      products.forEach((p, index) => {
        message += `${index + 1}. ${p.name} (ID: ${p.id})\n`;
      });
      
      ctx.reply(message);
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      ctx.reply('❌ Ошибка при получении списка товаров');
    }
  });
  
  bot.hears('🗑️ Удалить товар', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const products = await database.getAllProducts();
      
      if (products.length === 0) {
        return ctx.reply('📋 Список товаров пуст');
      }
      
      const keyboard = [
        [{ text: '🔙 Назад в админ-панель' }]
      ];
      
      let message = '🗑️ Выберите товар для удаления:\n\n';
      products.forEach((p, index) => {
        message += `${index + 1}. ${p.name} (ID: ${p.id})\n`;
      });
      message += '\nОтправьте команду:\n';
      message += '/removeproduct ID\n\n';
      message += 'Пример:\n';
      message += '/removeproduct 1';
      
      ctx.reply(message, { reply_markup: { keyboard, resize_keyboard: true } });
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      ctx.reply('❌ Ошибка при получении списка товаров');
    }
  });
  
  bot.command('removeproduct', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const id = parseInt(ctx.message.text.replace('/removeproduct', '').trim());
    
    if (isNaN(id)) {
      return ctx.reply('❌ ID должен быть числом');
    }
    
    try {
      const result = await dataManager.removeProductAndReload(id);
      
      if (result) {
        ctx.reply('✅ Товар удален и данные обновлены');
      } else {
        ctx.reply('❌ Товар не найден');
      }
      
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      ctx.reply('❌ Ошибка при удалении товара');
    }
  });
  
  bot.hears('🔙 Назад в админ-панель', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return;
    }
    
    const keyboard = [
      [{ text: '👥 Управление клиентами' }],
      [{ text: '📋 Список клиентов' }],
      [{ text: '✏️ Изменить данные клиента' }],
      [{ text: '🚫 Заблокировать клиента' }],
      [{ text: '🏬 Управление складами' }],
      [{ text: '🛒 Управление товарами' }],
      [{ text: '📊 Статистика' }],
      [{ text: '📄 Экспорт в Excel' }],
      [{ text: '🔙 Назад' }]
    ];
    
    ctx.reply(
      '👨‍💼 Панель администратора',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });
  
  bot.command('removeclient', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const telegramId = ctx.message.text.replace('/removeclient', '').trim();
    const clientId = parseInt(telegramId);
    
    if (isNaN(clientId)) {
      return ctx.reply('❌ Telegram ID должен быть числом');
    }
    
    try {
      const result = await database.removeClient(clientId);
      
      if (result) {
        ctx.reply('✅ Клиент успешно удален');
        
        // Уведомление клиенту
        try {
          await bot.telegram.sendMessage(
            clientId,
            '⚠️ Ваш доступ к боту был отозван администратором.'
          );
        } catch (error) {
          // Игнорируем ошибку, если не удалось отправить
        }
      } else {
        ctx.reply('❌ Клиент не найден');
      }
      
    } catch (error) {
      console.error('Ошибка удаления клиента:', error);
      ctx.reply('❌ Ошибка при удалении клиента');
    }
  });
  
  bot.hears('📊 Статистика', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '📈 Общая статистика' }],
      [{ text: '👥 Детальная по клиентам' }],
      [{ text: '📦 Последние заявки' }],
      [{ text: '🏬 Статистика по складам' }],
      [{ text: '🔙 Назад в админ-панель' }]
    ];
    
    ctx.reply(
      '📊 Статистика\n\n' +
      'Выберите тип статистики:',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });

  bot.hears('📈 Общая статистика', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const stats = await database.getStats();
      
      let message = '📈 Общая статистика\n\n';
      message += `👥 Всего клиентов: ${stats.totalClients}\n`;
      message += `📦 Всего заявок: ${stats.totalOrders}\n`;
      message += `📅 Заявок сегодня: ${stats.ordersToday}\n`;
      message += `📅 Заявок за неделю: ${stats.ordersWeek}\n`;
      
      ctx.reply(message);
      
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      ctx.reply('❌ Ошибка при получении статистики');
    }
  });

  bot.hears('👥 Детальная по клиентам', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const clientStats = await database.getDetailedOrderStats();
      
      if (clientStats.length === 0) {
        return ctx.reply('📋 Нет данных о заявках клиентов');
      }
      
      let message = '👥 Детальная статистика по клиентам:\n\n';
      
      clientStats.forEach((client, index) => {
        message += `${index + 1}. ${client.client_name || 'Без имени'}\n`;
        message += `   📞 ${client.phone || 'Не указан'}\n`;
        message += `   🆔 ID: ${client.telegram_id}\n`;
        message += `   📦 Заявок: ${client.orders_count}\n`;
        
        if (client.last_order_date) {
          const lastOrder = new Date(client.last_order_date);
          message += `   📅 Последняя заявка: ${lastOrder.toLocaleDateString('ru-RU')} ${lastOrder.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}\n`;
        } else {
          message += `   📅 Заявок не было\n`;
        }
        
        message += '\n';
      });
      
      // Разбиваем длинное сообщение на части если нужно
      if (message.length > 4000) {
        const parts = [];
        let currentPart = '👥 Детальная статистика по клиентам:\n\n';
        const lines = message.split('\n');
        
        for (let i = 2; i < lines.length; i++) {
          if (currentPart.length + lines[i].length > 3800) {
            parts.push(currentPart);
            currentPart = lines[i] + '\n';
          } else {
            currentPart += lines[i] + '\n';
          }
        }
        
        if (currentPart.trim()) {
          parts.push(currentPart);
        }
        
        for (const part of parts) {
          await ctx.reply(part);
        }
      } else {
        ctx.reply(message);
      }
      
    } catch (error) {
      console.error('Ошибка получения детальной статистики:', error);
      ctx.reply('❌ Ошибка при получении детальной статистики');
    }
  });

  bot.hears('📦 Последние заявки', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const recentOrders = await database.getRecentOrdersWithClients(15);
      
      if (recentOrders.length === 0) {
        return ctx.reply('📋 Нет заявок');
      }
      
      let message = '📦 Последние 15 заявок:\n\n';
      
      recentOrders.forEach((order, index) => {
        const orderDate = new Date(order.created_at);
        message += `${index + 1}. Заявка #${order.id}\n`;
        message += `   👤 ${order.client_name || 'Без имени'}\n`;
        message += `   📞 ${order.phone || 'Не указан'}\n`;
        message += `   🏬 Склад: ${order.warehouse}\n`;
        message += `   🚛 Транспорт: ${order.transport_number || 'Не указан'}\n`;
        message += `   📅 ${orderDate.toLocaleDateString('ru-RU')} ${orderDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}\n`;
        message += `   📝 ${order.comment || 'Без комментария'}\n\n`;
      });
      
      // Разбиваем длинное сообщение на части если нужно
      if (message.length > 4000) {
        const parts = [];
        let currentPart = '📦 Последние 15 заявок:\n\n';
        const lines = message.split('\n');
        
        for (let i = 2; i < lines.length; i++) {
          if (currentPart.length + lines[i].length > 3800) {
            parts.push(currentPart);
            currentPart = lines[i] + '\n';
          } else {
            currentPart += lines[i] + '\n';
          }
        }
        
        if (currentPart.trim()) {
          parts.push(currentPart);
        }
        
        for (const part of parts) {
          await ctx.reply(part);
        }
      } else {
        ctx.reply(message);
      }
      
    } catch (error) {
      console.error('Ошибка получения последних заявок:', error);
      ctx.reply('❌ Ошибка при получении последних заявок');
    }
  });

  bot.hears('🏬 Статистика по складам', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    try {
      const warehouseStats = await database.getWarehouseStats();
      
      if (warehouseStats.length === 0) {
        return ctx.reply('📋 Нет данных по складам');
      }
      
      let message = '🏬 Статистика по складам:\n\n';
      
      warehouseStats.forEach((warehouse, index) => {
        message += `${index + 1}. ${warehouse.warehouse}\n`;
        message += `   📦 Заявок: ${warehouse.orders_count}\n`;
        message += `   👥 Уникальных клиентов: ${warehouse.unique_clients}\n\n`;
      });
      
      ctx.reply(message);
      
    } catch (error) {
      console.error('Ошибка получения статистики по складам:', error);
      ctx.reply('❌ Ошибка при получении статистики по складам');
    }
  });

  // Экспорт в Excel
  bot.hears('📄 Экспорт в Excel', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '📊 Экспорт статистики клиентов' }],
      [{ text: '📦 Экспорт последних заявок' }],
      [{ text: '🏬 Экспорт статистики складов' }],
      [{ text: '📋 Полный отчет' }],
      [{ text: '🔍 Экспорт конкретной заявки' }],
      [{ text: '🔙 Назад в админ-панель' }]
    ];
    
    ctx.reply(
      '📄 Экспорт данных в Excel\n\n' +
      'Выберите тип экспорта:',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });

  bot.hears('📊 Экспорт статистики клиентов', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    ctx.reply('⏳ Создаю файл Excel с статистикой клиентов...');
    
    try {
      const result = await excelExporter.exportClientStats();
      
      if (result.success) {
        await ctx.replyWithDocument(
          { source: result.filePath, filename: result.fileName },
          { 
            caption: '📊 Статистика по клиентам\n\n' +
                    'Файл содержит:\n' +
                    '• Имена клиентов\n' +
                    '• Контактные данные\n' +
                    '• Количество заявок\n' +
                    '• Даты первой и последней заявки'
          }
        );
      } else {
        ctx.reply(`❌ Ошибка создания файла: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка экспорта статистики клиентов:', error);
      ctx.reply('❌ Ошибка при создании файла Excel');
    }
  });

  bot.hears('📦 Экспорт последних заявок', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    ctx.reply('⏳ Создаю детальный файл Excel с заявками...');
    
    try {
      const result = await excelExporter.exportRecentOrders(100);
      
      if (result.success) {
        await ctx.replyWithDocument(
          { source: result.filePath, filename: result.fileName },
          { 
            caption: '📦 Детальные заявки (последние 100)\n\n' +
                    'Файл содержит полную информацию:\n' +
                    '• 📦 Номер заявки\n' +
                    '• 👤 Данные клиента\n' +
                    '• 🛒 Детальный список товаров\n' +
                    '• 📊 Общее количество товаров\n' +
                    '• 🚚 Транспорт и комментарии\n' +
                    '• ⏰ Точное время создания\n\n' +
                    'Формат как в заявках бота!'
          }
        );
      } else {
        ctx.reply(`❌ Ошибка создания файла: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка экспорта заявок:', error);
      ctx.reply('❌ Ошибка при создании файла Excel');
    }
  });

  bot.hears('🏬 Экспорт статистики складов', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    ctx.reply('⏳ Создаю файл Excel со статистикой складов...');
    
    try {
      const result = await excelExporter.exportWarehouseStats();
      
      if (result.success) {
        await ctx.replyWithDocument(
          { source: result.filePath, filename: result.fileName },
          { 
            caption: '🏬 Статистика по складам\n\n' +
                    'Файл содержит:\n' +
                    '• Названия складов\n' +
                    '• Количество заявок\n' +
                    '• Количество уникальных клиентов'
          }
        );
      } else {
        ctx.reply(`❌ Ошибка создания файла: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка экспорта статистики складов:', error);
      ctx.reply('❌ Ошибка при создании файла Excel');
    }
  });

  bot.hears('📋 Полный отчет', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    ctx.reply('⏳ Создаю полный отчет Excel... Это может занять некоторое время.');
    
    try {
      const result = await excelExporter.exportFullReport();
      
      if (result.success) {
        await ctx.replyWithDocument(
          { source: result.filePath, filename: result.fileName },
          { 
            caption: '📋 Полный отчет\n\n' +
                    'Файл содержит 4 листа:\n' +
                    '• 📈 Общая статистика\n' +
                    '• 👥 Детальная информация по клиентам\n' +
                    '• 🏬 Статистика по складам\n' +
                    '• 📦 Детальные заявки (как в боте)\n\n' +
                    'Последние 100 заявок с полным форматированием!'
          }
        );
        
        // Очищаем старые файлы
        excelExporter.cleanOldExports();
      } else {
        ctx.reply(`❌ Ошибка создания файла: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка создания полного отчета:', error);
      ctx.reply('❌ Ошибка при создании полного отчета');
    }
  });

  bot.hears('🔍 Экспорт конкретной заявки', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const keyboard = [
      [{ text: '🔙 Назад в админ-панель' }]
    ];
    
    ctx.reply(
      '🔍 Экспорт конкретной заявки\n\n' +
      'Отправьте команду:\n' +
      '/exportorder ID_заявки\n\n' +
      'Пример:\n' +
      '/exportorder 28\n\n' +
      'Будет создан детальный Excel файл с полной информацией о заявке.',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  });

  bot.command('exportorder', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!isAdmin(userId)) {
      return ctx.reply('❌ У вас нет прав администратора');
    }
    
    const orderId = parseInt(ctx.message.text.replace('/exportorder', '').trim());
    
    if (isNaN(orderId)) {
      return ctx.reply('❌ ID заявки должен быть числом\n\nПример: /exportorder 28');
    }
    
    ctx.reply(`⏳ Создаю детальный файл для заявки #${orderId}...`);
    
    try {
      const result = await excelExporter.exportSingleOrder(orderId);
      
      if (result.success) {
        await ctx.replyWithDocument(
          { source: result.filePath, filename: result.fileName },
          { 
            caption: `🔍 Детальная заявка #${result.orderId}\n\n` +
                    'Файл содержит 2 листа:\n' +
                    '• 📦 Полная информация о заявке\n' +
                    '• 🛒 Детальный список товаров\n\n' +
                    'Формат точно как в боте!'
          }
        );
      } else {
        ctx.reply(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка экспорта заявки:', error);
      ctx.reply('❌ Ошибка при создании файла Excel');
    }
  });
}

module.exports = {
  isAdmin,
  setupAdminCommands,
  ADMINS
};
