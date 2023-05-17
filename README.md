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

3. Configurar el token de acceso a la API
```
$ nano index.js
```

3. Configurar la conexión a la base de datos y colocar el token API creado en el paso anterior
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
@reboot sleep 5 && node /root/whatsapp-bot-4evergaming/index.js &

*/5 * * * * cd /root/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 invoice_paid.py
*/5 * * * * cd /root/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 client_area_login.py
0 11 * * * cd /root/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 invoice_unpaid.py
0 11 * * * cd /root/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 invoice_duedate.py
0 11 * * * cd /root/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 invoice_comingTerminate.py
0 11 * * * cd /root/whatsapp-bot-4evergaming/whmcs && /usr/bin/python3 order_pending.py

*/5 * * * * cd /root/whatsapp-bot-4evergaming/tcadmin && /usr/bin/python3 user_login.py
*/60 * * * * cd /root/whatsapp-bot-4evergaming/tcadmin && /usr/bin/python3 last_activity.py
*/5 * * * * cd /root/whatsapp-bot-4evergaming/tcadmin && /usr/bin/python3 server_started.py
```

6. Por ultimo iniciar la aplicación en segundo plano
```
$ npm start & 
```

# Consideraciones
Configurar las tareas diarias para después de haberse ejecutado el cron de WHMCS. Además no se deben exponer los archivos frente a un servidor web.
