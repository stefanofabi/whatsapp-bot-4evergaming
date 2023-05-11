import config
import datetime
import requests
import template_message

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
access.execute("SELECT * FROM tblclients WHERE lastlogin >= date_sub(now(), INTERVAL 5 minute)")
clients = access.fetchall()
for x in clients:   
    firstName = x[2].split(" ")[0]
    lastName = x[3]
    phone = x[12].replace('.', '9').replace('-', '').replace(' ', '')
    lastlogin = x[42]
    ip = x[43]
    messageToSend = template_message.client_area_login.format(firstName = firstName,lastName = lastName,phone = phone, lastlogin = lastlogin, ip = ip)
    url = config.api_endpoint + '/api/send'
    data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
    sendMessage = requests.post(url, json = data)

    print(sendMessage.text.encode("utf-8"))