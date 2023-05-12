import config
import datetime
import requests
import template_message

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
access.execute("SELECT * FROM tc_users WHERE last_login >= date_sub(now(), INTERVAL 5 minute)")
clients = access.fetchall()
for x in clients:   
    username = x[1]
    firstName = x[10].split(" ")[0]
    lastName = x[11]
    phone = x[20].replace('.', '9').replace('-', '').replace(' ', '')
    
    if phone == "":
        continue

    if (x[17] == "AR"): 
        phone = "+549" + phone
    elif (x[17] == "CL"): 
        phone = "+569" + phone
    elif (x[17] == "UY"): 
        phone = "+5989" + phone
    elif (x[17] == "PE"): 
        phone = "+519" + phone
    elif (x[17] == "EC"): 
        phone = "+5939" + phone
    else:
        continue
    
    lastlogin = x[8]
    ip = x[9]
    messageToSend = template_message.user_login.format(firstName = firstName,lastName = lastName,phone = phone, lastlogin = lastlogin, ip = ip, username = username)
    url = config.api_endpoint + '/api/send'
    data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
    sendMessage = requests.post(url, json = data)

    print(sendMessage.text.encode("utf-8"))