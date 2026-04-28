const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const database = require('./database');

class ExcelExporter {
  constructor() {
    // Создаем папку для экспорта если её нет
    this.exportDir = './exports';
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir);
    }
  }

  // Экспорт детальной статистики по клиентам
  async exportClientStats() {
    try {
      const clientStats = await database.getDetailedOrderStats();
      
      const data = clientStats.map((client, index) => ({
        '№': index + 1,
        'Имя клиента': client.client_name || 'Без имени',
        'Телефон': client.phone || 'Не указан',
        'Telegram ID': client.telegram_id,
        'Количество заявок': client.orders_count,
        'Последняя заявка': client.last_order_date ? 
          new Date(client.last_order_date).toLocaleString('ru-RU') : 'Заявок не было',
        'Первая заявка': client.first_order_date ? 
          new Date(client.first_order_date).toLocaleString('ru-RU') : 'Заявок не было'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Статистика по клиентам');

      const fileName = `clients_stats_${this.getDateString()}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);
      
      XLSX.writeFile(workbook, filePath);
      
      return { success: true, fileName, filePath };
    } catch (error) {
      console.error('Ошибка экспорта статистики клиентов:', error);
      return { success: false, error: error.message };
    }
  }

  // Экспорт последних заявок с детальным форматом
  async exportRecentOrders(limit = 50) {
    try {
      const orders = await database.getRecentOrdersWithClients(limit);
      
      const data = [];
      
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const orderDate = new Date(order.created_at);
        
        // Получаем товары для заявки
        let itemsText = 'Не указаны';
        let totalQuantity = 0;
        
        try {
          const orderWithItems = await database.getOrderWithItems(order.id);
          if (orderWithItems.items && orderWithItems.items.length > 0) {
            const itemsList = orderWithItems.items.map((item, idx) => {
              const quantity = parseInt(item.quantity) || 0;
              totalQuantity += quantity;
              return `${idx + 1}) ${item.product_name} — ${item.quantity} шт`;
            });
            itemsText = itemsList.join('\n');
          }
        } catch (error) {
          itemsText = 'Ошибка загрузки товаров';
        }
        
        // Формируем детальную запись как в заявке
        const detailedOrder = {
          '№': i + 1,
          'Заявка': `📦 ЗАЯВКА #${order.id}`,
          'Клиент': `👤 ${order.client_name || 'Без имени'}`,
          'Телефон': `📞 ${order.phone || 'Не указан'}`,
          'Telegram ID': order.telegram_id,
          'Склад': `🏬 ${order.warehouse || 'Не указан'}`,
          'Товары': `🛒 Товары:\n${itemsText}`,
          'Итого товаров': `📊 Итого: ${totalQuantity} шт`,
          'Транспорт': `🚚 ${order.transport_number || 'Не указан'}`,
          'Комментарий': `📝 ${order.comment || 'Без комментария'}`,
          'Статус': order.status,
          'Время создания': `⏰ ${orderDate.toLocaleDateString('ru-RU')}, ${orderDate.toLocaleTimeString('ru-RU')}`
        };
        
        data.push(detailedOrder);
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Настраиваем ширину колонок
      const colWidths = [
        { wch: 5 },   // №
        { wch: 20 },  // Заявка
        { wch: 25 },  // Клиент
        { wch: 20 },  // Телефон
        { wch: 15 },  // Telegram ID
        { wch: 20 },  // Склад
        { wch: 50 },  // Товары
        { wch: 20 },  // Итого товаров
        { wch: 25 },  // Транспорт
        { wch: 40 },  // Комментарий
        { wch: 15 },  // Статус
        { wch: 25 }   // Время создания
      ];
      worksheet['!cols'] = colWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Детальные заявки');

      const fileName = `detailed_orders_${this.getDateString()}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);
      
      XLSX.writeFile(workbook, filePath);
      
      return { success: true, fileName, filePath };
    } catch (error) {
      console.error('Ошибка экспорта заявок:', error);
      return { success: false, error: error.message };
    }
  }

  // Экспорт статистики по складам
  async exportWarehouseStats() {
    try {
      const warehouseStats = await database.getWarehouseStats();
      
      const data = warehouseStats.map((warehouse, index) => ({
        '№': index + 1,
        'Название склада': warehouse.warehouse || 'Без названия',
        'Количество заявок': warehouse.orders_count,
        'Уникальных клиентов': warehouse.unique_clients
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Статистика по складам');

      const fileName = `warehouse_stats_${this.getDateString()}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);
      
      XLSX.writeFile(workbook, filePath);
      
      return { success: true, fileName, filePath };
    } catch (error) {
      console.error('Ошибка экспорта статистики складов:', error);
      return { success: false, error: error.message };
    }
  }

  // Полный экспорт всех данных
  async exportFullReport() {
    try {
      const workbook = XLSX.utils.book_new();

      // 1. Общая статистика
      const generalStats = await database.getStats();
      const generalData = [
        { 'Показатель': 'Всего клиентов', 'Значение': generalStats.totalClients },
        { 'Показатель': 'Всего заявок', 'Значение': generalStats.totalOrders },
        { 'Показатель': 'Заявок сегодня', 'Значение': generalStats.ordersToday },
        { 'Показатель': 'Заявок за неделю', 'Значение': generalStats.ordersWeek }
      ];
      const generalSheet = XLSX.utils.json_to_sheet(generalData);
      XLSX.utils.book_append_sheet(workbook, generalSheet, 'Общая статистика');

      // 2. Статистика по клиентам
      const clientStats = await database.getDetailedOrderStats();
      const clientData = clientStats.map((client, index) => ({
        '№': index + 1,
        'Имя клиента': client.client_name || 'Без имени',
        'Телефон': client.phone || 'Не указан',
        'Telegram ID': client.telegram_id,
        'Количество заявок': client.orders_count,
        'Последняя заявка': client.last_order_date ? 
          new Date(client.last_order_date).toLocaleString('ru-RU') : 'Заявок не было',
        'Первая заявка': client.first_order_date ? 
          new Date(client.first_order_date).toLocaleString('ru-RU') : 'Заявок не было'
      }));
      const clientSheet = XLSX.utils.json_to_sheet(clientData);
      XLSX.utils.book_append_sheet(workbook, clientSheet, 'Клиенты');

      // 3. Статистика по складам
      const warehouseStats = await database.getWarehouseStats();
      const warehouseData = warehouseStats.map((warehouse, index) => ({
        '№': index + 1,
        'Название склада': warehouse.warehouse || 'Без названия',
        'Количество заявок': warehouse.orders_count,
        'Уникальных клиентов': warehouse.unique_clients
      }));
      const warehouseSheet = XLSX.utils.json_to_sheet(warehouseData);
      XLSX.utils.book_append_sheet(workbook, warehouseSheet, 'Склады');

      // 4. Детальные заявки
      const orders = await database.getRecentOrdersWithClients(100);
      const orderData = [];
      
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const orderDate = new Date(order.created_at);
        
        // Получаем товары для заявки
        let itemsText = 'Не указаны';
        let totalQuantity = 0;
        
        try {
          const orderWithItems = await database.getOrderWithItems(order.id);
          if (orderWithItems.items && orderWithItems.items.length > 0) {
            const itemsList = orderWithItems.items.map((item, idx) => {
              const quantity = parseInt(item.quantity) || 0;
              totalQuantity += quantity;
              return `${idx + 1}) ${item.product_name} — ${item.quantity} шт`;
            });
            itemsText = itemsList.join('\n');
          }
        } catch (error) {
          itemsText = 'Ошибка загрузки товаров';
        }
        
        // Формируем детальную запись
        const detailedOrder = {
          '№': i + 1,
          'Заявка': `📦 ЗАЯВКА #${order.id}`,
          'Клиент': `👤 ${order.client_name || 'Без имени'}`,
          'Телефон': `📞 ${order.phone || 'Не указан'}`,
          'Telegram ID': order.telegram_id,
          'Склад': `🏬 ${order.warehouse || 'Не указан'}`,
          'Товары': `🛒 Товары:\n${itemsText}`,
          'Итого товаров': `📊 Итого: ${totalQuantity} шт`,
          'Транспорт': `🚚 ${order.transport_number || 'Не указан'}`,
          'Комментарий': `📝 ${order.comment || 'Без комментария'}`,
          'Статус': order.status,
          'Время создания': `⏰ ${orderDate.toLocaleDateString('ru-RU')}, ${orderDate.toLocaleTimeString('ru-RU')}`
        };
        
        orderData.push(detailedOrder);
      }
      
      const orderSheet = XLSX.utils.json_to_sheet(orderData);
      
      // Настраиваем ширину колонок для листа заявок
      const orderColWidths = [
        { wch: 5 },   // №
        { wch: 20 },  // Заявка
        { wch: 25 },  // Клиент
        { wch: 20 },  // Телефон
        { wch: 15 },  // Telegram ID
        { wch: 20 },  // Склад
        { wch: 50 },  // Товары
        { wch: 20 },  // Итого товаров
        { wch: 25 },  // Транспорт
        { wch: 40 },  // Комментарий
        { wch: 15 },  // Статус
        { wch: 25 }   // Время создания
      ];
      orderSheet['!cols'] = orderColWidths;
      
      XLSX.utils.book_append_sheet(workbook, orderSheet, 'Детальные заявки');

      const fileName = `full_report_${this.getDateString()}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);
      
      XLSX.writeFile(workbook, filePath);
      
      return { success: true, fileName, filePath };
    } catch (error) {
      console.error('Ошибка создания полного отчета:', error);
      return { success: false, error: error.message };
    }
  }

  // Экспорт конкретной заявки по ID
  async exportSingleOrder(orderId) {
    try {
      // Получаем заявку с товарами
      const orderWithItems = await database.getOrderWithItems(orderId);
      
      if (!orderWithItems) {
        return { success: false, error: 'Заявка не найдена' };
      }
      
      // Получаем информацию о клиенте
      const orders = await database.getRecentOrdersWithClients(1000);
      const orderInfo = orders.find(o => o.id === orderId);
      
      if (!orderInfo) {
        return { success: false, error: 'Информация о клиенте не найдена' };
      }
      
      const orderDate = new Date(orderInfo.created_at);
      
      // Формируем список товаров
      let itemsText = 'Не указаны';
      let totalQuantity = 0;
      
      if (orderWithItems.items && orderWithItems.items.length > 0) {
        const itemsList = orderWithItems.items.map((item, idx) => {
          const quantity = parseInt(item.quantity) || 0;
          totalQuantity += quantity;
          return `${idx + 1}) ${item.product_name} — ${item.quantity} шт`;
        });
        itemsText = itemsList.join('\n');
      }
      
      // Создаем детальную информацию о заявке
      const orderData = [{
        'Информация': 'Значение',
        'Заявка': `📦 ЗАЯВКА #${orderInfo.id}`,
        'Клиент': `👤 ${orderInfo.client_name || 'Без имени'}`,
        'Телефон': `📞 ${orderInfo.phone || 'Не указан'}`,
        'Telegram ID': orderInfo.telegram_id,
        'Склад': `🏬 ${orderInfo.warehouse || 'Не указан'}`,
        'Товары': `🛒 Товары:\n${itemsText}`,
        'Итого товаров': `📊 Итого: ${totalQuantity} шт`,
        'Транспорт': `🚚 ${orderInfo.transport_number || 'Не указан'}`,
        'Комментарий': `📝 ${orderInfo.comment || 'Без комментария'}`,
        'Статус': orderInfo.status,
        'Время создания': `⏰ ${orderDate.toLocaleDateString('ru-RU')}, ${orderDate.toLocaleTimeString('ru-RU')}`
      }];
      
      // Создаем отдельный лист для товаров
      const itemsData = [];
      if (orderWithItems.items && orderWithItems.items.length > 0) {
        orderWithItems.items.forEach((item, idx) => {
          itemsData.push({
            '№': idx + 1,
            'Товар': item.product_name,
            'Количество': item.quantity,
            'Единица': 'шт'
          });
        });
      }
      
      const workbook = XLSX.utils.book_new();
      
      // Лист с общей информацией
      const orderSheet = XLSX.utils.json_to_sheet(orderData);
      orderSheet['!cols'] = [{ wch: 20 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(workbook, orderSheet, `Заявка #${orderId}`);
      
      // Лист с товарами
      if (itemsData.length > 0) {
        const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
        itemsSheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Товары');
      }
      
      const fileName = `order_${orderId}_${this.getDateString()}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);
      
      XLSX.writeFile(workbook, filePath);
      
      return { success: true, fileName, filePath, orderId };
    } catch (error) {
      console.error('Ошибка экспорта заявки:', error);
      return { success: false, error: error.message };
    }
  }
  // Экспорт отчёта кассы
  async exportCashReport(days = 7) {
    try {
      const records = await database.getCashReport(days);
      const totals = await database.getCashTotals(days);

      const rows = [];
      let rowNum = 1;

      records.forEach(r => {
        const date = new Date(r.created_at).toLocaleDateString('ru-RU');
        const usd = parseFloat(r.usd) || 0;
        const somoni = parseFloat(r.somoni) || 0;
        const rate = parseFloat(r.rate) || 0;
        const phone = r.client_phone || '—';

        const comment = r.comment || '';
        if (r.mode === 'usd') {
          rows.push({ '№': rowNum++, 'Дата': date, 'Клиент': r.client_name || '—', 'Телефон': phone, 'Сомони': '', 'Курс $': '', 'Доллар': usd, 'Обем года': comment });
        } else if (r.mode === 'somoni') {
          rows.push({ '№': rowNum++, 'Дата': date, 'Клиент': r.client_name || '—', 'Телефон': phone, 'Сомони': somoni, 'Курс $': rate, 'Доллар': rate > 0 ? Math.round(somoni / rate * 100) / 100 : '', 'Обем года': comment });
        } else if (r.mode === 'both') {
          rows.push({ '№': rowNum++, 'Дата': date, 'Клиент': r.client_name || '—', 'Телефон': phone, 'Сомони': '', 'Курс $': '', 'Доллар': usd, 'Обем года': comment });
          rows.push({ '№': rowNum++, 'Дата': date, 'Клиент': r.client_name || '—', 'Телефон': phone, 'Сомони': somoni, 'Курс $': rate, 'Доллар': rate > 0 ? Math.round(somoni / rate * 100) / 100 : '', 'Обем года': comment });
        }
      });

      // Итоговая строка
      rows.push({ '№': '', 'Дата': '', 'Клиент': 'ИТОГО', 'Телефон': '', 'Сомони': parseFloat(totals.total_somoni), 'Курс $': '', 'Доллар': parseFloat(totals.total_usd), 'Обем года': '' });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Ширина колонок
      worksheet['!cols'] = [
        { wch: 5  }, // №
        { wch: 12 }, // Дата
        { wch: 25 }, // Клиент
        { wch: 16 }, // Телефон
        { wch: 14 }, // Сомони
        { wch: 10 }, // Курс $
        { wch: 12 }, // Доллар
        { wch: 20 }  // Обем года
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчёт кассы');

      const fileName = `cash_report_${this.getDateString()}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);
      XLSX.writeFile(workbook, filePath);

      return { success: true, fileName, filePath };
    } catch (error) {
      console.error('Ошибка экспорта кассы:', error);
      return { success: false, error: error.message };
    }
  }

  // Сводный Excel отчёт по периоду
  async exportCashSummary(days) {
    try {
      const database = require('./database');
      let records, totals;

      if (days) {
        // Получаем записи за указанный период
        const result = await database.pool.query(`
          SELECT client_name, client_phone, mode, usd, somoni, rate, created_at
          FROM cash_records
          WHERE created_at >= NOW() - INTERVAL '${days} days'
          ORDER BY created_at DESC
        `);
        records = result.rows;
        const t = await database.pool.query(`
          SELECT COALESCE(SUM(usd),0) AS total_usd, COALESCE(SUM(somoni),0) AS total_somoni
          FROM cash_records WHERE created_at >= NOW() - INTERVAL '${days} days'
        `);
        totals = t.rows[0];
      } else {
        // Весь период
        const result = await database.pool.query(`
          SELECT client_name, client_phone, mode, usd, somoni, rate, created_at
          FROM cash_records ORDER BY created_at DESC
        `);
        records = result.rows;
        const t = await database.pool.query(`
          SELECT COALESCE(SUM(usd),0) AS total_usd, COALESCE(SUM(somoni),0) AS total_somoni
          FROM cash_records
        `);
        totals = t.rows[0];
      }

      const rows = [];
      let rowNum = 1;

      records.forEach(r => {
        const date = new Date(r.created_at).toLocaleDateString('ru-RU');
        const usd = parseFloat(r.usd) || 0;
        const somoni = parseFloat(r.somoni) || 0;
        const rate = parseFloat(r.rate) || 0;
        const phone = r.client_phone || '—';

        if (r.mode === 'usd') {
          rows.push({ '№': rowNum++, 'Дата': date, 'Клиент': r.client_name || '—', 'Телефон': phone, 'Сомони': '', 'Курс $': '', 'Доллар': usd });
        } else if (r.mode === 'somoni') {
          rows.push({ '№': rowNum++, 'Дата': date, 'Клиент': r.client_name || '—', 'Телефон': phone, 'Сомони': somoni, 'Курс $': rate, 'Доллар': rate > 0 ? Math.round(somoni / rate * 100) / 100 : '' });
        } else if (r.mode === 'both') {
          rows.push({ '№': rowNum++, 'Дата': date, 'Клиент': r.client_name || '—', 'Телефон': phone, 'Сомони': '', 'Курс $': '', 'Доллар': usd });
          rows.push({ '№': rowNum++, 'Дата': date, 'Клиент': r.client_name || '—', 'Телефон': phone, 'Сомони': somoni, 'Курс $': rate, 'Доллар': rate > 0 ? Math.round(somoni / rate * 100) / 100 : '' });
        }
      });

      rows.push({ '№': '', 'Дата': '', 'Клиент': 'ИТОГО', 'Телефон': '', 'Сомони': parseFloat(totals.total_somoni), 'Курс $': '', 'Доллар': parseFloat(totals.total_usd) });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 12 }];

      const workbook = XLSX.utils.book_new();
      const label = days ? days + '_дней' : 'весь_период';
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчёт кассы');

      const fileName = `cash_summary_${label}_${this.getDateString()}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);
      XLSX.writeFile(workbook, filePath);

      return { success: true, fileName, filePath };
    } catch (error) {
      console.error('Ошибка сводного Excel:', error);
      return { success: false, error: error.message };
    }
  }

  getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}-${minutes}`;
  }

  // Очистить старые файлы экспорта (старше 7 дней)
  cleanOldExports() {
    try {
      const files = fs.readdirSync(this.exportDir);
      const now = Date.now();
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000); // 7 дней назад

      files.forEach(file => {
        const filePath = path.join(this.exportDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < weekAgo) {
          fs.unlinkSync(filePath);
          console.log(`Удален старый файл экспорта: ${file}`);
        }
      });
    } catch (error) {
      console.error('Ошибка очистки старых файлов:', error);
    }
  }
}

module.exports = new ExcelExporter();