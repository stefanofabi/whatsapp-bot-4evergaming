const { connect } = require('../databases/connection');

// Function to fetch active servers
async function fetchActiveServers(userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblproducts.name AS productName, 
            tblhosting.domain AS domain, 
            tblhosting.amount AS amount, 
            tblhosting.nextduedate 
        FROM 
            tblhosting 
        INNER JOIN 
            tblclients ON tblhosting.userid = tblclients.id 
        INNER JOIN 
            tblproducts ON tblhosting.packageid = tblproducts.id 
        WHERE 
            tblhosting.domainstatus = "Active" AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [userPhone]);

        if (results.length === 0) {
            await client.sendMessage(userPhone + "@c.us", '🤖 No tenes servicios activos');
            await db.end();
            return;
        }

        let serversMessage = '🤖 Tus servicios activos:\n\n';

        // Función para formatear la fecha en formato "18 Jul 2024"
        function formatDate(dateString) {
            const date = new Date(dateString);
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('es-ES', options);  // Usamos 'es-ES' para obtener el mes en español
        }

        results.forEach(({ productName, domain, amount, nextduedate }) => {
            serversMessage += `*Producto:* ${productName}\n*Dominio:* ${domain}\n*Precio:* \$${amount}\n*Vencimiento:* ${formatDate(nextduedate)}\n\n`;
        });

        await client.sendMessage(userPhone + "@c.us", serversMessage);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error fetching active servers:', err);
    } finally {
        await db.end();
    }
}

// Function to fetch upcoming due dates
async function fetchUpcomingDueDates(days, userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblproducts.name AS productName, 
            tblhosting.domain AS domain, 
            tblhosting.amount AS amount, 
            tblhosting.billingcycle AS billingCycle, 
            tblhosting.nextduedate
        FROM 
            tblhosting 
        INNER JOIN 
            tblclients ON tblhosting.userid = tblclients.id 
        INNER JOIN 
            tblproducts ON tblhosting.packageid = tblproducts.id 
        WHERE 
            tblhosting.domainstatus = "Active" AND
            tblhosting.nextduedate <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [days, userPhone]);

        if (results.length === 0) {
            await client.sendMessage(userPhone + "@c.us", '🤖 No tenes vencimientos en los próximos ' + days + " días");
            await db.end();
            
            return;
        }

        let serversMessage = '🤖 Los servicios próximos a vencer son:\n\n';
        results.forEach(({ productName, domain, amount, billingCycle, nextduedate }) => {
            serversMessage += `*Producto:* ${productName}\n*Dominio:* ${domain}\n*Precio:* \$${amount}\n*Facturación:* ${billingCycle}\n*Fecha de Vencimiento:* ${formatDate(nextduedate)}\n\n`;
        });

        await client.sendMessage(userPhone + "@c.us", serversMessage);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error fetching upcoming due dates:', err);
    } finally {
        await db.end();
    }
}

function formatDate(date) {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('es-ES', options).format(new Date(date));
}

module.exports = { fetchActiveServers, fetchUpcomingDueDates };