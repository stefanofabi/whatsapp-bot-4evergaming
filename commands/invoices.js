const mysql = require('mysql2');
const config = require('../config.json');

// Configura la conexión a la base de datos de WHMCS
const db_whmcs = mysql.createConnection({
    host: config.databases.whmcs.host,
    user: config.databases.whmcs.user,
    password: config.databases.whmcs.password,
    database: config.databases.whmcs.database
});

// Conecta a la base de datos de WHMCS
db_whmcs.connect((err) => {
    if (err) {
        console.error('Error connecting to WHMCS database:', err);
        process.exit(1);
    }
    console.log('Connected to WHMCS database');
});

function fetchPendingInvoices(userPhone, client) {
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
            REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', ''), ' ', ''), '-', '') = ?
    `;

    db_whmcs.query(query, ["Unpaid", userPhone], (err, results) => {
        if (err) {
            console.error('Error fetching invoices:', err);
            return;
        }

        if (results.length === 0) {
            client.sendMessage(userPhone + "@c.us", 'No tienes facturas pendientes.');
            return;
        }

        let invoicesMessage = 'Aquí están tus facturas pendientes:\n\n';
        results.forEach(({ id, date, duedate, total, paymentmethod }) => {
            const formattedDate = new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
            const formattedDueDate = new Date(duedate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

            invoicesMessage += `Factura: #${id}\nFecha: ${formattedDate}\nVencimiento: ${formattedDueDate}\nTotal: \$${total}\n\n`;
        });

        client.sendMessage(userPhone + "@c.us", invoicesMessage)
            .then(response => {
                console.log(`[200] Mensaje enviado a ${userPhone}`);
            })
            .catch(error => {
                console.error(`[500] Error al enviar mensaje a ${userPhone}:`, error);
            });
    });
}

module.exports = { fetchPendingInvoices };
