import config
import requests
import template_message

access = config.db.cursor()
access.execute("SELECT * FROM tc_users where home_phone <> ''")
resultUsers = access.fetchall()
for user in resultUsers:
    # tcadmin guarda los datetime en utc
    sql = "SELECT task_id, display_name FROM tc_tasks WHERE last_run_time >= date_add(now(), INTERVAL 175 MINUTE) AND user_id = %s"
    access.execute(sql, (user[0],))
    resultTasks = access.fetchall()

    firstName = user[10].split(" ")[0]
    lastName = user[11]
    phone = user[19].replace('.', '9').replace('-', '').replace(' ', '')

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
        tasks = "[" + str(task[0]) + "] " + task[1] + "\n"

    if (tasks == ""):
        continue

    messageToSend = template_message.last_activity.format(firstName = firstName,lastName = lastName, phone = phone, tasks = tasks)
    url = config.api_endpoint + '/api/send'
    data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
    sendMessage = requests.post(url, json = data)

    print(sendMessage.text.encode("utf-8"))