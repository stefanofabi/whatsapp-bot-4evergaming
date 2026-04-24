const { connect } = require('../databases/connection');

async function sendMessage(client, userPhone, message) 
{
    try {
        await client.sendMessage(userPhone, message);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error sending message:', err);
    }
}

async function registerChat(chatId, code, client) 
{
    try {
        const whmcsDb = await connect('whmcs');

        const [clients] = await whmcsDb.execute(
            'SELECT id FROM tblclients WHERE uuid = ? LIMIT 1',
            [code]
        );

        if (clients.length === 0) {
            return sendMessage(client, chatId, 'UUID no encontrado');
        }

        const clientId = clients[0].id;

        const whatsappDb = await connect('whatsapp');
        await whatsappDb.execute(
            'INSERT INTO chats (chatid, clientwhmcs) VALUES (?, ?)',
            [chatId, clientId]
        );

        return sendMessage(client, chatId, 'Chat registrado correctamente');
    } catch (error) {
        console.error(error);
        return sendMessage(client, chatId, 'Error interno');
    }
}

async function resolveClient(chatId) 
{
    const db = await connect('whatsapp');

    const resolveQuery = `
        SELECT clientwhmcs
        FROM chats
        WHERE chatid = ?
        LIMIT 1
    `;

    const [client] = await db.execute(resolveQuery, [chatId]);

    if (client.length > 0) {
        return client[0].clientwhmcs;
    }

    return null;
}

module.exports = { sendMessage, registerChat, resolveClient };