const { connect } = require('../databases/connection');

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
            REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '') = ?
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
            REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '') = ?
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
            REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '') = ?
        GROUP BY 
            tblclients.id
    `;

    try {
        const [results] = await db.execute(query, [userPhone]);

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

module.exports = { fetchPendingInvoices, fetchInvoiceDetails, checkDebt };