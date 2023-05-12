import config
import datetime
import requests
import template_message

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
access.execute("SELECT * FROM tblinvoices WHERE status = 'Unpaid' AND duedate = CURDATE()")
resultInvoice = access.fetchall()
for x in resultInvoice:
    sql = "SELECT * FROM tblclients WHERE id = %s"
    access.execute(sql, (x[1],))
    resultUser = access.fetchall()
    for user in resultUser:
        firstName = user[2].split(" ")[0]
        lastName = user[3]
        phone = user[12].replace('.', '9').replace('-', '').replace(' ', '')
        invoiceNumber = x[2]
        if invoiceNumber == "":
            invoiceNumber = x[0]
        currency = "USD" if (user[17] == "1") else "ARS"

        # pertenece al debito automatico
        if user[30] == "5":
            messageToSend = template_message.invoice_auto_debit.format(firstName = firstName,lastName = lastName,phone = phone, invoiceNumber = invoiceNumber, duedate = str(x[4]), duetotal= x[13], currency = currency)
        else:
            messageToSend = template_message.invoice_duedate.format(firstName = firstName,lastName = lastName,phone = phone, invoiceNumber = invoiceNumber, duedate = str(x[4]), duetotal= x[13], currency = currency)
        
        url = config.api_endpoint + '/api/send'
        data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
        sendMessage = requests.post(url, json = data)

        print(sendMessage.text.encode("utf-8"))