import config
import requests
import template_message
import json
import time

access = config.db.cursor()
access.execute("SELECT user_id, user_name, date_format(date_sub(last_login, INTERVAL 180 MINUTE), '%d %M %Y %k:%i') AS last_login, last_login_ip, first_name, last_name, country, home_phone FROM tc_users where home_phone <> ''")
resultUsers = access.fetchall()
for user in resultUsers:
    # tcadmin guarda los datetime en utc
    sql = "SELECT * FROM tc_tasks WHERE last_run_time >= date_add(now(), INTERVAL 115 MINUTE) AND user_id = %s"
    access.execute(sql, (user[0],))
    resultTasks = access.fetchall()

    firstName = user[4].split(" ")[0]
    lastName = user[5]
    phone = user[7].replace('-', '').replace(' ', '')

    if (user[6] == "AR"): 
        phone = "+549" + phone
    elif (user[6] == "CL"): 
        phone = "+569" + phone
    elif (user[6] == "UY"): 
        phone = "+5989" + phone
    elif (user[6] == "PE"): 
        phone = "+519" + phone
    elif (user[6] == "EC"): 
        phone = "+5939" + phone
    else:
        continue

    tasks = ""
    for task in resultTasks:
        tasks = tasks + "\n + " + task[3]

    # no hay nada para enviar al usuario
    if (tasks == ""):
        continue

    messageToSend = template_message.last_activity.format(firstName = firstName,lastName = lastName, phone = phone, tasks = tasks)
    url = config.api_endpoint + '/api/send'
    data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
    sendMessage = requests.post(url, json = data).json()
    
    if (sendMessage["error"]):
        print("Error al enviar el mensaje al usuario #" + str(user[0]))
    else:
        print("Mensaje enviado al usuario #" + str(user[0])) 
    
    # demoramos 1 segundo el proximo mensaje
    time.sleep(1)