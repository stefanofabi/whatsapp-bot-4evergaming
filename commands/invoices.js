const { connect } = require('../databases/connection');
const { addTransaction } = require('../utils/whmcs');
const { sendMessage } = require('../utils/messages');
const { formatDate } = require('../utils/dates'); // Incluimos el archivo dates.js

async function fetchPendingInvoices(userPhone, client) {
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
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, ["Unpaid", userPhone.split('@')[0]]);

        if (results.length === 0) {
            await sendMessage(client, userPhone, '🤖 No hay facturas pendientes');
            await db.end();
            return;
        }

        let invoicesMessage = '🤖 Acá están tus facturas pendientes:\n\n';
        results.forEach(({ id, date, duedate, total, paymentmethod }) => {
            invoicesMessage += `Factura: #${id}\nFecha: ${formatDate(date)}\nVencimiento: ${formatDate(duedate)}\nTotal: \$${total}\n\n`;
        });

        await sendMessage(client, userPhone, invoicesMessage);
        console.log(`[200] Message sent to  ${userPhone}`);
    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function fetchInvoiceDetails(invoiceId, userPhone, client) {
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
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [invoiceId, userPhone.split('@')[0]]);

        if (results.length === 0) {
            await sendMessage(client, userPhone, `🤖 No se encontró la factura #${invoiceId}`);
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

        await sendMessage(client, userPhone, invoiceDetailsMessage);
        console.log(`[200] Message sent to  ${userPhone}`);
    } catch (err) {
        console.error('Error fetching invoice details:', err);
    } finally {
        await db.end();
    }
}

async function fetchInvoiceItems(invoiceId, userPhone, client) {
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
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [invoiceId, userPhone.split('@')[0]]);

        if (results.length === 0) {
            await sendMessage(client, userPhone, `🤖 No se encontró la factura #${invoiceId}`);
            await db.end();
            return;
        }

        const { invoiceid, description, amount, duedate } = results[0];
        const invoiceDetailsMessage = `🤖 Los items de tu factura #${invoiceid}:` +
            `*Descripción:* ${description}` +
            `*Monto:* \$${amount}` +
            `*Vencimiento:* ${formatDate(duedate)}\n`;
        
        await sendMessage(client, userPhone, invoiceDetailsMessage);
        console.log(`[200] Message sent to ${userPhone}`);
        
    } catch (err) {
        console.error('Error fetching invoice items:', err);
    } finally {
        await db.end();
    }
}

async function checkDebt(userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            SUM(tblinvoices.total) AS totalDebt, 
            SUM(CASE WHEN tblinvoices.duedate < CURDATE() THEN tblinvoices.total ELSE 0 END) AS overdueDebt
        FROM 
            tblinvoices 
        INNER JOIN 
            tblclients 
        ON 
            tblinvoices.userid = tblclients.id 
        WHERE 
            tblinvoices.status = "Unpaid" AND 
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
        GROUP BY 
            tblclients.id
    `;

    try {
        const [results] = await db.execute(query, [userPhone.split('@')[0]]);

        if (results.length === 0) {
            const noDebtMessage = `🤖 No tenés deudas pendientes. Gracias por estar al día! 😊`;
            await sendMessage(client, userPhone, noDebtMessage);
            return;
        }

        const { totalDebt, overdueDebt } = results[0];
        const totalDebtDiscount = Math.ceil(totalDebt * 0.90); 

        const message = `
            🤖 Te envio el estado de tu cuenta: \n
            Deuda total pendiente: \$${totalDebt}\n
            Deuda vencida: \$${overdueDebt}\n
            *Total a pagar con descuento (10%):* ~\$${totalDebt}~ \$${totalDebtDiscount}\n\n
            Alias para hacer el pago: *4evergaming*\n
            Por favor enviar el comprobante de la transferencia 🙏
        `;

        await sendMessage(client, userPhone, message);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error fetching invoices:', err);
    } finally {
        await db.end();
    }
}

async function markInvoicePaid(invoiceId, transactionId, amount, paymentMethod, userPhone, client) {
    let result = await addTransaction(invoiceId, transactionId, amount, paymentMethod);

    if (result) {
        const message = `🤖 La factura *#${invoiceId}* ha sido marcada como PAGADA ✅🙌`;
        await sendMessage(client, userPhone, message);
    }
}

module.exports = { fetchPendingInvoices, fetchInvoiceDetails, fetchInvoiceItems, checkDebt, markInvoicePaid };