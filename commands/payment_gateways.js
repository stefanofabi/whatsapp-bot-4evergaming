const { connect } = require('../databases/connection');
const config = require('../config.json');
const { createPaymentPreference }  = require('../utils/mercadopago');

// Returns the total to be paid by bank transfer of all pending invoices. Otherwise, it returns an error.
async function payWithBankTransfer(invoiceId, userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.status, 
            tblinvoices.paymentmethod 
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id 
        WHERE 
            (tblinvoices.id = ? OR ? IS NULL) AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [isNaN(invoiceId) ? null : invoiceId, isNaN(invoiceId) ? null : invoiceId, userPhone]);

        if (results.length === 0) {
            if (isNaN(invoiceId))
            {
                await client.sendMessage(userPhone + "@c.us", '🤖 No hay facturas pendientes por pagar');
            } else {
                await client.sendMessage(userPhone + "@c.us", '🤖 No existe la factura');
            }

            await db.end();
            return;
        }

        let totalSum = 0;
        let invoicesMessage = "";

        if (results.length === 1 && !isNaN(invoiceId)) {
            let { id, date, duedate, total, status } = results[0];

            if (status === 'Unpaid') {
                total = Math.ceil(total);
                totalSum += total; 
                const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

                invoicesMessage += '🤖 Acá está tu factura pendiente:\n\n';
                invoicesMessage += `*Factura: #${id}*\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nTotal: \$${total}\n`;
            } else {
                await client.sendMessage(userPhone + "@c.us", '🤖 No podés pagar esta factura.\n\n Motivo: Estado de la factura '+status);
                await db.end();
                return;
            }
        } else {
            invoicesMessage = '🤖 Acá están tus facturas pendientes:\n\n';
            results.forEach(({ id, date, duedate, total, status }) => {
                if (status !== 'Unpaid') return;

                total = Math.ceil(total);

                totalSum += total; 
                const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

                invoicesMessage += `*Factura: #${id}*\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nMonto: \$${total}\n\n`;
            });     
        }

        const totalSumDiscount = Math.ceil(totalSum * 0.90); 
        invoicesMessage += `\n *Total a pagar (10% de descuento):* ~\$${totalSum}~ \$${totalSumDiscount}\n\n`;

        invoicesMessage += `Realiza tu pago con los siguientes datos:\n` +
                          `*Titular:* Stefano Fabi\n` +
                          `*CUIT:* 20-39881919-6\n` +
                          `*CVU:* 0000003100090739102124\n` +
                          `*Alias:* 4evergaming\n\n` +
                          `Por favor enviar el comprobante de la transferencia 🙏`;

        await client.sendMessage(userPhone + "@c.us", invoicesMessage);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function payWithCard(invoiceId, userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.status, 
            tblinvoices.paymentmethod 
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id 
        WHERE 
            tblinvoices.id = ? AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [invoiceId, userPhone]);

        if (results.length === 0) {
            await client.sendMessage(userPhone + "@c.us", '🤖 No existe la factura');
            await db.end();
            return;
        }

        let { id, date, duedate, total, status } = results[0];

        if (status !== 'Unpaid') {
            await client.sendMessage(userPhone + "@c.us", '🤖 No podés pagar esta factura.\n\n Motivo: Estado de la factura ' + status);
            await db.end();
            return;
        }

        let invoicesMessage = '🤖 Acá está tu factura pendiente:\n\n';
        
        const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
        const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        invoicesMessage += `*Factura: #${id}*\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nTotal: \$${total}\n`;

        try {
            const preferenceUrl = await createPaymentPreference(id, total);
            invoicesMessage += `\n\n Paga ahora tu factura desde este Link: ${preferenceUrl}`;

            await client.sendMessage(userPhone + "@c.us", invoicesMessage);
            console.log(`[200] Message sent to ${userPhone}`);
        } catch (err) {
            console.log('Error creating payment preference: ' + err);
        }

    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function payWithMercadoPago(invoiceId, userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.status, 
            tblinvoices.paymentmethod 
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id 
        WHERE 
            (tblinvoices.id = ? OR ? IS NULL) AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [isNaN(invoiceId) ? null : invoiceId, isNaN(invoiceId) ? null : invoiceId, userPhone]);

        if (results.length === 0) {
            if (isNaN(invoiceId))
            {
                await client.sendMessage(userPhone + "@c.us", '🤖 No hay facturas pendientes por pagar');
            } else {
                await client.sendMessage(userPhone + "@c.us", '🤖 No existe la factura');
            }

            await db.end();
            return;
        }

        let totalSum = 0;
        let invoicesMessage = "";

        if (results.length === 1 && !isNaN(invoiceId)) {
            let { id, date, duedate, total, status } = results[0];

            if (status === 'Unpaid') {
                total = Math.ceil(total);
                totalSum += total; 
                const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

                invoicesMessage += '🤖 Acá está tu factura pendiente:\n\n';
                invoicesMessage += `*Factura: #${id}*\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nTotal: \$${total}\n`;
            } else {
                await client.sendMessage(userPhone + "@c.us", '🤖 No podés pagar esta factura.\n\n Motivo: Estado de la factura '+status);
                await db.end();
                return;
            }
        } else {
            invoicesMessage = '🤖 Acá están tus facturas pendientes:\n\n';
            results.forEach(({ id, date, duedate, total, status }) => {
                if (status !== 'Unpaid') return;

                total = Math.ceil(total);

                totalSum += total; 
                const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

                invoicesMessage += `*Factura: #${id}*\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nMonto: \$${total}\n\n`;
            });     
        }

        const totalSumDiscount = Math.ceil(totalSum * 0.90); 
        invoicesMessage += `\n *Total a pagar (10% de descuento):* ~\$${totalSum}~ \$${totalSumDiscount}\n\n`;

        invoicesMessage += `
            Abri la App de MercadoPago en tu celular y transferí al correo *cobranzas@4evergaming.com.ar* \n
            Por favor enviar el comprobante de la transferencia 🙏
        `;

        await client.sendMessage(userPhone + "@c.us", invoicesMessage);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function payWithUala(invoiceId, userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.status, 
            tblinvoices.paymentmethod 
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id 
        WHERE 
            (tblinvoices.id = ? OR ? IS NULL) AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [isNaN(invoiceId) ? null : invoiceId, isNaN(invoiceId) ? null : invoiceId, userPhone]);

        if (results.length === 0) {
            if (isNaN(invoiceId))
            {
                await client.sendMessage(userPhone + "@c.us", '🤖 No hay facturas pendientes por pagar');
            } else {
                await client.sendMessage(userPhone + "@c.us", '🤖 No existe la factura');
            }

            await db.end();
            return;
        }

        let totalSum = 0;
        let invoicesMessage = "";

        if (results.length === 1 && !isNaN(invoiceId)) {
            let { id, date, duedate, total, status } = results[0];

            if (status === 'Unpaid') {
                total = Math.ceil(total);
                totalSum += total; 
                const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

                invoicesMessage += '🤖 Acá está tu factura pendiente:\n\n';
                invoicesMessage += `*Factura: #${id}*\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nTotal: \$${total}\n`;
            } else {
                await client.sendMessage(userPhone + "@c.us", '🤖 No podés pagar esta factura.\n\n Motivo: Estado de la factura '+status);
                await db.end();
                return;
            }
        } else {
            invoicesMessage = '🤖 Acá están tus facturas pendientes:\n\n';
            results.forEach(({ id, date, duedate, total, status }) => {
                if (status !== 'Unpaid') return;

                total = Math.ceil(total);

                totalSum += total; 
                const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

                invoicesMessage += `*Factura: #${id}*\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nMonto: \$${total}\n\n`;
            });     
        }

        const totalSumDiscount = Math.ceil(totalSum * 0.90); 
        invoicesMessage += `\n *Total a pagar (10% de descuento):* ~\$${totalSum}~ \$${totalSumDiscount}\n\n`;

        invoicesMessage += `
            Abri la App de Uala en tu celular y buscanos con el usuario *4evergaming* \n
            Por favor enviar el comprobante de la transferencia 🙏
        `;

        await client.sendMessage(userPhone + "@c.us", invoicesMessage);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

module.exports = { payWithBankTransfer, payWithCard, payWithMercadoPago, payWithUala };