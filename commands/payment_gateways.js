const { connect } = require('../databases/connection');
const { createPaymentPreference } = require('../utils/mercadopago');
const { convertCurrency } = require('../utils/currencies');
const { sendMessage } = require('../utils/messages');
const { formatDate } = require('../utils/dates');

async function payWithBankTransfer(invoiceId, chatId, userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.status, 
            tblcurrencies.code as currency 
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id 
        INNER JOIN 
            tblcurrencies 
        ON 
            tblclients.currency = tblcurrencies.id 
        WHERE 
            (tblinvoices.id = ? OR ? IS NULL) AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [isNaN(invoiceId) ? null : invoiceId, isNaN(invoiceId) ? null : invoiceId, userPhone.split('@')[0]]);

        if (results.length === 0 && !isNaN(invoiceId)) {
            await sendMessage(client, chatId, '🤖 No existe la factura #'+ invoiceId);

            await db.end();
            return;
        }

        let totalSum = 0;
        let invoicesMessage = "";

        if (results.length === 1 && !isNaN(invoiceId)) {
            let { id, date, duedate, total, status, currency } = results[0];

            if (status === 'Unpaid') {
                total = await convertCurrency(currency, total, "ARS");
                total = Math.ceil(total);

                totalSum += total;

                invoicesMessage += '🤖 Acá está tu factura pendiente:\n\n';
                invoicesMessage += `*Factura: #${id}*\nFecha: ${formatDate(date)}\nVencimiento: ${formatDate(duedate)}\nTotal: \$${total} ARS\n`;
            } else {
                await sendMessage(client, chatId, '🤖 No podés pagar esta factura.\n\n Motivo: Estado de la factura ' + status);

                await db.end();
                return;
            }
        } else {
            invoicesMessage = '🤖 Acá están tus facturas pendientes:\n\n';
            for (const { id, date, duedate, total, status, currency } of results) {
                if (status !== 'Unpaid') continue;

                let convertedTotal = await convertCurrency(currency, total, "ARS");
                convertedTotal = Math.ceil(convertedTotal);

                totalSum += convertedTotal;

                invoicesMessage += `*Factura: #${id}*\nFecha: ${formatDate(date)}\nVencimiento: ${formatDate(duedate)}\nMonto: \$${convertedTotal} ARS\n\n`;
            }
        }

        if (totalSum <= 0) {
            await sendMessage(client, chatId, '🤖 No existen facturas pendiente de pago. Muchas gracias por estar al día!');

            await db.end();
            return;
        }

        const totalSumDiscount = Math.ceil(totalSum * 0.95);
        invoicesMessage += `\n *Total a pagar (5% de descuento):* ~\$${totalSum}~ \$${totalSumDiscount} ARS\n\n`;

        invoicesMessage += `Realiza tu pago con los siguientes datos:\n` +
                          `*Titular:* Stefano Fabi\n` +
                          `*CUIT:* 20-39881919-6\n` +
                          `*CVU:* 0000003100090739102124\n` +
                          `*Alias:* 4evergaming\n\n` +
                          `Por favor enviar el comprobante de la transferencia 🙏`;

        await sendMessage(client, chatId, invoicesMessage);
        console.log(`[200] Message sent to ${chatId}`);
    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function payWithCard(invoiceId, chatId, userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.status,
            tblcurrencies.code as currency
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id
        INNER JOIN 
            tblcurrencies 
        ON 
            tblclients.currency = tblcurrencies.id 
        WHERE 
            tblinvoices.id = ? AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [invoiceId, userPhone.split('@')[0]]);

        if (results.length === 0) {
            await sendMessage(client, chatId, '🤖 No existe la factura');
            await db.end();
            return;
        }

        let { id, date, duedate, total, status, currency } = results[0];

        if (status !== 'Unpaid') {
            await sendMessage(client, chatId, '🤖 No podés pagar esta factura.\n\n Motivo: Estado de la factura ' + status);
            await db.end();
            return;
        }

        total = await convertCurrency(currency, total, "ARS");

        let invoicesMessage = '🤖 Acá está tu factura pendiente:\n\n';

        invoicesMessage += `*Factura: #${id}*\nFecha: ${formatDate(date)}\nVencimiento: ${formatDate(duedate)}\nTotal: \$${total} ARS\n`;

        try {
            const preferenceUrl = await createPaymentPreference(id, total);
            invoicesMessage += `\n\nPaga ahora tu factura desde este Link: ${preferenceUrl}`;

            await sendMessage(client, chatId, invoicesMessage);
            console.log(`[200] Message sent to ${chatId}`);
        } catch (err) {
            console.log('Error creating payment preference: ' + err);
        }

    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function payWithMercadoPago(invoiceId, chatId, userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.status,
            tblcurrencies.code as currency
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id
        INNER JOIN 
            tblcurrencies 
        ON 
            tblclients.currency = tblcurrencies.id 
        WHERE 
            (tblinvoices.id = ? OR ? IS NULL) AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [isNaN(invoiceId) ? null : invoiceId, isNaN(invoiceId) ? null : invoiceId, userPhone.split('@')[0]]);

        if (results.length === 0) {
            if (isNaN(invoiceId)) {
                await sendMessage(client, chatId, '🤖 No hay facturas pendientes por pagar');
            } else {
                await sendMessage(client, chatId, '🤖 No existe la factura');
            }

            await db.end();
            return;
        }

      
      	let totalSum = 0;
        let invoicesMessage = "";

        if (results.length === 1 && !isNaN(invoiceId)) {
            let { id, date, duedate, total, status, currency } = results[0];

            if (status === 'Unpaid') {
                total = await convertCurrency(currency, total, "ARS");
                total = Math.ceil(total);

                totalSum += total;

                invoicesMessage += '🤖 Acá está tu factura pendiente:\n\n';
                invoicesMessage += `*Factura: #${id}*\nFecha: ${formatDate(date)}\nVencimiento: ${formatDate(duedate)}\nTotal: \$${total} ARS\n`;
            } else {
                await sendMessage(client, chatId, '🤖 No podés pagar esta factura.\n\n Motivo: Estado de la factura ' + status);
                await db.end();
                return;
            }
        } else {
            invoicesMessage = '🤖 Acá están tus facturas pendientes:\n\n';
            for (const { id, date, duedate, total, status, currency } of results) {
                if (status !== 'Unpaid') continue;

                let convertedTotal = await convertCurrency(currency, total, "ARS");
                convertedTotal = Math.ceil(convertedTotal);

                totalSum += convertedTotal;

                invoicesMessage += `*Factura: #${id}*\nFecha: ${formatDate(date)}\nVencimiento: ${formatDate(duedate)}\nMonto: \$${convertedTotal} ARS\n\n`;
            }
        }

        const totalSumDiscount = Math.ceil(totalSum * 0.95);
        invoicesMessage += `\n *Total a pagar (5% de descuento):* ~\$${totalSum}~ \$${totalSumDiscount} ARS\n\n`;

        invoicesMessage += `Abri la App de MercadoPago en tu celular y transferí al correo *cobranzas@4evergaming.com.ar*\n` +
                          `Por favor enviar el comprobante de la transferencia 🙏`;

        await sendMessage(client, chatId, invoicesMessage);
        console.log(`[200] Message sent to ${chatId}`);

    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function payWithUala(invoiceId, chatId, userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.status,
            tblcurrencies.code as currency
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id
        INNER JOIN 
            tblcurrencies 
        ON 
            tblclients.currency = tblcurrencies.id 
        WHERE 
            (tblinvoices.id = ? OR ? IS NULL) AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [isNaN(invoiceId) ? null : invoiceId, isNaN(invoiceId) ? null : invoiceId, userPhone.split('@')[0]]);

        if (results.length === 0) {
            if (isNaN(invoiceId)) {
                await sendMessage(client, chatId, '🤖 No hay facturas pendientes por pagar');
            } else {
                await sendMessage(client, chatId, '🤖 No existe la factura');
            }

            await db.end();
            return;
        }
      
      
      	let totalSum = 0;
        let invoicesMessage = "";

        if (results.length === 1 && !isNaN(invoiceId)) {
            let { id, date, duedate, total, status, currency } = results[0];

            if (status === 'Unpaid') {
                total = await convertCurrency(currency, total, "ARS");
                total = Math.ceil(total);

                totalSum += total;

                invoicesMessage += '🤖 Acá está tu factura pendiente:\n\n';
                invoicesMessage += `*Factura: #${id}*\nFecha: ${formatDate(date)}\nVencimiento: ${formatDate(duedate)}\nTotal: \$${total} ARS\n`;
            } else {
                await sendMessage(client, chatId, '🤖 No podés pagar esta factura.\n\n Motivo: Estado de la factura ' + status);
                await db.end();
                return;
            }
        } else {
            invoicesMessage = '🤖 Acá están tus facturas pendientes:\n\n';
            for (const { id, date, duedate, total, status, currency } of results) {
                if (status !== 'Unpaid') continue;

                let convertedTotal = await convertCurrency(currency, total, "ARS");
                convertedTotal = Math.ceil(convertedTotal);

                totalSum += convertedTotal;

                invoicesMessage += `*Factura: #${id}*\nFecha: ${formatDate(date)}\nVencimiento: ${formatDate(duedate)}\nMonto: \$${convertedTotal} ARS\n\n`;
            }
        }

        const totalSumDiscount = Math.ceil(totalSum * 0.95);
        invoicesMessage += `\n *Total a pagar (5% de descuento):* ~\$${totalSum}~ \$${totalSumDiscount} ARS\n\n`;

        invoicesMessage += `Abri la App de Uala en tu celular y buscanos con el usuario *4evergaming*\n` +
                          `Por favor enviar el comprobante de la transferencia 🙏`;

        await sendMessage(client, chatId, invoicesMessage);
        console.log(`[200] Message sent to ${chatId}`);
      
    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

module.exports = {
    payWithBankTransfer,
    payWithCard,
    payWithMercadoPago,
    payWithUala
};
