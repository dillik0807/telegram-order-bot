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

  // Экспорт последних заявок
  async exportRecentOrders(limit = 50) {
    try {
      const orders = await database.getRecentOrdersWithClients(limit);
      
      const data = orders.map((order, index) => ({
        '№': index + 1,
        'ID заявки': order.id,
        'Имя клиента': order.client_name || 'Без имени',
        'Телефон': order.phone || 'Не указан',
        'Telegram ID': order.telegram_id,
        'Склад': order.warehouse || 'Не указан',
        'Номер транспорта': order.transport_number || 'Не указан',
        'Комментарий': order.comment || 'Без комментария',
        'Статус': order.status,
        'Дата создания': new Date(order.created_at).toLocaleString('ru-RU')
      }));

      // Получаем товары для каждой заявки
      for (let i = 0; i < data.length; i++) {
        try {
          const orderWithItems = await database.getOrderWithItems(orders[i].id);
          if (orderWithItems.items && orderWithItems.items.length > 0) {
            const items = orderWithItems.items.map(item => 
              `${item.product_name} (${item.quantity})`
            ).join('; ');
            data[i]['Товары'] = items;
          } else {
            data[i]['Товары'] = 'Не указаны';
          }
        } catch (error) {
          data[i]['Товары'] = 'Ошибка загрузки';
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Последние заявки');

      const fileName = `recent_orders_${this.getDateString()}.xlsx`;
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

      // 4. Последние заявки
      const orders = await database.getRecentOrdersWithClients(100);
      const orderData = orders.map((order, index) => ({
        '№': index + 1,
        'ID заявки': order.id,
        'Имя клиента': order.client_name || 'Без имени',
        'Телефон': order.phone || 'Не указан',
        'Telegram ID': order.telegram_id,
        'Склад': order.warehouse || 'Не указан',
        'Номер транспорта': order.transport_number || 'Не указан',
        'Комментарий': order.comment || 'Без комментария',
        'Статус': order.status,
        'Дата создания': new Date(order.created_at).toLocaleString('ru-RU')
      }));
      const orderSheet = XLSX.utils.json_to_sheet(orderData);
      XLSX.utils.book_append_sheet(workbook, orderSheet, 'Заявки');

      const fileName = `full_report_${this.getDateString()}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);
      
      XLSX.writeFile(workbook, filePath);
      
      return { success: true, fileName, filePath };
    } catch (error) {
      console.error('Ошибка создания полного отчета:', error);
      return { success: false, error: error.message };
    }
  }

  // Получить строку с датой для имени файла
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