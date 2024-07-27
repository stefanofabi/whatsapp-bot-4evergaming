import config
import datetime
import requests
import template_message
import json
import time
import math
from decimal import Decimal

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
access.execute("SELECT id, userid, DATE_FORMAT(duedate, '%e %M %Y'), total FROM tblinvoices WHERE status = 'Unpaid' AND created_at LIKE CONCAT(CURDATE(), '%')")
resultInvoices = access.fetchall()

for invoice in resultInvoices:
    invoiceNumber = invoice[0]
    duedate = invoice[2]
    duetotal = Decimal(str(invoice[3]))  # Convertir a Decimal para precisión financiera
    discountAmount = math.ceil(duetotal * Decimal('0.90'))  # Aplicar descuento y redondear hacia arriba

    sql = "SELECT id, firstname, lastname, phonenumber, currency, groupid, defaultgateway FROM tblclients WHERE id = %s and email_preferences like '%invoice%:%1%'"
    access.execute(sql, (invoice[1],))
    resultClients = access.fetchall()

    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        phone = client[3].replace('.', '9').replace('-', '').replace(' ', '')
        currency_code = client[4]
        currency = config.CURRENCY_CODES.get(currency_code, "ARS")  # "ARS" es el valor por defecto si el código no se encuentra
        client_group = client[5]
        payment_option = client[6]

        # pertenece al debito automatico
        if client_group == config.GRUPO_DEBITO_AUTOMATICO:
            messageToSend = template_message.invoice_auto_debit.format(firstName = firstName, invoiceNumber = invoiceNumber, duedate = duedate, duetotal = duetotal, currency = currency)
        else:
            if payment_option == "transferencia_bancaria":
                messageToSend = template_message.invoice_unpaid_transferencia_bancaria.format(firstName = firstName, invoiceNumber = invoiceNumber, duedate = duedate, duetotal = duetotal, discountAmount = discountAmount, currency = currency)
            else:
                messageToSend = template_message.invoice_unpaid.format(firstName = firstName, invoiceNumber = invoiceNumber, duedate = duedate, duetotal = duetotal, discountAmount = discountAmount, currency = currency) 
                    
        url = config.api_endpoint + '/api/send'
        data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
        sendMessage = requests.post(url, json = data).json()

        if (sendMessage["error"]):
            print("Error al enviar el mensaje al usuario #" + str(clientId))
        else:
            print("Mensaje enviado al usuario #" + str(clientId)) 

        # demoramos 1 segundo el proximo mensaje
        time.sleep(1)
