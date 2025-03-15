const { connect } = require('../databases/connection');
const { formatDate } = require('../utils/dates');

// Function to fetch and send messages
async function fetchAndSendMessages(client) {
    const db = await connect('whatsapp');

    const dateToday = formatDate(new Date(), true);

    console.log(`[${dateToday}] Running scheduled task to send messages`);

    try {
        const [results] = await db.execute('SELECT id, phone, message FROM messages');

        if (results.length === 0) {
            console.log(`[${dateToday}] No messages to send`);
        }

        for (const { id, phone, message } of results) {
            const phoneNumber = phone.split('@')[0];

            // Validate that it only contains numbers
            if (/^\d+$/.test(phoneNumber)) {
                try {
                    await client.sendMessage(phone, message);
                    console.log(`[${dateToday}] [200] Message sent to ${phone}`);

                    await db.execute('DELETE FROM messages WHERE id = ?', [id]);
                    console.log(`[${dateToday}] [200] Message deleted from database for ${phone}`);
                } catch (error) {
                    console.error(`[${dateToday}] [500] Error sending message to ${phone}:`, error);
                }
            } else {
                await db.execute('DELETE FROM messages WHERE id = ?', [id]);
                console.log(`[${dateToday}] [400] Invalid phone number format for ${phone}. Message deleted from database.`);
            }
        }
    } catch (err) {
        console.error(`[${dateToday}] Error fetching messages:`, err);
    } finally {
        await db.end();
    }
}

module.exports = fetchAndSendMessages;