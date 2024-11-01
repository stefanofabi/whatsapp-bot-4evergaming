import config
import datetime
import time
import template_message

# Get the current year
currentDate = datetime.datetime.now()
currentDate = currentDate.year

# Prepare the cursor to access the main database
access = config.db.cursor()

# Query to fetch client details
sql = """
SELECT tc_users.user_id, tc_users.first_name, tc_users.last_name, tc_users.country, tc_users.home_phone, 
       tc_game_services.service_id, tc_game_services.ip_address, tc_game_services.game_port, 
       tc_services.display_name, DATE_FORMAT(DATE_SUB(tc_game_service_live_stats.start_time, INTERVAL 180 MINUTE), '%d %M %Y %k:%iHs.') AS start_time 
FROM tc_game_service_live_stats 
INNER JOIN tc_services ON tc_services.service_id = tc_game_service_live_stats.service_id 
INNER JOIN tc_game_services ON tc_game_services.service_id = tc_services.service_id 
INNER JOIN tc_users ON tc_users.user_id = tc_services.user_id 
WHERE tc_game_service_live_stats.start_time >= DATE_ADD(NOW(), INTERVAL 175 MINUTE) 
AND tc_users.home_phone <> ''
"""
access.execute(sql)
clients = access.fetchall()

# Prepare the cursor for WhatsApp database
whatsapp_access = config.db_whatsapp.cursor()

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

    # Prepare the message to send
    messageToSend = template_message.server_started.format(firstName=firstName, phone=phone, service_id=service_id, ip_address=ip_address, game_port=game_port, server_name=server_name, start_time=start_time)
    
    # Insert the message into the database
    insert_sql = "INSERT INTO messages (phone, message) VALUES (%s, %s)"
    whatsapp_access.execute(insert_sql, (phone, messageToSend))
    config.db_whatsapp.commit()  # Commit the transaction

    print("Message saved in the database for user #" + str(client[0])) 

    # Wait 1 second before processing the next message
    time.sleep(1)

# Close the cursor
access.close()