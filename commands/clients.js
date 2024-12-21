const { connect } = require('../databases/connection');
const { sendMessage } = require('../utils/messages');

async function getClientDetails(userPhone, client) {
    const db = await connect('whmcs');

    const query = `
        SELECT 
            tblclients.id, 
            tblclients.firstname,
            tblclients.lastname,
            tblclients.email
        FROM 
            tblclients 
        WHERE 
            CASE 
                WHEN tblclients.phonenumber LIKE '+54%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '9'), ' ', ''), '-', '')
                WHEN tblclients.phonenumber LIKE '+52%' THEN REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), '.', '1'), ' ', ''), '-', '')
                ELSE REPLACE(REPLACE(REPLACE(REPLACE(tblclients.phonenumber, '+', ''), ' ', ''), '-', ''), '.', '') 
            END = ?
    `;

    try {
        const [results] = await db.execute(query, [userPhone.split('@')[0]]);

        if (results.length === 0) {
            await sendMessage(client, userPhone, '🤖 No se encontraron datos para este teléfono');
            await db.end();
            return;
        }

        const { id, firstname, lastname, email } = results[0];

        let clientMessage = `🤖 Los datos del cliente son:\n\n`;
        clientMessage += `*ID:* ${id}\n`;
        clientMessage += `*Nombre:* ${firstname} ${lastname}\n`;
        clientMessage += `*Email:* ${email}\n`;

        await sendMessage(client, userPhone, clientMessage);

    } catch (err) {
        console.error('Error fetching client details:', err);
    } finally {
        await db.end();
    }
}

module.exports = { getClientDetails };
