/**
 * Менеджер редактирования заявок
 * Позволяет редактировать отправленные заявки с обновлением сообщений в Telegram и WhatsApp
 */

const database = require('./database-wrapper');
const whatsapp = require('./whatsapp');

class OrderEditManager {
  constructor(bot) {
    this.bot = bot;
    this.editSessions = new Map(); // Хранилище сессий редактирования
  }

  /**
   * Сохранить ID сообщений при создании заявки
   */
  async saveMessageIds(orderId, telegramMessageId, whatsappMessageId, telegramGroupId) {
    try {
      const db = database.db || database.pool;
      
      if (database.pool) {
        // PostgreSQL
        await database.pool.query(
          'UPDATE orders SET telegram_message_id = $1, whatsapp_message_id = $2, telegram_group_id = $3 WHERE id = $4',
          [telegramMessageId, whatsappMessageId, telegramGroupId, orderId]
        );
      } else {
        // SQLite
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE orders SET telegram_message_id = ?, whatsapp_message_id = ?, telegram_group_id = ? WHERE id = ?',
            [telegramMessageId, whatsappMessageId, telegramGroupId, orderId],
            (err) => err ? reject(err) : resolve()
          );
        });
      }
      
      console.log(`✅ ID сообщений сохранены для заявки #${orderId}`);
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения ID сообщений:', error);
      return false;
    }
  }

  /**
   * Получить ID сообщений заявки
   */
  async getMessageIds(orderId) {
    try {
      const db = database.db || database.pool;
      
      if (database.pool) {
        // PostgreSQL
        const result = await database.pool.query(
          'SELECT telegram_message_id, whatsapp_message_id, telegram_group_id FROM orders WHERE id = $1',
          [orderId]
        );
        return result.rows[0] || null;
      } else {
        // SQLite
        return new Promise((resolve, reject) => {
          db.get(
            'SELECT telegram_message_id, whatsapp_message_id, telegram_group_id FROM orders WHERE id = ?',
            [orderId],
            (err, row) => err ? reject(err) : resolve(row || null)
          );
        });
      }
    } catch (error) {
      console.error('❌ Ошибка получения ID сообщений:', error);
      return null;
    }
  }

  /**
   * Начать редактирование заявки
   */
  async startEdit(ctx, orderId) {
    try {
      const userId = ctx.from.id;
      
      // Получаем заявку
      const order = await database.getOrderWithItems(orderId);
      if (!order) {
        return ctx.reply('❌ Заявка не найдена');
      }
      
      // Сохраняем сессию редактирования
      this.editSessions.set(userId, {
        orderId,
        order,
        step: 'menu'
      });
      
      // Показываем меню редактирования
      await this.showEditMenu(ctx, order);
      
    } catch (error) {
      console.error('❌ Ошибка начала редактирования:', error);
      ctx.reply('❌ Ошибка при загрузке заявки');
    }
  }

  /**
   * Показать меню редактирования
   */
  async showEditMenu(ctx, order) {
    const keyboard = [
      [{ text: '🏬 Изменить склад' }],
      [{ text: '🛒 Изменить товары' }],
      [{ text: '🚚 Изменить транспорт' }],
      [{ text: '📝 Изменить комментарий' }],
      [{ text: '✅ Сохранить изменения' }],
      [{ text: '❌ Отменить' }]
    ];
    
    let message = `📝 Редактирование заявки #${order.id}\n\n`;
    message += `🏬 Склад: ${order.warehouse}\n`;
    message += `🚚 Транспорт: ${order.transport_number}\n`;
    message += `📝 Комментарий: ${order.comment || 'Нет'}\n\n`;
    message += `🛒 Товары:\n`;
    
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, idx) => {
        message += `${idx + 1}. ${item.product_name} — ${item.quantity}\n`;
      });
    }
    
    message += `\nВыберите, что хотите изменить:`;
    
    ctx.reply(message, {
      reply_markup: { keyboard, resize_keyboard: true }
    });
  }

  /**
   * Обработать изменение
   */
  async handleEdit(ctx) {
    const userId = ctx.from.id;
    const session = this.editSessions.get(userId);
    
    if (!session) {
      return false;
    }
    
    const text = ctx.message.text;
    
    // Обработка меню
    if (text === '🏬 Изменить склад') {
      session.step = 'warehouse';
      this.editSessions.set(userId, session);
      
      const warehouses = await database.getAllWarehouses();
      const keyboard = warehouses.map(w => [{ text: w.name }]);
      keyboard.push([{ text: '🔙 Назад' }]);
      
      return ctx.reply('Выберите новый склад:', {
        reply_markup: { keyboard, resize_keyboard: true }
      });
    }
    
    if (text === '🛒 Изменить товары') {
      session.step = 'items_menu';
      this.editSessions.set(userId, session);
      
      const keyboard = [
        [{ text: '➕ Добавить товар' }],
        [{ text: '➖ Удалить товар' }],
        [{ text: '✏️ Изменить количество' }],
        [{ text: '🔙 Назад' }]
      ];
      
      return ctx.reply('Что сделать с товарами?', {
        reply_markup: { keyboard, resize_keyboard: true }
      });
    }
    
    if (text === '🚚 Изменить транспорт') {
      session.step = 'transport';
      this.editSessions.set(userId, session);
      
      return ctx.reply('Введите новый номер транспорта:', {
        reply_markup: { remove_keyboard: true }
      });
    }
    
    if (text === '📝 Изменить комментарий') {
      session.step = 'comment';
      this.editSessions.set(userId, session);
      
      return ctx.reply('Введите новый комментарий (или "-" чтобы удалить):', {
        reply_markup: { remove_keyboard: true }
      });
    }
    
    if (text === '✅ Сохранить изменения') {
      return await this.saveChanges(ctx, session);
    }
    
    if (text === '❌ Отменить' || text === '🔙 Назад') {
      this.editSessions.delete(userId);
      return ctx.reply('❌ Редактирование отменено', {
        reply_markup: { remove_keyboard: true }
      });
    }
    
    // Обработка ввода данных
    if (session.step === 'warehouse') {
      const warehouses = await database.getAllWarehouses();
      const warehouse = warehouses.find(w => w.name === text);
      
      if (warehouse) {
        session.order.warehouse = text;
        session.step = 'menu';
        this.editSessions.set(userId, session);
        
        await this.showEditMenu(ctx, session.order);
        return true;
      }
    }
    
    if (session.step === 'transport') {
      session.order.transport_number = text;
      session.step = 'menu';
      this.editSessions.set(userId, session);
      
      await this.showEditMenu(ctx, session.order);
      return true;
    }
    
    if (session.step === 'comment') {
      session.order.comment = text === '-' ? '' : text;
      session.step = 'menu';
      this.editSessions.set(userId, session);
      
      await this.showEditMenu(ctx, session.order);
      return true;
    }
    
    return false;
  }

  /**
   * Сохранить изменения
   */
  async saveChanges(ctx, session) {
    try {
      const { orderId, order } = session;
      
      ctx.reply('⏳ Сохраняю изменения...');
      
      // Обновляем заявку в базе данных
      const db = database.db || database.pool;
      
      if (database.pool) {
        // PostgreSQL
        await database.pool.query(
          'UPDATE orders SET warehouse = $1, transport_number = $2, comment = $3 WHERE id = $4',
          [order.warehouse, order.transport_number, order.comment, orderId]
        );
      } else {
        // SQLite
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE orders SET warehouse = ?, transport_number = ?, comment = ? WHERE id = ?',
            [order.warehouse, order.transport_number, order.comment, orderId],
            (err) => err ? reject(err) : resolve()
          );
        });
      }
      
      // Получаем ID сообщений
      const messageIds = await this.getMessageIds(orderId);
      
      // Формируем обновленное сообщение
      const updatedMessage = await this.formatOrderMessage(order);
      
      // Обновляем сообщение в Telegram
      if (messageIds && messageIds.telegram_message_id && messageIds.telegram_group_id) {
        try {
          await this.bot.telegram.editMessageText(
            messageIds.telegram_group_id,
            messageIds.telegram_message_id,
            null,
            updatedMessage
          );
          console.log('✅ Сообщение в Telegram обновлено');
        } catch (error) {
          console.error('❌ Ошибка обновления Telegram:', error.message);
        }
      }
      
      // Обновляем сообщение в WhatsApp
      if (messageIds && messageIds.whatsapp_message_id) {
        try {
          // WhatsApp не поддерживает редактирование, отправляем новое
          const warehouseWhatsAppGroup = await database.getWarehouseWhatsApp(order.warehouse);
          if (warehouseWhatsAppGroup) {
            const editNote = `\n\n✏️ ЗАЯВКА ОТРЕДАКТИРОВАНА`;
            await whatsapp.sendToGroup(updatedMessage + editNote, warehouseWhatsAppGroup);
            console.log('✅ Новое сообщение отправлено в WhatsApp');
          }
        } catch (error) {
          console.error('❌ Ошибка отправки в WhatsApp:', error.message);
        }
      }
      
      // Очищаем сессию
      this.editSessions.delete(ctx.from.id);
      
      ctx.reply('✅ Изменения сохранены и отправлены!', {
        reply_markup: { remove_keyboard: true }
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Ошибка сохранения изменений:', error);
      ctx.reply('❌ Ошибка при сохранении изменений');
      return false;
    }
  }

  /**
   * Форматировать сообщение заявки
   */
  async formatOrderMessage(order) {
    // Получаем информацию о клиенте
    const orders = await database.getRecentOrdersWithClients(1000);
    const orderInfo = orders.find(o => o.id === order.id);
    
    let message = '📦 НОВАЯ ЗАЯВКА\n\n';
    
    if (orderInfo) {
      message += `👤 Клиент: ${orderInfo.client_name || 'Без имени'}\n`;
      message += `📞 Телефон: ${orderInfo.phone || 'Не указан'}\n`;
    }
    
    message += `🏬 Склад: ${order.warehouse}\n\n`;
    message += `🛒 Товары:\n`;
    
    let totalQuantity = 0;
    
    if (order.items && order.items.length > 0) {
      order.items.forEach((item, index) => {
        message += `${index + 1}) ${item.product_name} — ${item.quantity}\n`;
        
        const quantityMatch = item.quantity.match(/(\d+)/);
        if (quantityMatch) {
          totalQuantity += parseInt(quantityMatch[1]);
        }
      });
    }
    
    message += `\n📊 Итого: ${totalQuantity} шт\n`;
    message += `\n🚚 Транспорт: ${order.transport_number}\n`;
    
    if (order.comment) {
      message += `📝 Комментарий: ${order.comment}\n`;
    }
    
    message += `\n⏰ Время: ${new Date(order.created_at).toLocaleString('ru-RU')}`;
    
    return message;
  }
}

module.exports = OrderEditManager;
