import config
import datetime
import requests
import template_message
import json
import time

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
access.execute("SELECT tblusers.id AS USER_id, tblusers.email, tblusers.last_ip, tblclients.id AS client_id, tblclients.firstname, tblclients.lastname, phonenumber, date_format(tblusers_clients.last_login, '%d %M %Y %k:%iHs.') as last_login FROM tblusers INNER JOIN tblusers_clients  ON tblusers.id = tblusers_clients.auth_user_id INNER JOIN tblclients ON tblusers_clients.client_id = tblclients.id WHERE tblusers_clients.last_login >= date_sub(now(), INTERVAL 5 minute) and email_preferences like '%general%:%1%'")
clients = access.fetchall()

for client in clients:   
    firstName = client[4].split(" ")[0]
    email = client[1]
    phone = client[6].replace('.', '9').replace('-', '').replace(' ', '')
    lastlogin = client[7]
    ip = client[2]

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