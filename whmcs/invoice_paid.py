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
SELECT id, userid, DATE_FORMAT(duedate, '%e %M %Y'), total 
FROM tblinvoices 
WHERE status = 'Paid' AND datepaid >= date_sub(now(), interval 5 minute)
"""
access.execute(sql)
resultInvoices = access.fetchall()

for invoice in resultInvoices:
    invoiceNumber = invoice[0]

    sql = """
    SELECT id, firstname, lastname, phonenumber, currency 
    FROM tblclients 
    WHERE id = %s and email_preferences like '%invoice%:%1%'
    """
    access.execute(sql, (invoice[1],))
    resultClients = access.fetchall()

    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        phone = client[3].replace('.', '9').replace('-', '').replace(' ', '')

        messageToSend = template_message.invoice_paid.format(firstName = firstName, invoiceNumber = invoiceNumber)
        url = config.api_endpoint + '/api/send'
        data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
        sendMessage = requests.post(url, json = data).json()

        if (sendMessage["error"]):
            print("Error al enviar el mensaje al usuario #" + str(clientId))
        else:
            print("Mensaje enviado al usuario #" + str(clientId)) 

        # demoramos 1 segundo el proximo mensaje
        time.sleep(1)