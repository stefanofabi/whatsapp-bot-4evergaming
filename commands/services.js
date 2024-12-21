const { connect } = require('../databases/connection');
const { sendMessage } = require('../utils/messages');
const { formatDate } = require('../utils/dates');

// Function to fetch active servers
async function fetchActiveServers(userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblproducts.name AS productName, 
            tblproducts.type,
            tblhosting.domain AS domain, 
            tblhosting.amount AS amount, 
            tblhosting.nextduedate,
            tblcurrencies.code
        FROM 
            tblhosting 
        INNER JOIN 
            tblclients ON tblhosting.userid = tblclients.id 
        INNER JOIN 
            tblproducts ON tblhosting.packageid = tblproducts.id 
        INNER JOIN
            tblcurrencies ON tblclients.currency = tblcurrencies.id
        WHERE 
            tblhosting.domainstatus = "Active" AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [userPhone.split('@')[0]]);

        if (results.length === 0) {
            await sendMessage(client, userPhone, '🤖 No tenes servicios activos');
            await db.end();
            return;
        }

        let serversMessage = '🤖 Tus servicios activos:\n\n';

        results.forEach(({ productName, type, domain, amount, nextduedate, code }) => {
            const domainOrIp = type === 'hostingaccount' ? 'Dominio' : (productName.includes('Dominio') ? 'Dominio' : 'IP');
        
            serversMessage += `*Producto:* ${productName}\n*${domainOrIp}:* ${domain}\n*Precio:*  \$${amount} ${code}\n*Vencimiento:* ${formatDate(nextduedate)}\n\n`;
        });

        await sendMessage(client, userPhone, serversMessage);
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
            tblproducts.type,
            tblhosting.domain AS domain, 
            tblhosting.amount AS amount, 
            tblhosting.billingcycle AS billingCycle, 
            tblhosting.nextduedate,
            tblcurrencies.code
        FROM 
            tblhosting 
        INNER JOIN 
            tblclients ON tblhosting.userid = tblclients.id 
        INNER JOIN 
            tblproducts ON tblhosting.packageid = tblproducts.id 
        INNER JOIN
            tblcurrencies ON tblclients.currency = tblcurrencies.id
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
        const [results] = await db.execute(query, [days, userPhone.split('@')[0]]);

        if (results.length === 0) {
            await sendMessage(client, userPhone, '🤖 No tenes vencimientos en los próximos ' + days + " días");
            await db.end();
            
            return;
        }

        let serversMessage = '🤖 Los servicios próximos a vencer son:\n\n';
        results.forEach(({ productName, type, domain, amount, billingCycle, nextduedate }) => {
            const domainOrIp = type === 'hostingaccount' ? 'Dominio' : (productName.includes('Dominio') ? 'Dominio' : 'IP');

            serversMessage += `*Producto:* ${productName}\n*${domainOrIp}:* ${domain}\n*Precio:*  \$${amount} ${code}\n*Facturación:* ${billingCycle}\n*Fecha de Vencimiento:* ${formatDate(nextduedate)}\n\n`;
        });

        await sendMessage(client, userPhone, serversMessage);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error fetching upcoming due dates:', err);
    } finally {
        await db.end();
    }
}

module.exports = { fetchActiveServers, fetchUpcomingDueDates };