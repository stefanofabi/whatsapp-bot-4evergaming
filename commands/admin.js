const { connect } = require('../databases/connection');
const { sendMessage } = require('../utils/messages');

async function deleteAllMessages(userPhone, client) {
    const db = await connect('whatsapp');

    const cleanPhone = userPhone.split('@')[0];

    const deleteQuery = `
        DELETE FROM messages
    `;

    try {
        const [result] = await db.execute(deleteQuery, [cleanPhone]);

        const deletedCount = result.affectedRows;

        if (deletedCount === 0) {
            await sendMessage(client, userPhone, '🤖 No se encontraron mensajes para eliminar.');
        } else {
            await sendMessage(client, userPhone, `🧹 Se eliminaron ${deletedCount} mensaje(s) del historial.`);
        }
    } catch (err) {
        console.error('Error deleting messages:', err);
        await sendMessage(client, userPhone, '❌ Ocurrió un error al intentar eliminar los mensajes.');
    } finally {
        await db.end();
    }
}

module.exports = { deleteAllMessages };
