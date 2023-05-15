import config
import datetime
import requests
import template_message
import json
import time

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
access.execute("SELECT id, userid, DATE_FORMAT(duedate, '%e %M %Y'), total FROM tblinvoices WHERE status = 'Unpaid' AND duedate = CURDATE()")
resultInvoices = access.fetchall()

for invoice in resultInvoices:
    invoiceNumber = invoice[0]
    duedate = invoice[2]
    duetotal = invoice[3]

    sql = "SELECT id, firstname, lastname, phonenumber, currency, groupid FROM tblclients WHERE id = %s"
    access.execute(sql, (invoice[1],))
    resultClients = access.fetchall()

    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        phone = client[3].replace('.', '9').replace('-', '').replace(' ', '')
        currency = "USD" if (client[4] == "1") else "ARS"

        # pertenece al debito automatico
        if client[5] == 5:
            messageToSend = template_message.invoice_auto_debit.format(firstName = firstName, invoiceNumber = invoiceNumber, duedate = duedate, duetotal= duetotal, currency = currency)
        else:
            messageToSend = template_message.invoice_duedate.format(firstName = firstName, invoiceNumber = invoiceNumber, duedate = duedate, duetotal = duetotal, currency = currency)
        
        url = config.api_endpoint + '/api/send'
        data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
        sendMessage = requests.post(url, json = data).json()

        if (sendMessage["error"]):
            print("Error al enviar el mensaje al usuario #" + str(clientId))
        else:
            print("Mensaje enviado al usuario #" + str(clientId)) 

        # demoramos 1 segundo el proximo mensaje
        time.sleep(1)