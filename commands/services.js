const mysql = require('mysql2');
const config = require('../config.json');

// Configure the connection to the WHMCS database
const db_whmcs = mysql.createConnection({
    host: config.databases.whmcs.host,
    user: config.databases.whmcs.user,
    password: config.databases.whmcs.password,
    database: config.databases.whmcs.database
});

// Connect to the WHMCS database
db_whmcs.connect((err) => {
    if (err) {
        console.error('Error connecting to WHMCS database:', err);
        process.exit(1);
    }
    console.log('Connected to WHMCS database');
});

// Function to fetch active servers
function fetchActiveServers(userPhone, client) {
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

    db_whmcs.query(query, [userPhone], (err, results) => {
        if (err) {
            console.error('Error fetching active servers:', err);
            return;
        }

        if (results.length === 0) {
            client.sendMessage(userPhone + "@c.us", '🤖 No tenes servicios activos');
            return;
        }

        let serversMessage = '🤖 Tus servicios activos:\n\n';
        results.forEach(({ productName, domain, amount, billingCycle }) => {
            serversMessage += `*Producto:* ${productName}\n*Dominio:* ${domain}\n*Precio:* \$${amount}\n*Facturación:* ${billingCycle}\n\n`;
        });

        client.sendMessage(userPhone + "@c.us", serversMessage)
            .then(response => {
                console.log(`[200] Message sent to ${userPhone}`);
            })
            .catch(error => {
                console.error(`[500] Error sending message to ${userPhone}:`, error);
            });
    });
}

// Function to fetch upcoming due dates
function fetchUpcomingDueDates(days, userPhone, client) {
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

    db_whmcs.query(query, [days, userPhone], (err, results) => {
        if (err) {
            console.error('Error fetching active servers:', err);
            return;
        }

        if (results.length === 0) {
            client.sendMessage(userPhone + "@c.us", '🤖 No tenes vencimientos en los próximos ' + days + " días");
            return;
        }

        let serversMessage = '🤖 Los servicios próximos a vencer son:\n\n';
        results.forEach(({ productName, domain, amount, billingCycle, nextduedate }) => {
            serversMessage += `*Producto:* ${productName}\n*Dominio:* ${domain}\n*Precio:* \$${amount}\n*Facturación:* ${billingCycle}\n*Fecha de Vencimiento:* ${formatDate(nextduedate)}\n\n`;
        });

        client.sendMessage(userPhone + "@c.us", serversMessage)
            .then(response => {
                console.log(`[200] Message sent to ${userPhone}`);
            })
            .catch(error => {
                console.error(`[500] Error sending message to ${userPhone}:`, error);
            });
    });
}

function formatDate(date) {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Intl.DateTimeFormat('es-ES', options).format(new Date(date));
}

module.exports = { fetchActiveServers, fetchUpcomingDueDates };
