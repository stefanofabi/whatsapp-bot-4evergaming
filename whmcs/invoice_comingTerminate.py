import config
import requests
import template_message
from datetime import date
from datetime import timedelta
import json
import time
import math

access = config.db.cursor()
access.execute("SELECT value FROM tblconfiguration WHERE setting = 'AutoTerminationDays'")
terminateConf = access.fetchall()
dayBeforeTerminate = 1

today = date.today()
terminateDate = [today - timedelta(days = int(terminateConf[0][0])-int(dayBeforeTerminate))]

access = config.db.cursor()
access.execute("SELECT id, userid, DATE_FORMAT(duedate, '%e %M %Y'), total FROM tblinvoices WHERE status = 'Unpaid' AND duedate = %s;",terminateDate)
resultInvoices = access.fetchall()

for invoice in resultInvoices:
    invoiceNumber = invoice[0]
    duedate = invoice[2]
    duetotal = invoice[3]
    discountAmount = math.ceil(invoice[3] * 0.90)

    sql = "SELECT id, firstname, lastname, phonenumber, currency FROM tblclients WHERE id = %s and email_preferences like '%invoice%:1%' and groupid <> 1"
    access.execute(sql, (invoice[1],))
    resultClients = access.fetchall()

    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        phone = client[3].replace('.', '9').replace('-', '').replace(' ', '')
        currency = "USD" if (client[4] == "1") else "ARS"

        messageToSend = template_message.invoice_comingTerminate.format(firstName = firstName, invoiceNumber = invoiceNumber, duedate = duedate, duetotal = duetotal, discountAmount = discountAmount, currency = currency)
        
        url = config.api_endpoint + '/api/send'
        data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
        sendMessage = requests.post(url, json = data).json()

        if (sendMessage["error"]):
            print("Error al enviar el mensaje al usuario #" + str(clientId))
        else:
            print("Mensaje enviado al usuario #" + str(clientId)) 

        # demoramos 1 segundo el proximo mensaje
        time.sleep(1)
