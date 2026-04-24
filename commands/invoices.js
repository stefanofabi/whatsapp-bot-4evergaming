const { connect } = require('../databases/connection');
const { addTransaction } = require('../utils/whmcs');
const { sendMessage } = require('../utils/messages');
const { formatDate } = require('../utils/dates'); // Incluimos el archivo dates.js

async function fetchPendingInvoices(chatId, clientWhmcs, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.paymentmethod 
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id 
        WHERE 
            tblinvoices.status = ? AND
            tblclients.id = ?
    `;

    try {
        const [results] = await db.execute(query, ["Unpaid", clientWhmcs]);

        if (results.length === 0) {
            await sendMessage(client, chatId, '🤖 No hay facturas pendientes');
            await db.end();
            return;
        }

        let invoicesMessage = '🤖 Acá están tus facturas pendientes:\n\n';
        results.forEach(({ id, date, duedate, total, paymentmethod }) => {
            invoicesMessage += `Factura: #${id}\nFecha: ${formatDate(date)}\nVencimiento: ${formatDate(duedate)}\nTotal: \$${total}\n\n`;
        });

        await sendMessage(client, chatId, invoicesMessage);
        console.log(`[200] Message sent to  ${chatId}`);
    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function fetchInvoiceDetails(invoiceId, chatId, clientWhmcs, client) {
    const db = await connect('whmcs');
    
    const query = `
        SELECT 
            tblinvoices.id, 
            tblinvoices.date, 
            tblinvoices.duedate, 
            tblinvoices.total, 
            tblinvoices.status,
            tblinvoices.paymentmethod, 
            tblclients.firstname, 
            tblclients.lastname 
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id 
        WHERE 
            tblinvoices.id = ? AND
            tblclients.id = ?
    `;

    try {
        const [results] = await db.execute(query, [invoiceId, clientWhmcs]);

        if (results.length === 0) {
            await sendMessage(client, chatId, `🤖 No se encontró la factura #${invoiceId}`);
            await db.end();
            return;
        }

        const { id, date, duedate, total, status, paymentmethod, firstname, lastname } = results[0];
        const invoiceDetailsMessage = `🤖 Los datos de tu factura #${id}:\n
            *Cliente:* ${firstname} ${lastname}\n
            *Fecha:* ${formatDate(date)}\n
            *Vencimiento:* ${formatDate(duedate)}\n
            *Estado:* ${status}\n
            *Total:* \$${total}\n
            *Método de pago:* ${paymentmethod}
        `;

        await sendMessage(client, chatId, invoiceDetailsMessage);
        console.log(`[200] Message sent to  ${chatId}`);
    } catch (err) {
        console.error('Error fetching invoice details:', err);
    } finally {
        await db.end();
    }
}

async function fetchInvoiceItems(invoiceId, chatId, clientWhmcs, client) {
    const db = await connect('whmcs');
    
    const query = `
        SELECT 
            tblinvoiceitems.invoiceid,
            tblinvoiceitems.description,
            tblinvoiceitems.amount,
            tblinvoiceitems.duedate
        FROM 
            tblinvoiceitems 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoiceitems.userid = tblclients.id 
        WHERE 
            tblinvoiceitems.invoiceid = ? AND
            tblclients.id = ?
    `;

    try {
        const [results] = await db.execute(query, [invoiceId, clientWhmcs]);

        if (results.length === 0) {
            await sendMessage(client, chatId, `🤖 No se encontró la factura #${invoiceId}`);
            await db.end();
            return;
        }

        let invoiceDetailsMessage = `🤖 Los items de tu factura #${invoiceId}:\n`;

        results.forEach(item => {
            const { description, amount, duedate } = item;
            invoiceDetailsMessage += `\n*Descripción:* ${description}\n` +
                `*Monto:* \$${amount}\n` +
                `*Vencimiento:* ${formatDate(duedate)}\n`;
        });

        await sendMessage(client, chatId, invoiceDetailsMessage);
        console.log(`[200] Message sent to ${chatId}`);

    } catch (err) {
        console.error('Error fetching invoice items:', err);
    } finally {
        await db.end();
    }
}

async function checkDebt(chatId, clientWhmcs, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            SUM(IFNULL(tblinvoices.total, 0) - IFNULL(pagos.total_pagado, 0)) AS totalDebt,
            SUM(
                CASE 
                    WHEN tblinvoices.duedate < CURDATE() THEN IFNULL(tblinvoices.total, 0) - IFNULL(pagos.total_pagado, 0) 
                    ELSE 0 
                END
            ) AS overdueDebt
        FROM 
            tblinvoices
        INNER JOIN 
            tblclients ON tblinvoices.userid = tblclients.id
        LEFT JOIN (
            SELECT 
                invoiceid, 
                SUM(amountin) AS total_pagado
            FROM 
                tblaccounts
            GROUP BY 
                invoiceid
        ) AS pagos ON pagos.invoiceid = tblinvoices.id
        WHERE 
            tblinvoices.status = "Unpaid" AND 
            tblclients.id = ?
        GROUP BY 
            tblclients.id
    `;

    try {
        const [results] = await db.execute(query, [clientWhmcs]);

        if (results.length === 0 || results[0].totalDebt <= 0) {
            const noDebtMessage = `🤖 No tenés deudas pendientes. Gracias por estar al día! 😊`;
            await sendMessage(client, chatId, noDebtMessage);
            return;
        }

        const { totalDebt, overdueDebt } = results[0];
        const totalDebtDiscount = Math.ceil(totalDebt * 0.95); 

        const message = `🤖 Te envio el estado de tu cuenta: \n` +
            `Deuda total pendiente: \$${totalDebt}\n` +
            `Deuda vencida: \$${overdueDebt}\n` +
            `*Total a pagar con descuento (5%):* ~\$${totalDebt}~ \$${totalDebtDiscount}\n\n` +
            `Alias para hacer el pago: *4evergaming*\n` +
            `Por favor enviar el comprobante de la transferencia 🙏`;

        await sendMessage(client, chatId, message);
        console.log(`[200] Message sent to ${chatId}`);
    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function markInvoicePaid(invoiceId, transactionId, amount, paymentMethod, chatId, client) {
    let result = await addTransaction(invoiceId, transactionId, amount, paymentMethod);

    if (result) {
        const message = `🤖 La factura *#${invoiceId}* ha sido marcada como PAGADA ✅🙌`;
        await sendMessage(client, chatId, message);
    }
}

module.exports = { fetchPendingInvoices, fetchInvoiceDetails, fetchInvoiceItems, checkDebt, markInvoicePaid };