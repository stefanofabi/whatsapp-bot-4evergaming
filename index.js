const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mysql = require('mysql2');
const fs = require('fs');
const cron = require('node-cron');

// Read MySQL connection configuration from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// MySQL Database connection
const db = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

// Configure WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ["--no-sandbox"],
        headless: true,
    },
});

// Function to fetch and send messages from the database
const fetchAndSendMessages = () => {
    console.log('Running scheduled task to send messages');

    // Query the messages from the "messages" table
    db.query('SELECT id, phone, message FROM messages', (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return;
        }

        results.forEach(({ id, phone, message }) => {
            client.sendMessage(phone.substring(1) + "@c.us", message)
                .then(response => {
                    console.log(`[200] Message sent to ${phone}`);

                    // Delete message from database after sending
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
};

// Event when QR is generated
client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

// Event when WhatsApp client is ready
client.on('ready', () => {
    console.log('WhatsApp is ready!');
});

// Schedule the fetch and send task to run every 5 minutes
cron.schedule('*/5 * * * *', fetchAndSendMessages);

// Event when WhatsApp client disconnects
client.on("disconnected", (reason) => {
    console.error("WhatsApp Bot disconnected:", reason);
    process.exit(1);
});

client.initialize();