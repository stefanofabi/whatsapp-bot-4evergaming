# WhatsApp Bot
Soy un Bot que envía notificaciones y recordatorios por WhatsApp.

# Instalación
1. Clonar el repositorio e instalar las dependencias
```
$ git clone https://github.com/stefanofabi/whatsapp-bot-4evergaming.git
$ apt install python3-pip
$ pip install mysql-connector-python
```

2. Descargar los paquetes 
```
$ npm install
```
3. Configurar la conexión a la base de datos
```
$ nano whmcs/config.py
```

4. Iniciar por primera vez la aplicación y escanear el código QR que vincula con WhatsApp Web
```
$ npm start
```

5. Cerrar la aplicación y configurar las tareas diarias
```
$ crontab -e
```

```
@reboot sleep 5 && node /var/www/whatsapp-bot-4evergaming/index.js &

*/5 * * * * cd /var/www/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 invoice_paid.py
*/5 * * * * cd /var/www/Whatsapp-WHMCS/whmcs && /usr/bin/python3 client_area_login.py
0 11 * * * cd /var/www/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 invoice_unpaid.py
0 11 * * * cd /var/www/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 invoice_duedate.py
0 11 * * * cd /var/www/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 invoice_comingTerminate.py
0 11 * * * cd /var/www/Whatsapp-WHMCS/whmcs && /usr/bin/python3 order_pending.py
```

6. Por ultimo iniciar la aplicación en segundo plano
```
$ npm start & 
```
