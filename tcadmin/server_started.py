import config
import datetime
import requests
import template_message
import json
import time

currentDate = datetime.datetime.now()
currentDate = currentDate.year

access = config.db.cursor()
# tcadmin guarda los datetime en utc
access.execute("SELECT tc_users.user_id, tc_users.first_name, tc_users.last_name, tc_users.country, tc_users.home_phone, tc_game_services.service_id, tc_game_services.ip_address, tc_game_services.game_port, tc_services.display_name, date_format(date_sub(tc_game_service_live_stats.start_time, INTERVAL 180 MINUTE), '%d %M %Y %k:%iHs.') AS start_time FROM tc_game_service_live_stats INNER JOIN tc_services ON tc_services.service_id = tc_game_service_live_stats.service_id INNER JOIN tc_game_services ON tc_game_services.service_id = tc_services.service_id INNER JOIN tc_users ON tc_users.user_id = tc_services.user_id WHERE tc_game_service_live_stats.start_time >= date_add(now(), INTERVAL 175 MINUTE) and tc_users.home_phone <> ''")
clients = access.fetchall()

for client in clients:   
    firstName = client[1].split(" ")[0]
    phone = client[4].replace('.', '9').replace('-', '').replace(' ', '')
    
    if (client[3] == "AR"): 
        phone = "+549" + phone
    elif (client[3] == "CL"): 
        phone = "+569" + phone
    elif (client[3] == "UY"): 
        phone = "+5989" + phone
    elif (client[3] == "PE"): 
        phone = "+519" + phone
    elif (client[3] == "EC"): 
        phone = "+5939" + phone
    else:
        continue

    service_id = client[5]
    ip_address = client[6]
    game_port = client[7]
    server_name = client[8]
    start_time = client[9]

    messageToSend = template_message.server_started.format(firstName = firstName, phone = phone, service_id = service_id, ip_address = ip_address, game_port = game_port, server_name = server_name, start_time = start_time)
    url = config.api_endpoint + '/api/send'
    data = {'phone': phone, 'message': messageToSend, 'token': config.api_token}
    sendMessage = requests.post(url, json = data).json()

    if (sendMessage["error"]):
        print("Error al enviar el mensaje al usuario #" + str(client[0]))
    else:
        print("Mensaje enviado al usuario #" + str(client[0])) 

    # demoramos 1 segundo el proximo mensaje
    time.sleep(1)