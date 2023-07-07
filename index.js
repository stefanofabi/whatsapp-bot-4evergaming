// Package yang di gunakan
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
// express api
const express = require('express');
const app = express();
const port = 8080;

const API_TOKEN = ""; 

if (!API_TOKEN) {
	console.error("ERROR: API_TOKEN no esta definido!");
    process.exit(1);
}

// Creating a New Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]},
});

//The whatsappjs login process uses a qrcode that will be sent by whatsapp-web.js
client.on('qr', (qr) => {
    qrcode.generate(qr, {
        small: true
    });
});

//Process Where Whatsapp-web.js Ready to use
client.on('ready', () => {
    console.log('Ready !');
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
	
    app.post('/api/send', (req, res) => {
        // res.send('Hello World, from express');
        const phone = req.body.phone;
        const message = req.body.message;
		const token = req.body.token;
		
		if (token != API_TOKEN) {
			return res.status(200).json({
                error: true,
                data: {
                message: 'permiso denegado',
                meta: error,
                },
            });
		}

        client.sendMessage(phone.substring(1) + "@c.us", message)
        .then(response => {
                console.log('[200] Mensaje enviado a ' +phone);

                res.status(200).json({
                    error: false,
                    data: {
                    message: 'success',
                    meta: response,
                    },
                });
        }).catch(error => {
            console.log('[500] Error al enviar a ' +phone);

            res.status(500).json({
                    error: true,
                    data: {
                    message: 'error',
                    meta: error,
                },
            });
        });
    });
    app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))
});

// BOT Autoresponder
// define var
var currentChatLocation;

// Process Where When the Message goes to the bot
client.on('message', async message => {
    // Check incoming Messages
    if (message.body.toLowerCase() === 'menu') {
        // Reply message
        currentChatLocation = 'menu';
        message.reply('=== MENU PRINCIPAL ===\n\nSeleccioná alguna de las opciones disponibles del menú\n1. Quiero alquilar un servidor \n2. Quiero avisar un pago \n3. Quiero consultar algo \n4. Quiero hablar con un agente \n5. Ver estado del Servidor');
    }
	
    if (currentChatLocation == 'menu') {
        if (message.body.toLocaleLowerCase() === '1'){
            message.reply('¿Que querías contratar? \n1. Un Servidor de Juegos \n2. Un Servidor VPS \n3. Alojamiento web para mi Sitio \n4. Bot JS');
        }
		
        if (message.body.toLocaleLowerCase() === '2'){
            message.reply('¿Por donde hiciste el pago? \n1. Transferencia bancaria \n2. MercadoPago \n3. Uala \nTarjeta de débito/crédito \n4. Pago Facil o Rapipago \n5.Pago QR \n6. Debito Automático \n7. Cripto');
        }
        
    }
})

//The process where the client disconnects from Whatsapp-web
client.on('disconnected', (reason) => {
    console.log('disconnect Whatsapp-bot', reason);
});

client.initialize();