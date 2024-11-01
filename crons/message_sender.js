const mysql = require('mysql2');
const config = require('../config.json');

// Connect to the MySQL database
const db = mysql.createConnection({
    host: config.databases.whatsapp.host,
    user: config.databases.whatsapp.user,
    password: config.databases.whatsapp.password,
    database: config.databases.whatsapp.database
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to WhatsApp database:', err);
        process.exit(1);
    }
    console.log('Connected to WhatsApp database');
});

// Function to fetch and send messages
function fetchAndSendMessages(client) {
    console.log('Running scheduled task to send messages');

    // Query the "messages" table
    db.query('SELECT id, phone, message FROM messages', (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return;
        }

        results.forEach(({ id, phone, message }) => {
            client.sendMessage(phone.substring(1) + "@c.us", message)
                .then(response => {
                    console.log(`[200] Message sent to ${phone}`);

                    // Delete the message from the database after sending
                    db.query('DELETE FROM messages WHERE id = ?', [id], (deleteErr) => {
                        if (deleteErr) {
                            console.error('Error deleting message:', deleteErr);
                        } else {
                            console.log(`[200] Message deleted from database for ${phone}`);
                        }
                    });
                })
                .catch(error => {
                    console.error(`[500] Error sending message to ${phone}:`, error);
                });
        });
    });
}

module.exports = fetchAndSendMessages;