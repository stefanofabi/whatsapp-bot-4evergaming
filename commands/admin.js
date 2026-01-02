const { connect } = require('../databases/connection');
const { sendMessage } = require('../utils/messages');

async function deleteAllMessages(chatId, client) {
    const db = await connect('whatsapp');

    const cleanPhone = chatId.split('@')[0];

    // Filtrar solo los mensajes de este chat
    const deleteQuery = `
        DELETE FROM messages
        WHERE chat_id = ?
    `;

    try {
        const [result] = await db.execute(deleteQuery, [cleanPhone]);

        const deletedCount = result.affectedRows;

        if (deletedCount === 0) {
            await sendMessage(client, chatId, '🤖 No se encontraron mensajes para eliminar.');
        } else {
            await sendMessage(client, chatId, `🧹 Se eliminaron ${deletedCount} mensaje(s) del historial.`);
        }
    } catch (err) {
        console.error('Error deleting messages:', err);
        await sendMessage(client, chatId, '❌ Ocurrió un error al intentar eliminar los mensajes.');
    } finally {
        await db.end();
    }
}

module.exports = { deleteAllMessages };
