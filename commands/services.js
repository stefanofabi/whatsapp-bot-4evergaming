const { connect } = require('../databases/connection');

// Function to fetch active servers
async function fetchActiveServers(userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblproducts.name AS productName, 
            tblhosting.domain AS domain, 
            tblhosting.amount AS amount, 
            tblhosting.billingcycle AS billingCycle 
        FROM 
            tblhosting 
        INNER JOIN 
            tblclients ON tblhosting.userid = tblclients.id 
        INNER JOIN 
            tblproducts ON tblhosting.packageid = tblproducts.id 
        WHERE 
            tblhosting.domainstatus = "Active" AND
            REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '') = ?
    `;

    try {
        const [results] = await db.execute(query, [userPhone]);

        if (results.length === 0) {
            await client.sendMessage(userPhone + "@c.us", '🤖 No tenes servicios activos');
            await db.end();

            return;
        }

        let serversMessage = '🤖 Tus servicios activos:\n\n';
        results.forEach(({ productName, domain, amount, billingCycle }) => {
            serversMessage += `*Producto:* ${productName}\n*Dominio:* ${domain}\n*Precio:* \$${amount}\n*Facturación:* ${billingCycle}\n\n`;
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
            REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '') = ?
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