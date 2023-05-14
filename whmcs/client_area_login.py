import config
import datetime
import requests
import template_message
import json
import time

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
access.execute("SELECT id, firstname, lastname, email, phonenumber, date_format(lastlogin, '%d %M %Y %k:%iHs.') as lastlogin, ip FROM tblclients WHERE lastlogin >= date_sub(now(), INTERVAL 5 minute)")
clients = access.fetchall()
for client in clients:   
    firstName = client[1].split(" ")[0]
    email = client[3]
    phone = client[4].replace('.', '9').replace('-', '').replace(' ', '')
    lastlogin = client[5]
    ip = client[6]

    messageToSend = template_message.client_area_login.format(firstName = firstName, email = email, lastlogin = lastlogin, ip = ip)
    url = config.api_endpoint + '/api/send'
    data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
    sendMessage = requests.post(url, json = data).json()

    if (sendMessage["error"]):
        print("Error al enviar el mensaje al usuario #" + str(client[0]))
    else:
        print("Mensaje enviado al usuario #" + str(client[0])) 

    # demoramos 1 segundo el proximo mensaje
    time.sleep(1)