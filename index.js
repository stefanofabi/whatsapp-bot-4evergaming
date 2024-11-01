const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

// Commands
const { fetchPendingInvoices } = require('./commands/invoices');
const fetchAndSendMessages = require('./crons/message_sender');

// Configure the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ["--no-sandbox"],
        headless: true,
    },
});

// Event when QR code is generated
client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

// Event when WhatsApp client is ready
client.on('ready', () => {
    console.log('WhatsApp is ready!');
});

// Schedule the message sending task every 5 minutes
cron.schedule('*/5 * * * *', () => fetchAndSendMessages(client));

// Event when WhatsApp client disconnects
client.on("disconnected", (reason) => {
    console.error("WhatsApp Bot disconnected:", reason);
    process.exit(1);
});

// Event to respond to incoming messages
client.on('message', message => {
    const userPhone = message.from.split('@')[0];

    if (message.body === '!status') {
        message.reply('🤖 I am online');
    }

    if (message.body === '!misfacturas') {
        fetchPendingInvoices(userPhone, client);
    }
});

client.initialize();