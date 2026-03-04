# Исправление ошибки при привязке WhatsApp номера

## Проблема

При выполнении команды `/setwhatsappphone` появляется ошибка:
```
❌ Ошибка при привязке WhatsApp номера
```

## Причина

Колонка `whatsapp_phone` не существует в таблице `warehouses` базы данных.

## Решение

### Вариант 1: Автоматическое исправление (рекомендуется)

Просто перезапустите бота. Теперь при запуске бот автоматически проверит и добавит недостающую колонку.

```bash
# Остановите бота (Ctrl+C)

# Запустите снова
npm start
```

В логах вы должны увидеть:
```
✅ Колонка whatsapp_phone добавлена в таблицу warehouses
✅ Таблицы PostgreSQL инициализированы
```

### Вариант 2: Ручное добавление колонки

Если автоматическое добавление не сработало, запустите скрипт миграции:

```bash
node telegram-order-bot/add-whatsapp-phone-column.js
```

Вы должны увидеть:
```
🔧 Добавление колонки whatsapp_phone в таблицу warehouses...
✅ Колонка whatsapp_phone успешно добавлена!

📋 Структура таблицы warehouses:
  - id: integer
  - name: text
  - whatsapp_group_id: text
  - is_active: integer
  - created_at: timestamp without time zone
  - whatsapp_phone: text

🏬 Текущие склады:
  - Склад №1
    WhatsApp группа: не указана
    WhatsApp номер: не указан
```

### Вариант 3: SQL запрос напрямую

Если оба варианта не работают, выполните SQL запрос напрямую в базе данных:

```sql
ALTER TABLE warehouses ADD COLUMN whatsapp_phone TEXT;
```

## Проверка

После исправления проверьте, что команда работает:

```
/setwhatsappphone Склад №1 | 992900000000
```

Должно появиться:
```
✅ Личный номер WhatsApp привязан к складу!

🏬 Склад: Склад №1
📱 WhatsApp номер: +992900000000

🎯 Теперь все заявки для склада "Склад №1" будут автоматически отправляться на этот номер!
```

## Проверка структуры базы данных

Чтобы убедиться, что колонка добавлена, выполните:

```bash
node telegram-order-bot/add-whatsapp-phone-column.js
```

Если колонка уже существует, вы увидите:
```
✅ Колонка whatsapp_phone уже существует
```

## Дополнительная диагностика

Если ошибка продолжается, проверьте логи бота при выполнении команды. В консоли должна быть более подробная информация об ошибке:

```
Ошибка привязки WhatsApp номера: [детали ошибки]
```

Возможные ошибки:

### 1. "column whatsapp_phone does not exist"
**Решение:** Колонка не добавлена. Используйте Вариант 1 или 2 выше.

### 2. "relation warehouses does not exist"
**Решение:** Таблица складов не создана. Перезапустите бота.

### 3. "permission denied"
**Решение:** Недостаточно прав для изменения структуры БД. Проверьте права пользователя PostgreSQL.

## Что изменилось в коде

### database.js - автоматическая миграция:

```javascript
async init() {
  // ... создание таблиц ...
  
  // Добавляем колонку whatsapp_phone если её нет
  try {
    const checkColumn = await this.pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'warehouses' 
      AND column_name = 'whatsapp_phone'
    `);
    
    if (checkColumn.rows.length === 0) {
      await this.pool.query(`
        ALTER TABLE warehouses 
        ADD COLUMN whatsapp_phone TEXT
      `);
      console.log('✅ Колонка whatsapp_phone добавлена');
    }
  } catch (error) {
    console.log('⚠️ Ошибка при добавлении колонки:', error.message);
  }
}
```

Теперь при каждом запуске бота проверяется наличие колонки и добавляется автоматически, если её нет.

## После исправления

После успешного добавления колонки вы сможете:

1. Привязывать личные номера к складам:
   ```
   /setwhatsappphone Склад №1 | 992900000000
   ```

2. Просматривать настройки:
   ```
   /checkwarehouses
   ```

3. Отвязывать номера:
   ```
   /removewhatsappphone Склад №1
   ```

Все должно работать корректно!
