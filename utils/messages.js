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

async function resolveForward(userPhone) 
{
    const db = await connect('whatsapp');

    const forwardQuery = `
        SELECT forward
        FROM forwarders
        WHERE phone = ?
        LIMIT 1
    `;

    const [forwardResult] = await db.execute(forwardQuery, [userPhone]);

    if (forwardResult.length > 0) {
        return forwardResult[0].forward;
    }

    return userPhone;
}

async function registerForwarder(chatId, forward) 
{
    const db = await connect('whatsapp');
    
    const sql = `
        INSERT INTO forwarders (phone, forward)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE forward = VALUES(forward)
    `;

    await db.execute(sql, [chatId, forward]);
}


module.exports = { sendMessage, resolveForward, registerForwarder };