// Отправка через шаблон WhatsApp
const axios = require('axios');

async function sendOrderTemplate(orderData) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const recipient = process.env.WHATSAPP_RECIPIENT;

  try {
    // Формируем текст заявки
    let orderText = `НОВАЯ ЗАЯВКА\n\n`;
    orderText += `Клиент: ${orderData.name}\n`;
    orderText += `Телефон: ${orderData.phone}\n`;
    orderText += `Склад: ${orderData.warehouse}\n\n`;
    orderText += `Товары:\n`;
    orderData.items.forEach((item, i) => {
      orderText += `${i + 1}) ${item.product} - ${item.quantity}\n`;
    });
    orderText += `\nТранспорт: ${orderData.transport}\n`;
    if (orderData.comment) {
      orderText += `Комментарий: ${orderData.comment}\n`;
    }

    // Используем hello_world шаблон (доступен по умолчанию)
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Шаблон отправлен в WhatsApp:', response.data);
    
    // После отправки шаблона, отправляем детали заявки
    setTimeout(async () => {
      try {
        await axios.post(
          `https://graph.facebook.com/v22.0/${phoneId}/messages`,
          {
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'text',
            text: { body: orderText }
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('✅ Детали заявки отправлены');
      } catch (error) {
        console.error('❌ Ошибка отправки деталей:', error.response?.data);
      }
    }, 2000);

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Ошибка отправки шаблона:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { sendOrderTemplate };
