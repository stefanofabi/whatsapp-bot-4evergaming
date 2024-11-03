const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

// Commands
const { fetchPendingInvoices, fetchInvoiceDetails } = require('./commands/invoices');
const { fetchActiveServers, fetchUpcomingDueDates } = require('./commands/services');
const { getHelpCommands } = require('./commands/help');
const { payWithBankTransfer, payWithMercadoPago} = require('./commands/payment_gateways');

// Crons
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

var isReady = false;
// Event when WhatsApp client is ready
client.on('ready', () => {
    isReady = true;

    console.log('WhatsApp is ready!');
});

// Schedule the message sending task every 5 minutes
cron.schedule('*/5 * * * *', async () => await fetchAndSendMessages(client));

// Event when WhatsApp client disconnects
client.on("disconnected", (reason) => {
    isReady = false;

    console.error("WhatsApp Bot disconnected:", reason);
    process.exit(1);
});

// Fired on all message creations, including your own
client.on('message_create', async (message) => {
    if (! isReady) return;
    
    let userPhone = message.from.split('@')[0];
    const commandParts = message.body.split(' ');
    
    // If I send the message, the message will still be directed to the client.
    if (message.fromMe) {
        userPhone = message.to.split('@')[0];
    }

    if (commandParts[0] === '!ayuda' || commandParts[0] === '!help') {
        await getHelpCommands(userPhone, client);
    }

    if (commandParts[0] === '!status' || commandParts[0] === '!estado') {
        await message.reply('🤖 Estoy en linea');
    }

    if (commandParts[0] === '!misfacturas' || commandParts[0] === '!facturas') {
        await fetchPendingInvoices(userPhone, client);
    }

    if (commandParts[0] === '!factura' && commandParts.length === 2) {
        const invoiceId = parseInt(commandParts[1], 10);

        if (isNaN(invoiceId)) {
            await message.reply('🤖 Numero de factura invalido');
            return;
        }
        
        await fetchInvoiceDetails(invoiceId, userPhone, client);
    }

    if (commandParts[0] === '!misservicios' || commandParts[0] === '!servicios'|| commandParts[0] === '!misservidores'|| commandParts[0] === '!servidores') {
        await fetchActiveServers(userPhone, client);
    }

    if (commandParts[0] === '!vencimiento' || commandParts[0] === '!vencimientos' || commandParts[0] === '!proximosvencimientos') {
        let days = parseInt(commandParts[1], 10);

        if (commandParts.length !== 2 || isNaN(days)) {
            days = 10;
        }

        await fetchUpcomingDueDates(days, userPhone, client);
    }

    if (commandParts[0] === '!transferencia' || commandParts[0] === '!cbu' || commandParts[0] === '!alias') {
        const invoiceId = parseInt(commandParts[1], 10);

        await payWithBankTransfer(invoiceId, userPhone, client);
    }

    if (commandParts[0] === '!tarjeta' && commandParts.length === 2) {
        const invoiceId = parseInt(commandParts[1], 10);

        if (isNaN(invoiceId)) {
            await message.reply('🤖 Numero de factura invalido');
            return;
        }

        await payWithMercadoPago(invoiceId, userPhone, client);
    }
});

client.initialize();