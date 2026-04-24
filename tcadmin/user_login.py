import config
import datetime
import time
import template_message

# Get the current year
currentDate = datetime.datetime.now()
currentDate = currentDate.year

# Prepare the cursor to access the main database
access = config.db.cursor()

# Query to fetch user login details
sql = """
SELECT user_id, user_name, DATE_FORMAT(DATE_SUB(last_login, INTERVAL 180 MINUTE), '%d %M %Y %k:%iHs.') AS last_login, 
       last_login_ip, first_name, last_name, country, billing_id 
FROM tc_users 
WHERE last_login >= DATE_ADD(NOW(), INTERVAL 175 MINUTE)
AND billing_id <> '' 
"""
access.execute(sql)
clients = access.fetchall()

# Prepare the cursor for WhatsApp database
whatsapp_access = config.db_whatsapp.cursor()

for x in clients:   
    username = x[1]
    firstName = x[4].split(" ")[0]
    lastName = x[5]
    chats = config.get_forwarded_numbers(x[7])

    lastLogin = x[2]
    ip = x[3]

    # Prepare the message to send
    messageToSend = template_message.user_login.format(firstName=firstName, lastName=lastName, lastlogin=lastLogin, ip=ip, username=username)

    # Insert the message into the WhatsApp database
    for chat in chats:
        insert_sql = "INSERT INTO messages (chat, message) VALUES (%s, %s)"
        whatsapp_access.execute(insert_sql, (chat, messageToSend))
        config.db_whatsapp.commit()

        print(f"Message saved for user #{x[0]} -> {chat}")

        # Wait 1 second before processing the next client
        time.sleep(1)

# Close the cursors
access.close()
whatsapp_access.close()