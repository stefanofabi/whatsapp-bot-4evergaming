const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

// Commands
const { fetchPendingInvoices, fetchInvoiceDetails, fetchInvoiceItems, checkDebt, markInvoicePaid } = require('./commands/invoices');
const { fetchActiveServers, fetchUpcomingDueDates, getTotalSumOfContractedServices, requestCancel, confirmRequestCancel } = require('./commands/services');
const { getHelpCommands } = require('./commands/help');
const { payWithBankTransfer, payWithCard, payWithMercadoPago, payWithUala } = require('./commands/payment_gateways');
const { getClientDetails } = require('./commands/clients');

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
cron.schedule('*/1 * * * *', async () => {
    if (isReady) {
        await fetchAndSendMessages(client);
    } else {
        console.log('WhatsApp is not available, waiting...');
    }
});

// Event when WhatsApp client disconnects
client.on("disconnected", (reason) => {
    isReady = false;

    console.error("WhatsApp Bot disconnected:", reason);
    process.exit(1);
});

// Fired on all message creations, including your own
client.on('message_create', async (message) => {
    if (! isReady) return;
    
    let userPhone = message.from;
    const commandParts = message.body.split(' ');
    
    // If I send the message, the message will still be directed to the client.
    if (message.fromMe) {
        userPhone = message.to;
    }

    if (commandParts[0] === '!status' || commandParts[0] === '!estado') {
        await message.reply('🤖 Estoy en linea');
    }

    if (commandParts[0] === '!chatid') {
        if (message.fromMe) {
            await message.reply('🤖 El chat id es '+message.to);
        } else {
            await message.reply('🤖 El chat id es '+message.from);
        }
    }

    if (commandParts[0] === '!ayuda' || commandParts[0] === '!help') {
        await getHelpCommands(userPhone, client);
    }

    //
    // Billing
    //

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

    if (commandParts[0] === '!detallefactura' && commandParts.length === 2) {
        const invoiceId = parseInt(commandParts[1], 10);

        if (isNaN(invoiceId)) {
            await message.reply('🤖 Numero de factura invalido');
            return;
        }
        
        await fetchInvoiceItems(invoiceId, userPhone, client);
    }

    if (commandParts[0] === '!deuda') {
        await checkDebt(userPhone, client);
    }

    //
    // Services
    //

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

    if (commandParts[0] === '!total') {
        await getTotalSumOfContractedServices(userPhone, client);
    }

    if (commandParts[0] === '!baja') {      
        await requestCancel(userPhone, client);
    }

    if (commandParts[0] === '!confirmarbaja' && commandParts.length === 2) {
        const serviceId = parseInt(commandParts[1], 10);

        if (isNaN(serviceId)) {
            await message.reply('🤖 Numero de servicio invalido');
            return;
        }
        
        await confirmRequestCancel(userPhone, client, serviceId);
    }

    //
    // Payments
    //

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

        await payWithCard(invoiceId, userPhone, client);
    }

    if (commandParts[0] === '!mercadopago') {
        const invoiceId = parseInt(commandParts[1], 10);

        await payWithMercadoPago(invoiceId, userPhone, client);
    }

    if (commandParts[0] === '!uala') {
        const invoiceId = parseInt(commandParts[1], 10);

        await payWithUala(invoiceId, userPhone, client);
    }

    //
    // Admin
    //

    if (commandParts[0] === '!marcarpagada' && commandParts.length === 5) {
        if (! message.fromMe) {
            await message.reply('🤖 Comando disponible solo para acceso administrativo');
        }

        const invoiceId = parseInt(commandParts[1], 10);
        const transactionId = parseInt(commandParts[2], 10);
        const amount = parseInt(commandParts[3], 10);
        const paymentMethod = commandParts[4];

        if (isNaN(invoiceId) || isNaN(amount)) {
            await message.reply('🤖 Uso correcto: !marcarpagada <factura> <transid> <amount> <paymentmethod>');
            return;
        }

        const validPaymentMethods = ["transferencia_bancaria", "mercadopago_dinero_en_cuenta", "uala", "qr_mercadopago", "mercadopago_1"]

        if (! validPaymentMethods.includes(paymentMethod)) {
            await message.reply('🤖 El metodo de pago es incorrecto');
            return;
        }

        await markInvoicePaid(invoiceId, transactionId, amount, paymentMethod, userPhone, client);
    }

    if (commandParts[0] === '!cliente') {
        await getClientDetails(userPhone, client);
    }

});

client.initialize();
