const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

// Commands
const { fetchPendingInvoices, fetchInvoiceDetails } = require('./commands/invoices');
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
    const commandParts = message.body.split(' ');

    if (commandParts[0] === '!status' || commandParts[0] === '!estado') {
        message.reply('🤖 Estoy en linea');
    }

    if (commandParts[0] === '!misfacturas' || commandParts[0] === '!facturas') {
        fetchPendingInvoices(userPhone, client);
    }

    if (commandParts[0] === '!factura' && commandParts.length === 2) {
        const invoiceId = parseInt(commandParts[1], 10);
        fetchInvoiceDetails(invoiceId, userPhone, client);
    }
});

client.initialize();