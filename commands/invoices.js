const { connect } = require('../databases/connection');
const { addTransaction } = require('../utils/whmcs');

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
        const [results] = await db.execute(query, ["Unpaid", userPhone]);

        if (results.length === 0) {
            await client.sendMessage(userPhone + "@c.us", '🤖 No hay facturas pendientes');
            await db.end();

            return;
        }

        let invoicesMessage = '🤖 Acá están tus facturas pendientes:\n\n';
        results.forEach(({ id, date, duedate, total, paymentmethod }) => {
            const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
            const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

            invoicesMessage += `Factura: #${id}\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nTotal: \$${total}\n\n`;
        });

        await client.sendMessage(userPhone + "@c.us", invoicesMessage);
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
        const [results] = await db.execute(query, [invoiceId, userPhone]);

        if (results.length === 0) {
            await client.sendMessage(userPhone + "@c.us", `🤖 No se encontró la factura #${invoiceId}`);
            await db.end();
            
            return;
        }

        const { id, date, duedate, total, status, paymentmethod, firstname, lastname } = results[0];
        const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
        const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

        const invoiceDetailsMessage = `🤖 Los datos de tu factura #${id}:\n
            *Cliente:* ${firstname} ${lastname}\n
            *Fecha:* ${formattedDate}\n
            *Vencimiento:* ${formattedDueDate}\n
            *Estado:* ${status}\n
            *Total:* \$${total}\n
            *Método de pago:* ${paymentmethod}
        `;

        await client.sendMessage(userPhone + "@c.us", invoiceDetailsMessage);
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
        const [results] = await db.execute(query, [invoiceId, userPhone]);

        if (results.length === 0) {
            await client.sendMessage(userPhone + "@c.us", `🤖 No se encontró la factura #${invoiceId}`);
            await db.end();
            
            return;
        }

        const { invoiceid, description, amount, duedate } = results[0];
        const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const invoiceDetailsMessage = `🤖 Los items de tu factura #${invoiceid}:\n
            *Descripción:* ${description}\n
            *Monto:* \$${amount}\n
            *Vencimiento:* ${formattedDueDate}
        `;
        
        await client.sendMessage(userPhone + "@c.us", invoiceDetailsMessage);
        console.log(`[200] Message sent to  ${userPhone}`);
        
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
        const [results] = await db.execute(query, [userPhone]);

        if (results.length === 0) {
            const noDebtMessage = `🤖 No tenés deudas pendientes. Gracias por estar al día! 😊`;
            await client.sendMessage(userPhone + "@c.us", noDebtMessage);
            return;
        }

        const { totalDebt, overdueDebt } = results[0];
        const totalDebtDiscount = Math.ceil(totalDebt * 0.90); // 10% discount on total

        const message = `
            🤖 Te envio el estado de tu cuenta: \n
            Deuda total pendiente: \$${totalDebt}\n
            Deuda vencida: \$${overdueDebt}\n
            *Total a pagar con descuento (10%):* ~\$${totalDebt}~ \$${totalDebtDiscount}\n\n
            Alias para hacer el pago: *4evergaming*\n
            Por favor enviar el comprobante de la transferencia 🙏
        `;

        await client.sendMessage(userPhone + "@c.us", message);
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
        await client.sendMessage(userPhone + "@c.us", message);
    }
}

module.exports = { fetchPendingInvoices, fetchInvoiceDetails, fetchInvoiceItems, checkDebt, markInvoicePaid };
