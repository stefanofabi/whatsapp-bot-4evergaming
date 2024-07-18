// Package yang di gunakan
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require('qrcode-terminal');

// express api
const express = require('express');
const app = express();
const port = 8080;

const API_TOKEN = "FOREVERGAMING-WSP-BOT"; 

if (!API_TOKEN) {
	console.error("ERROR: API_TOKEN no esta definido!");
    process.exit(1);
}

// Creating a New Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox"],
    headless: true,
  },
});

//The whatsappjs login process uses a qrcode that will be sent by whatsapp-web.js
client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
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

//The process where the client disconnects from Whatsapp-web
client.on('disconnected', (reason) => {
    console.log('disconnect Whatsapp-bot', reason);
});

client.initialize();
