const { connect } = require('../databases/connection');

// Function to get the current date and time in the desired format
function getCurrentDateTime() {
    const now = new Date();
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    const formattedDate = now.toLocaleString('es-ES', options).replace(',', ''); // Reemplaza la coma entre fecha y hora
    return `${formattedDate}hs`;
}

// Function to fetch and send messages
async function fetchAndSendMessages(client) {
    const db = await connect('whatsapp');

    console.log(`[${getCurrentDateTime()}] Running scheduled task to send messages`);

    try {
        // Query the "messages" table
        const [results] = await db.execute('SELECT id, phone, message FROM messages');

        if (results.length === 0) {
            console.log(`[${getCurrentDateTime()}] No messages to send`);
        }

        for (const { id, phone, message } of results) {
            try {
                await client.sendMessage(phone.substring(1) + "@c.us", message);
                console.log(`[${getCurrentDateTime()}] [200] Message sent to ${phone}`);

                // Delete the message from the database after sending
                await db.execute('DELETE FROM messages WHERE id = ?', [id]);
                console.log(`[${getCurrentDateTime()}] [200] Message deleted from database for ${phone}`);
            } catch (error) {
                console.error(`[${getCurrentDateTime()}] [500] Error sending message to ${phone}:`, error);
            }
        }
    } catch (err) {
        console.error(`[${getCurrentDateTime()}] Error fetching messages:`, err);
    } finally {
        await db.end();
    }
}

module.exports = fetchAndSendMessages;