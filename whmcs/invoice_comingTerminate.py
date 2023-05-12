import config
import requests
import template_message
from datetime import date
from datetime import timedelta

access = config.db.cursor()
access.execute("SELECT value FROM tblconfiguration WHERE setting = 'AutoTerminationDays';")
terminateConf = access.fetchall()
dayBeforeTerminate = 1

today = date.today()
terminateDate = [today - timedelta(days = int(terminateConf[0][0])-int(dayBeforeTerminate))]

access = config.db.cursor()
access.execute("SELECT * FROM tblinvoices WHERE status = 'Unpaid' AND duedate = %s;",terminateDate)
resultInvoice = access.fetchall()
for x in resultInvoice:
    sql = "SELECT * FROM tblclients WHERE id = %s"
    access.execute(sql, (x[1],))
    resultUser = access.fetchall()
    for user in resultUser:
        firstName = user[2].split(" ")[0]
        lastName = user[3]
        phone = user[12].replace('.', '').replace('-', '')
        invoiceNumber = x[2]
        if invoiceNumber == "":
            invoiceNumber = x[0]
        currency = "USD" if (user[17] == "1") else "ARS"
        messageToSend = template_message.invoice_comingTerminate.format(firstName = firstName,lastName = lastName,phone = phone, invoiceNumber = invoiceNumber, duedate = str(x[4]), duetotal= x[13], currency = currency)
        url = config.api_endpoint + '/api/send'
        data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
        sendMessage = requests.post(url, json = data)

        print(sendMessage.text.encode("utf-8"))
