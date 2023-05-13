import config
import datetime
import requests
import template_message

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
# tcadmin guarda los datetime en utc
access.execute("SELECT user_id, user_name, date_sub(last_login, INTERVAL 180 MINUTE) AS last_login, last_login_ip, first_name, last_name, country, home_phone FROM tc_users WHERE home_phone <> '' AND last_login >= date_add(now(), INTERVAL 175 minute)")
clients = access.fetchall()
for x in clients:   
    username = x[1]
    firstName = x[4].split(" ")[0]
    lastName = x[5]
    phone = x[7].replace('.', '9').replace('-', '').replace(' ', '')
    
    if (x[6] == "AR"): 
        phone = "+549" + phone
    elif (x[6] == "CL"): 
        phone = "+569" + phone
    elif (x[6] == "UY"): 
        phone = "+5989" + phone
    elif (x[6] == "PE"): 
        phone = "+519" + phone
    elif (x[6] == "EC"): 
        phone = "+5939" + phone
    else:
        continue
    
    lastlogin = x[2]
    ip = x[3]
    messageToSend = template_message.user_login.format(firstName = firstName,lastName = lastName,phone = phone, lastlogin = lastlogin, ip = ip, username = username)
    url = config.api_endpoint + '/api/send'
    data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
    sendMessage = requests.post(url, json = data)

    print(sendMessage.text.encode("utf-8"))