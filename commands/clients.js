const { connect } = require('../databases/connection');
const { sendMessage } = require('../utils/messages');

async function getClientDetails(chatId, clientWhmcs, client) {
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
            tblclients.id = ?
    `;

    try {
        const [results] = await db.execute(query, [clientWhmcs]);

        if (results.length === 0) {
            await sendMessage(client, chatId, '🤖 No se encontraron datos para este teléfono');
            await db.end();
            return;
        }

        const { id, firstname, lastname, email } = results[0];

        let clientMessage = `🤖 Los datos del cliente son:\n\n`;
        clientMessage += `*ID:* ${id}\n`;
        clientMessage += `*Nombre:* ${firstname} ${lastname}\n`;
        clientMessage += `*Email:* ${email}\n`;

        await sendMessage(client, chatId, clientMessage);

    } catch (err) {
        console.error('Error fetching client details:', err);
    } finally {
        await db.end();
    }
}

module.exports = { getClientDetails };
