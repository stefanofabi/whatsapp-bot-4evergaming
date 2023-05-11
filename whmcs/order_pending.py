import config
import datetime
import requests
import template_message

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
access.execute("SELECT tblorders.* FROM tblorders INNER JOIN tblinvoices ON tblorders.invoiceid = tblinvoices.id WHERE tblorders.status = 'Pending' AND tblinvoices.status = 'Unpaid' AND DATE_FORMAT(tblorders.date, '%Y-%m-%d') = DATE_FORMAT(date_sub(now(), INTERVAL 1 day), '%Y-%m-%d')")
resultOrders = access.fetchall()
for x in resultOrders:
    sql = "SELECT * FROM tblclients WHERE id = %s"
    access.execute(sql, (x[2],))
    resultUser = access.fetchall()
    for user in resultUser:
        firstName = user[2].split(" ")[0]
        lastName = user[3]
        phone = user[12].replace('.', '9').replace('-', '').replace(' ', '')
        invoiceNumber = x[16]
        messageToSend = template_message.order_pending.format(firstName = firstName,lastName = lastName,phone = phone, invoiceNumber = invoiceNumber)
        url = config.api_endpoint + '/api/send'
        data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
        sendMessage = requests.post(url, json = data)

        print(sendMessage.text.encode("utf-8"))