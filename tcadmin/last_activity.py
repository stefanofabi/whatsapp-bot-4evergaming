import config
import requests
import template_message

access = config.db.cursor()
access.execute("SELECT * FROM tc_users")
resultUsers = access.fetchall()
for user in resultUsers:
    sql = "SELECT * FROM tc_tasks WHERE last_run_time >= date_sub(now(), INTERVAL 5 MINUTE) AND user_id = %s"
    access.execute(sql, (user[0],))
    resultTasks = access.fetchall()

    firstName = user[10].split(" ")[0]
    lastName = user[11]
    phone = user[19].replace('.', '9').replace('-', '').replace(' ', '')

    if phone == "":
        continue

    if (user[17] == "AR"): 
        phone = "+549" + phone
    elif (user[17] == "CL"): 
        phone = "+569" + phone
    elif (user[17] == "UY"): 
        phone = "+5989" + phone
    elif (user[17] == "PE"): 
        phone = "+519" + phone
    elif (user[17] == "EC"): 
        phone = "+5939" + phone
    else:
        continue
    
    tasks = ""
    for task in resultTasks:
        tasks = "[" + str(task[0]) + "] " + task[3] + "\n"

    if (tasks == ""):
        continue

    messageToSend = template_message.last_activity.format(firstName = firstName,lastName = lastName, phone = phone, tasks = tasks)
    url = config.api_endpoint + '/api/send'
    data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
    sendMessage = requests.post(url, json = data)

    print(sendMessage.text.encode("utf-8"))