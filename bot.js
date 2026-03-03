require('dotenv').config();

// 🔧 ИСПРАВЛЕНИЕ: Путь к базе данных для контейнера
const fs = require('fs');
const path = require('path');
const dataDir = process.env.DATA_DIR || '/tmp';
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`✅ Создана директория: ${dataDir}`);
    } catch (e) {
        console.log(`⚠️ Используем /tmp для БД`);
    }
}
process.env.DB_PATH = path.join(dataDir, 'orders.db');
console.log(`📁 База данных: ${process.env.DB_PATH}`);

const { Telegraf, Scenes, session } = require('telegraf');
const database = require('./database');
const whatsapp = require('./whatsapp');
const admin = require('./admin');

// 🔧 Загружаем исправления для Order Bot (отложенная загрузка)
setTimeout(() => {
    try {
        const orderBotFixes = require('./fix-order-bot-soft-delete-v2');
        console.log('🔧 Исправления Order Bot загружены');
    } catch (error) {
        console.log('⚠️ Исправления Order Bot не загружены:', error.message);
    }
}, 3000);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Настройка команд администратора
admin.setupAdminCommands(bot);

// Временное хранилище данных заявки
const orderData = new Map();

// Загрузка складов и товаров из БД
let warehouses = [];
let products = [];

async function loadWarehousesAndProducts() {
  try {
    const dbWarehouses = await database.getAllWarehouses();
    const dbProducts = await database.getAllProducts();
    
    warehouses = dbWarehouses.length > 0 
      ? dbWarehouses.map(w => w.name)
      : ['Склад №1', 'Склад №2', 'Склад №3', 'Другой'];
    
    products = dbProducts.length > 0
      ? dbProducts.map(p => p.name)
      : ['Цемент', 'Песок', 'Щебень', 'Кирпич', 'Арматура', 'Другое'];
    
    console.log(`✅ Загружено складов: ${warehouses.length}, товаров: ${products.length}`);
  } catch (error) {
    console.error('Ошибка загрузки складов и товаров:', error);
    // Используем значения по умолчанию
    warehouses = ['Склад №1', 'Склад №2', 'Склад №3', 'Другой'];
    products = ['Цемент', 'Песок', 'Щебень', 'Кирпич', 'Арматура', 'Другое'];
  }
}

// Загружаем при старте
setTimeout(loadWarehousesAndProducts, 1000);

// Форматирование заявки для отправки
function formatOrder(orderInfo) {
  let message = '📦 НОВАЯ ЗАЯВКА\n\n';
  message += `👤 Клиент: ${orderInfo.name}\n`;
  message += `📞 Телефон: ${orderInfo.phone}\n`;
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

// Команда /start
bot.command('start', async (ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.first_name || ctx.from.username || 'Пользователь';
  
  // Проверка прав доступа
  const isAdminUser = admin.isAdmin(userId);
  const isClientUser = await database.isClient(userId);
  
  if (isAdminUser) {
    const keyboard = [
      [{ text: '📦 Создать заявку' }],
      [{ text: '👨‍💼 Панель администратора' }]
    ];
    
    return ctx.reply(
      '👋 Добро пожаловать, администратор!\n\n' +
      'Выберите действие:',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  }
  
  if (isClientUser) {
    // Показываем постоянное меню
    const keyboard = [
      [{ text: '🏬 Склад' }]
    ];
    
    return ctx.reply(
      '👋 Добро пожаловать в систему приема заявок!\n\n' +
      'Нажмите "🏬 Склад" чтобы создать заявку',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
  }
  
  // Пользователь не зарегистрирован - отправляем запрос администратору
  const pendingRequest = await database.getPendingRequest(userId);
  
  if (pendingRequest) {
    return ctx.reply(
      '⏳ Ваш запрос на регистрацию уже отправлен администратору.\n\n' +
      'Пожалуйста, ожидайте подтверждения.'
    );
  }
  
  // Создаем запрос на регистрацию
  await database.createRegistrationRequest(userId, userName, ctx.from.username);
  
  ctx.reply(
    '📝 Ваш запрос на регистрацию отправлен администратору.\n\n' +
    'Вы получите уведомление, когда администратор одобрит вашу заявку.\n\n' +
    'Ваш Telegram ID: ' + userId
  );
  
  // Уведомление всем администраторам
  for (const adminId of admin.ADMINS) {
    try {
      const keyboard = [
        [{ text: `✅ Одобрить ${userName}`, callback_data: `approve_${userId}` }],
        [{ text: `❌ Отклонить ${userName}`, callback_data: `reject_${userId}` }]
      ];
      
      await bot.telegram.sendMessage(
        adminId,
        '🔔 Новый запрос на регистрацию!\n\n' +
        `👤 Имя: ${userName}\n` +
        `🆔 Telegram ID: ${userId}\n` +
        `📱 Username: @${ctx.from.username || 'не указан'}\n\n` +
        'Одобрить регистрацию?',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Одобрить', callback_data: `approve_${userId}` },
                { text: '❌ Отклонить', callback_data: `reject_${userId}` }
              ]
            ]
          }
        }
      );
    } catch (error) {
      console.error('Ошибка отправки уведомления админу:', error);
    }
  }
});

// Обработка кнопок для администратора
bot.hears('📦 Создать заявку', async (ctx) => {
  const userId = ctx.from.id;
  
  if (!admin.isAdmin(userId)) {
    return;
  }
  
  // Начинаем процесс создания заявки
  orderData.set(userId, { items: [], step: 'warehouse' });
  
  // Перезагружаем склады из БД
  await loadWarehousesAndProducts();
  
  const keyboard = warehouses.map(w => [{ text: w }]);
  
  ctx.reply(
    '📦 Создание новой заявки\n\n' +
    '🏬 Выберите склад:',
    { reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }
  );
});

// Обработка кнопки "🏬 Склад" - начало создания заявки
bot.hears('🏬 Склад', async (ctx) => {
  const userId = ctx.from.id;
  
  const isAdminUser = admin.isAdmin(userId);
  const isClientUser = await database.isClient(userId);
  
  if (!isAdminUser && !isClientUser) {
    return;
  }
  
  // Начинаем процесс создания заявки
  orderData.set(userId, { items: [], step: 'warehouse' });
  
  // Перезагружаем склады из БД
  await loadWarehousesAndProducts();
  
  const keyboard = warehouses.map(w => [{ text: w }]);
  
  ctx.reply(
    '🏬 Выберите склад:',
    { reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }
  );
});

bot.hears('👨‍💼 Панель администратора', async (ctx) => {
  const userId = ctx.from.id;
  
  if (!admin.isAdmin(userId)) {
    return ctx.reply('❌ У вас нет прав администратора');
  }
  
  const keyboard = [
    [{ text: '➕ Добавить клиента' }],
    [{ text: '📋 Список клиентов' }],
    [{ text: '✏️ Изменить данные клиента' }],
    [{ text: '🚫 Заблокировать клиента' }],
    [{ text: '🏬 Управление складами' }],
    [{ text: '🛒 Управление товарами' }],
    [{ text: '📊 Статистика' }],
    [{ text: '🔙 Назад' }]
  ];
  
  ctx.reply(
    '👨‍💼 Панель администратора\n\n' +
    'Выберите действие:',
    { reply_markup: { keyboard, resize_keyboard: true } }
  );
});

bot.hears('🔙 Назад', async (ctx) => {
  const userId = ctx.from.id;
  
  if (!admin.isAdmin(userId)) {
    return;
  }
  
  const keyboard = [
    [{ text: '📦 Создать заявку' }],
    [{ text: '👨‍💼 Панель администратора' }]
  ];
  
  ctx.reply(
    'Главное меню:',
    { reply_markup: { keyboard, resize_keyboard: true } }
  );
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  
  // Игнорируем команды (они обрабатываются отдельно)
  if (text.startsWith('/')) {
    return;
  }
  
  // Проверка прав доступа
  const isAdminUser = admin.isAdmin(userId);
  const isClientUser = await database.isClient(userId);
  
  if (!isAdminUser && !isClientUser) {
    return; // Игнорируем сообщения от неавторизованных пользователей
  }
  
  const data = orderData.get(userId) || { items: [], step: 'name' };

  try {
    // Обработка редактирования профиля
    if (data.editingProfile === 'name') {
      const newName = text.trim();
      
      try {
        const client = await database.getClient(userId);
        await database.updateClient(userId, newName, client.phone);
        
        delete data.editingProfile;
        orderData.delete(userId);
        
        const keyboard = isAdminUser 
          ? [[{ text: '📦 Создать заявку' }], [{ text: '👨‍💼 Панель администратора' }]]
          : [[{ text: '🏬 Склад' }]];
        
        return ctx.reply(
          `✅ Имя успешно изменено на: ${newName}`,
          { reply_markup: { keyboard, resize_keyboard: true } }
        );
      } catch (error) {
        console.error('Ошибка обновления имени:', error);
        return ctx.reply('❌ Ошибка при обновлении имени');
      }
    }
    
    if (data.editingProfile === 'phone') {
      const newPhone = text.trim();
      
      try {
        const client = await database.getClient(userId);
        await database.updateClient(userId, client.name, newPhone);
        
        delete data.editingProfile;
        orderData.delete(userId);
        
        const keyboard = isAdminUser 
          ? [[{ text: '📦 Создать заявку' }], [{ text: '👨‍💼 Панель администратора' }]]
          : [[{ text: '🏬 Склад' }]];
        
        return ctx.reply(
          `✅ Телефон успешно изменен на: ${newPhone}`,
          { reply_markup: { keyboard, resize_keyboard: true } }
        );
      } catch (error) {
        console.error('Ошибка обновления телефона:', error);
        return ctx.reply('❌ Ошибка при обновлении телефона');
      }
    }
    
    // Шаг 1: Выбор склада
    if (data.step === 'warehouse' && warehouses.includes(text)) {
      data.warehouse = text;
      data.step = 'product';
      orderData.set(userId, data);
      
      // Перезагружаем товары из БД
      await loadWarehousesAndProducts();
      
      const keyboard = products.map(p => [{ text: p }]);
      
      return ctx.reply(
        `✅ Склад: ${text}\n\n🛒 Выберите товар:`,
        { reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }
      );
    }

    // Шаг 2: Выбор товара
    if (data.step === 'product' && products.includes(text)) {
      data.currentProduct = text;
      data.step = 'quantity';
      orderData.set(userId, data);
      
      return ctx.reply(
        `📦 Товар: ${text}\n\n` +
        'Введите количество (только число):\n(например: 200)',
        { reply_markup: { remove_keyboard: true } }
      );
    }

    // Шаг 3: Количество товара
    if (data.step === 'quantity') {
      // Проверяем, что введено число
      const quantity = text.trim();
      
      data.items = data.items || [];
      data.items.push({
        product: data.currentProduct,
        quantity: quantity + ' шт'  // Автоматически добавляем "шт"
      });
      delete data.currentProduct;
      
      // Спрашиваем, нужно ли добавить еще товары
      data.step = 'add_more';
      orderData.set(userId, data);
      
      const keyboard = [
        [{ text: '➕ Добавить еще товар' }],
        [{ text: '✅ Продолжить' }]
      ];
      
      let message = '✅ Товар добавлен!\n\n';
      message += `🏬 Склад: ${data.warehouse}\n\n`;
      message += 'Товары:\n';
      data.items.forEach((item, i) => {
        message += `${i + 1}. ${item.product} — ${item.quantity}\n`;
      });
      message += '\nЧто дальше?';
      
      return ctx.reply(message, {
        reply_markup: { keyboard, resize_keyboard: true }
      });
    }

    // Шаг 4: Добавить еще товар или продолжить
    if (data.step === 'add_more') {
      if (text === '➕ Добавить еще товар') {
        data.step = 'product';
        orderData.set(userId, data);
        
        // Перезагружаем товары из БД
        await loadWarehousesAndProducts();
        
        const keyboard = products.map(p => [{ text: p }]);
        
        return ctx.reply(
          '🛒 Выберите товар:',
          { reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }
        );
      }
      
      if (text === '✅ Продолжить') {
        // Проверяем, есть ли сохраненные данные клиента
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

    // Шаг 5: Имя (если первый раз)
    if (data.step === 'name') {
      data.name = text;
      data.step = 'phone';
      orderData.set(userId, data);
      return ctx.reply('📞 Введите ваш номер телефона:\n(например: +992900000000)');
    }

    // Шаг 6: Телефон (если первый раз)
    if (data.step === 'phone') {
      data.phone = text;
      data.step = 'transport';
      orderData.set(userId, data);
      
      // Сохраняем имя и телефон в базу данных
      try {
        await database.updateClient(userId, data.name, data.phone);
      } catch (error) {
        console.error('Ошибка сохранения данных клиента:', error);
      }
      
      return ctx.reply('🚚 Введите номер транспорта:\n(например: 1234 AB)');
    }

    // Шаг 7: Номер транспорта
    if (data.step === 'transport') {
      data.transport = text;
      data.step = 'comment';
      orderData.set(userId, data);
      return ctx.reply('📝 Введите комментарий или отправьте "-" чтобы пропустить:');
    }

    // Шаг 8: Комментарий
    if (data.step === 'comment') {
      data.comment = text === '-' ? '' : text;
      data.step = 'confirm';
      orderData.set(userId, data);
      
      const preview = formatOrder(data);
      const keyboard = [
        [{ text: '✅ Подтвердить' }],
        [{ text: '❌ Отменить' }]
      ];
      
      return ctx.reply(
        '📋 Проверьте заявку:\n\n' + preview + '\n\nВсе верно?',
        { reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: true } }
      );
    }

    // Подтверждение заявки
    if (text === '✅ Подтвердить') {
      const orderMessage = formatOrder(data);
      
      // Сохранение в БД
      try {
        const user = await database.getOrCreateUser(userId, data.name, data.phone);
        const orderId = await database.createOrder(
          user.id,
          data.warehouse,
          data.transport,
          data.comment
        );
        
        for (const item of data.items) {
          await database.addOrderItem(orderId, item.product, item.quantity);
        }
        
        ctx.reply('💾 Заявка сохранена в базе данных');
      } catch (error) {
        console.error('Ошибка сохранения в БД:', error);
      }

      // Отправка в Telegram группу
      const groupId = process.env.TELEGRAM_GROUP_ID;
      let telegramSent = false;
      
      if (groupId) {
        try {
          await bot.telegram.sendMessage(groupId, orderMessage);
          console.log('✅ Заявка отправлена в Telegram группу');
          telegramSent = true;
        } catch (error) {
          console.error('❌ Ошибка отправки в Telegram группу:', error.message);
        }
      }

      // Отправка в WhatsApp через Green-API
      let whatsappSent = false;
      const whatsappGroupId = process.env.WHATSAPP_GROUP_ID;
      const whatsappRecipient = process.env.WHATSAPP_RECIPIENT;
      
      if (whatsappGroupId) {
        // Отправка в WhatsApp группу
        try {
          whatsappSent = await whatsapp.sendToGroup(orderMessage, whatsappGroupId);
        } catch (error) {
          console.error('❌ Ошибка отправки в WhatsApp группу:', error);
        }
      } else if (whatsappRecipient) {
        // Отправка личному получателю
        try {
          whatsappSent = await whatsapp.sendMessage(orderMessage);
        } catch (error) {
          console.error('❌ Ошибка отправки в WhatsApp:', error);
        }
      }
      
      // Уведомление пользователя
      let statusMessage = '';
      if (telegramSent && whatsappSent) {
        statusMessage = '✅ Заявка отправлена в Telegram и WhatsApp!';
      } else if (telegramSent) {
        statusMessage = '✅ Заявка отправлена в Telegram группу!';
      } else if (whatsappSent) {
        statusMessage = '✅ Заявка отправлена в WhatsApp!';
      } else {
        statusMessage = '⚠️ Заявка сохранена в базе данных';
      }
      
      ctx.reply(statusMessage, {
        reply_markup: { remove_keyboard: true }
      });

      // Очистка данных
      orderData.delete(userId);
      
      // Возвращаем меню
      const isAdminUser = admin.isAdmin(userId);
      
      if (isAdminUser) {
        const keyboard = [
          [{ text: '📦 Создать заявку' }],
          [{ text: '👨‍💼 Панель администратора' }]
        ];
        
        setTimeout(() => {
          ctx.reply('Главное меню:', {
            reply_markup: { keyboard, resize_keyboard: true }
          });
        }, 2000);
      } else {
        const keyboard = [
          [{ text: '🏬 Склад' }]
        ];
        
        setTimeout(() => {
          ctx.reply('Создать новую заявку? Нажмите "🏬 Склад"', {
            reply_markup: { keyboard, resize_keyboard: true }
          });
        }, 2000);
      }
    }

    // Отмена заявки
    if (text === '❌ Отменить') {
      orderData.delete(userId);
      ctx.reply('❌ Заявка отменена. Для новой заявки нажмите /start', {
        reply_markup: { remove_keyboard: true }
      });
    }

  } catch (error) {
    console.error('Ошибка обработки:', error);
    ctx.reply('❌ Произошла ошибка. Попробуйте снова /start');
    orderData.delete(userId);
  }
});

// Команда /profile - изменить свои данные
bot.command('profile', async (ctx) => {
  const userId = ctx.from.id;
  
  const isClientUser = await database.isClient(userId);
  
  if (!isClientUser && !admin.isAdmin(userId)) {
    return ctx.reply('❌ У вас нет доступа к боту');
  }
  
  try {
    const client = await database.getClient(userId);
    
    if (!client) {
      return ctx.reply('❌ Ваши данные не найдены');
    }
    
    const keyboard = [
      [{ text: '✏️ Изменить имя' }],
      [{ text: '✏️ Изменить телефон' }],
      [{ text: '🔙 Отмена' }]
    ];
    
    ctx.reply(
      '👤 Ваш профиль:\n\n' +
      `Имя: ${client.name || 'не указано'}\n` +
      `Телефон: ${client.phone || 'не указан'}\n\n` +
      'Что хотите изменить?',
      { reply_markup: { keyboard, resize_keyboard: true } }
    );
    
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    ctx.reply('❌ Ошибка при получении данных профиля');
  }
});

// Обработка изменения имени
bot.hears('✏️ Изменить имя', async (ctx) => {
  const userId = ctx.from.id;
  
  const isClientUser = await database.isClient(userId);
  
  if (!isClientUser && !admin.isAdmin(userId)) {
    return;
  }
  
  const data = orderData.get(userId) || {};
  data.editingProfile = 'name';
  orderData.set(userId, data);
  
  ctx.reply(
    '✏️ Введите новое имя:',
    { reply_markup: { remove_keyboard: true } }
  );
});

// Обработка изменения телефона
bot.hears('✏️ Изменить телефон', async (ctx) => {
  const userId = ctx.from.id;
  
  const isClientUser = await database.isClient(userId);
  
  if (!isClientUser && !admin.isAdmin(userId)) {
    return;
  }
  
  const data = orderData.get(userId) || {};
  data.editingProfile = 'phone';
  orderData.set(userId, data);
  
  ctx.reply(
    '✏️ Введите новый номер телефона:\n(например: +992900000000)',
    { reply_markup: { remove_keyboard: true } }
  );
});

bot.hears('🔙 Отмена', async (ctx) => {
  const userId = ctx.from.id;
  
  orderData.delete(userId);
  
  const isAdminUser = admin.isAdmin(userId);
  
  if (isAdminUser) {
    const keyboard = [
      [{ text: '📦 Создать заявку' }],
      [{ text: '👨‍💼 Панель администратора' }]
    ];
    
    ctx.reply('Главное меню:', {
      reply_markup: { keyboard, resize_keyboard: true }
    });
  } else {
    const keyboard = [
      [{ text: '🏬 Склад' }]
    ];
    
    ctx.reply('Главное меню:', {
      reply_markup: { keyboard, resize_keyboard: true }
    });
  }
});

// Команда /cancel
bot.command('cancel', (ctx) => {
  orderData.delete(ctx.from.id);
  ctx.reply('❌ Заявка отменена. Для новой заявки нажмите /start', {
    reply_markup: { remove_keyboard: true }
  });
});

// Запуск бота
async function startBot() {
  try {
    await bot.launch();
    console.log('🤖 Бот запущен успешно!');
    const botInfo = await bot.telegram.getMe();
    console.log('📱 Telegram: @' + botInfo.username);
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  }
}

startBot();

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  database.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  database.close();
});
