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

// Returns the total to be paid by bank transfer of all pending invoices. Otherwise, it returns an error.
async function payWithBankTransfer(invoiceId, userPhone, client) {
    const db = await connect('whmcs');

    // Modifica la consulta según si se proporciona invoiceId
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
            REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '') = ?
    `;

    try {
        const [results] = await db.execute(query, [invoiceId, invoiceId, userPhone]);

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
            results.forEach(({ id, date, duedate, amount, status }) => {
                if (status !== 'Unpaid') return;

                amount = Math.ceil(amount);

                totalSum += amount; 
                const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

                invoicesMessage += `*Factura: #${id}*\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nMonto: \$${amount}\n\n`;
            });     
        }

        const totalSumDiscount = Math.ceil(totalSum * 0.90); 
        invoicesMessage += `\n *Total a pagar (10% de descuento):* ~~\$${totalSum}~~ \$${totalSumDiscount}\n\n`;

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

module.exports = { fetchPendingInvoices, fetchInvoiceDetails, payWithBankTransfer};