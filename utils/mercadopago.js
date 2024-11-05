const { MercadoPagoConfig, Preference } = require('mercadopago');
const config = require('../config.json');

async function createPaymentPreference(invoiceId, total) {
    const mp = new MercadoPagoConfig({
        accessToken: config.payment_gateways.mercadopago.access_token,
        options: { timeout: 5000, idempotencyKey: 'abc' }
    });
    const preference = new Preference(mp);

    const body = {
        items: [
            {
                title: 'Factura 4evergaming #' + invoiceId,
                unit_price: Math.ceil(total),
                quantity: 1,
            }
        ],
        back_urls: {
            success: config.payment_gateways.mercadopago.back_urls.success,
        },
        auto_return: 'approved',
        notification_url: config.payment_gateways.mercadopago.notification_url,
        external_reference: invoiceId
    };

    try {
        const response = await preference.create({ body });
        return response.init_point;
    } catch (err) {
        console.log('Error creating Mercadopago preference: ' + err);
        throw err;
    }
}

module.exports = { createPaymentPreference };
