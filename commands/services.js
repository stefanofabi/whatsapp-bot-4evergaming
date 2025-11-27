const { connect } = require('../databases/connection');
const { sendMessage } = require('../utils/messages');
const { formatDate } = require('../utils/dates');
const { addCancelRequest } = require('../utils/whmcs');

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
            tblhosting.domainstatus IN ("Active", "Suspended") AND
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
        let totalAmount = 0;
        let currencyCode = '';

        results.forEach(({ productName, type, domain, amount, billingCycle, nextduedate, code }) => {
            const domainOrIp = type === 'hostingaccount' ? 'Dominio' : (productName.includes('Dominio') ? 'Dominio' : 'IP');

            serversMessage += `*Producto:* ${productName}\n*${domainOrIp}:* ${domain}\n*Precio:* \$${amount} ${code}\n*Facturación:* ${billingCycle}\n*Fecha de Vencimiento:* ${formatDate(nextduedate)}\n\n`;

            totalAmount += parseFloat(amount);
            currencyCode = code; // guardamos el código de moneda (si es el mismo para todos)
        });

        // Agregamos el total al final
        serversMessage += `*💰 Total a vencer:* \$${totalAmount.toFixed(2)} ${currencyCode}`;

        await sendMessage(client, userPhone, serversMessage);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error fetching upcoming due dates:', err);
    } finally {
        await db.end();
    }
}

async function getTotalSumOfContractedServices(userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            ROUND(SUM(tblhosting.amount)) AS amount
        FROM 
            tblhosting 
        INNER JOIN 
            tblclients ON tblhosting.userid = tblclients.id 
        WHERE 
            tblhosting.domainstatus IN ("Active", "Suspended") AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [userPhone.split('@')[0]]);

        if (results.length === 0 || results[0].amount === null) {
            await sendMessage(client, userPhone, '🤖 No tenés servicios activos o suspendidos');
            console.log(`[200] No contracted services found for ${userPhone}`);
            await db.end();
            return;
        }

        const totalAmount = results[0].amount;
        await sendMessage(client, userPhone, `🤖 El total de tus servicios contratados es: \$${totalAmount}`);
        console.log(`[200] Total sum sent to ${userPhone}: \$${totalAmount}`);
    } catch (err) {
        console.error('Error fetching total sum of contracted services:', err);
    } finally {
        await db.end();
    }
}

async function requestCancel(userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblproducts.name AS productName, 
            tblproducts.type,
            tblhosting.id AS serviceId, 
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
            tblhosting.domainstatus IN ("Active", "Suspended") AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [userPhone.split('@')[0]]);

        if (results.length === 0) {
            await sendMessage(client, userPhone, '🤖 No tenes servicios que puedas cancelar');
            await db.end();
            return;
        }

        let serversMessage = '🤖 Especifica el servidor que queres cancelar:\n\n';

        results.forEach(({ productName, type, serviceId, domain, amount, nextduedate, code }) => {
            const domainOrIp = type === 'hostingaccount' ? 'Dominio' : (productName.includes('Dominio') ? 'Dominio' : 'IP');
        
            serversMessage += `*ID:* ${serviceId}\n*Producto:* ${productName}\n*${domainOrIp}:* ${domain}\n*Precio:*  \$${amount} ${code}\n*Vencimiento:* ${formatDate(nextduedate)}\n\n`;
        });

        serversMessage += `Confirma la baja utiliza el comando *!confirmarbaja <id, dominio o ip>*`;

        await sendMessage(client, userPhone, serversMessage);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error fetching servers to cancel:', err);
    } finally {
        await db.end();
    }
}

async function confirmRequestCancel(userPhone, client, filter) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblproducts.name AS productName, 
            tblproducts.type,
            tblhosting.id AS serviceId, 
            tblhosting.domain, 
            tblclients.phonenumber
        FROM 
            tblhosting 
        INNER JOIN 
            tblclients ON tblhosting.userid = tblclients.id 
        INNER JOIN 
            tblproducts ON tblhosting.packageid = tblproducts.id 
        WHERE 
            tblhosting.domainstatus IN ("Active", "Suspended") AND
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [userPhone.split('@')[0]]);

        if (results.length === 0) {
            await sendMessage(client, userPhone, '🤖 No tenes servicios activos o suspendidos que puedas cancelar');
            await db.end();
            return;
        }

        // 🔍 Buscar el servicio por ID o por dominio (ignorando mayúsculas/minúsculas)
        const filterString = String(filter).toLowerCase();

        const service = results.find(service => 
            service.serviceId.toString() === filter.toString() || 
            service.domain.toLowerCase() === filterString
        );


        if (!service) {
            await sendMessage(client, userPhone, `🤖 No encontré un servicio asociado con *${filter}*.`);
            await db.end();
            return;
        }

        const checkCancelQuery = `
            SELECT date, reason, type
            FROM tblcancelrequests
            WHERE relid = ?
        `;
        const [cancelResults] = await db.execute(checkCancelQuery, [service.serviceId]);

        if (cancelResults.length > 0) {
            const cancelRequest = cancelResults[0];
            const cancelDate = cancelRequest.date;
            const cancelReason = cancelRequest.reason;
            const cancelType = cancelRequest.type;

            await sendMessage(client, userPhone, 
                `🤖 Ya existe una solicitud de cancelación para el servicio con ID *#${service.serviceId}*.\n\n`  +
                `Fecha: ${formatDate(cancelDate)}\n` +
                `Razón: ${cancelReason}\n` +
                `Tipo de cancelación: ${cancelType}`);
            await db.end();
            return;
        }

        const cancelSuccess = await addCancelRequest(service.serviceId);

        if (cancelSuccess) {
            await sendMessage(client, userPhone, `🤖 El servicio con ID *#${service.serviceId}* (${service.domain}) ha sido cancelado exitosamente.`);
        } else {
            await sendMessage(client, userPhone, `🤖 Hubo un error al intentar cancelar el servicio con ID *#${service.serviceId}*. Por favor, intentalo nuevamente.`);
        }

    } catch (err) {
        console.error('Error confirming cancelation request:', err);
        await sendMessage(client, userPhone, '🤖 Ocurrió un error al procesar tu solicitud de cancelación.');
    } finally {
        await db.end();
    }
}

module.exports = { fetchActiveServers, fetchUpcomingDueDates, getTotalSumOfContractedServices, requestCancel, confirmRequestCancel };