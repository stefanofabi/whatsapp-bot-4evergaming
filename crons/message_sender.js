const { connect } = require('../databases/connection');
const { formatDate } = require('../utils/dates');

// Function to fetch and send messages
async function fetchAndSendMessages(client) {
    const db = await connect('whatsapp');

    const dateToday = formatDate(new Date);

    console.log(`[${dateToday}] Running scheduled task to send messages`);

    try {
        // Query the "messages" table
        const [results] = await db.execute('SELECT id, phone, message FROM messages');

        if (results.length === 0) {
            console.log(`[${dateToday}] No messages to send`);
        }

        for (const { id, phone, message } of results) {
            try {
                await client.sendMessage(phone, message);
                console.log(`[${dateToday}] [200] Message sent to ${phone}`);

                // Delete the message from the database after sending
                await db.execute('DELETE FROM messages WHERE id = ?', [id]);
                console.log(`[${dateToday}] [200] Message deleted from database for ${phone}`);
            } catch (error) {
                console.error(`[${dateToday}] [500] Error sending message to ${phone}:`, error);
            }
        }
    } catch (err) {
        console.error(`[${dateToday}] Error fetching messages:`, err);
    } finally {
        await db.end();
    }
}

module.exports = fetchAndSendMessages;