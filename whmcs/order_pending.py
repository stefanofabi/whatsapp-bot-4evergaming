import config
import datetime
import requests
import template_message
import json
import time

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
sql = """
SELECT tblorders.* 
FROM tblorders 
INNER JOIN tblinvoices ON tblorders.invoiceid = tblinvoices.id 
WHERE tblorders.status = 'Pending' AND 
tblinvoices.status = 'Unpaid' AND 
DATE_FORMAT(tblorders.date, '%Y-%m-%d') = DATE_FORMAT(date_sub(now(), INTERVAL 1 day), '%Y-%m-%d')
"""
access.execute(sql)
resultOrders = access.fetchall()
for order in resultOrders:
    sql = """
    SELECT id, firstname, lastname, phonenumber 
    FROM tblclients 
    WHERE id = %s and email_preferences like '%product%:%1%'
    """
    access.execute(sql, (order[2],))
    resultClients = access.fetchall()

    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        phone = client[3].replace('.', '9').replace('-', '').replace(' ', '')

        messageToSend = template_message.order_pending.format(firstName = firstName)
        url = config.api_endpoint + '/api/send'
        data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
        sendMessage = requests.post(url, json = data).json()

        if (sendMessage["error"]):
            print("Error al enviar el mensaje al usuario #" + str(clientId))
        else:
            print("Mensaje enviado al usuario #" + str(clientId)) 

        # demoramos 1 segundo el proximo mensaje
        time.sleep(1)