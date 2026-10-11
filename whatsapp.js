/**
 * WhatsApp отправка через Whapi.cloud
 * Документация: https://whapi.cloud/docs
 *
 * POST https://gate.whapi.cloud/messages/text
 * Headers: { Authorization: "Bearer <token>" }
 * Body: { to: "<chatId>", body: "<text>" }
 *
 * chatId для личного номера: "992XXXXXXXXX" (без +, без @)
 * chatId для группы:        "120363XXXXXXXXXX@g.us"
 */

const axios = require('axios');

const WHAPI_URL = process.env.WHAPI_URL || 'https://gate.whapi.cloud';
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

// ── Отправка личному номеру ───────────────────────────────────────────────────
async function sendMessage(message, recipient = null, _unused1 = null, _unused2 = null) {
  const token = WHAPI_TOKEN;
  const phone = recipient || process.env.WHATSAPP_RECIPIENT;

  if (!token) {
    console.log('⚠️ WHAPI_TOKEN не задан');
    return false;
  }
  if (!phone) {
    console.log('⚠️ Номер получателя WhatsApp не указан');
    return false;
  }

  // Убираем + и пробелы, оставляем только цифры
  const chatId = String(phone).replace(/[^\d]/g, '');

  try {
    console.log(`📤 Отправка в WhatsApp на номер ${chatId} через Whapi.cloud...`);

    const response = await axios.post(
      `${WHAPI_URL}/messages/text`,
      { to: chatId, body: message },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data && response.data.sent) {
      console.log('✅ Сообщение отправлено в WhatsApp!', response.data.id || '');
      return true;
    } else {
      console.log('⚠️ Неожиданный ответ от Whapi:', JSON.stringify(response.data));
      return false;
    }

  } catch (error) {
    console.error('❌ Ошибка отправки в WhatsApp:', error.response?.data || error.message);
    return false;
  }
}

// ── Отправка в группу ─────────────────────────────────────────────────────────
async function sendToGroup(message, groupId, _unused1 = null, _unused2 = null) {
  const token = WHAPI_TOKEN;

  if (!token) {
    console.log('⚠️ WHAPI_TOKEN не задан');
    return false;
  }
  if (!groupId) {
    console.log('⚠️ ID группы WhatsApp не указан');
    return false;
  }

  // groupId уже в формате 120363XXXXXXXXXX@g.us
  const chatId = groupId;

  try {
    console.log(`📤 Отправка в WhatsApp группу ${chatId} через Whapi.cloud...`);

    const response = await axios.post(
      `${WHAPI_URL}/messages/text`,
      { to: chatId, body: message },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data && response.data.sent) {
      console.log('✅ Сообщение отправлено в WhatsApp группу!', response.data.id || '');
      return true;
    } else {
      console.log('⚠️ Неожиданный ответ от Whapi:', JSON.stringify(response.data));
      return false;
    }

  } catch (error) {
    console.error('❌ Ошибка отправки в WhatsApp группу:', error.response?.data || error.message);
    return false;
  }
}

// ── Отправка файла ────────────────────────────────────────────────────────────
async function sendFile(filePath, fileName, caption, recipient, _unused1 = null, _unused2 = null) {
  const token = WHAPI_TOKEN;
  const phone = recipient || process.env.WHATSAPP_RECIPIENT;

  if (!token || !phone) {
    console.log('⚠️ Whapi не настроен для отправки файла');
    return false;
  }

  const chatId = String(phone).replace(/[^\d@.]/g, '');

  try {
    const fs = require('fs');
    const FormData = require('form-data');

    const form = new FormData();
    form.append('to', chatId);
    form.append('media', fs.createReadStream(filePath), { filename: fileName });
    if (caption) form.append('caption', caption);

    console.log(`📎 Отправка файла ${fileName} в WhatsApp через Whapi.cloud...`);

    const response = await axios.post(
      `${WHAPI_URL}/messages/document`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form.getHeaders()
        },
        timeout: 30000
      }
    );

    if (response.data && response.data.sent) {
      console.log('✅ Файл отправлен в WhatsApp!');
      return true;
    } else {
      console.log('⚠️ Неожиданный ответ:', JSON.stringify(response.data));
      return false;
    }

  } catch (error) {
    console.error('❌ Ошибка отправки файла в WhatsApp:', error.response?.data || error.message);
    return false;
  }
}

module.exports = { sendMessage, sendToGroup, sendFile };
