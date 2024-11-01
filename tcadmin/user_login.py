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
       last_login_ip, first_name, last_name, country, home_phone 
FROM tc_users 
WHERE last_login >= DATE_ADD(NOW(), INTERVAL 175 MINUTE)
AND home_phone <> '' 
"""
access.execute(sql)
clients = access.fetchall()

# Prepare the cursor for WhatsApp database
whatsapp_access = config.db_whatsapp.cursor()

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
    
    lastLogin = x[2]
    ip = x[3]

    # Prepare the message to send
    messageToSend = template_message.user_login.format(firstName=firstName, lastName=lastName, phone=phone, lastlogin=lastLogin, ip=ip, username=username)

    # Insert the message into the WhatsApp database
    insert_sql = "INSERT INTO messages (phone, message) VALUES (%s, %s)"
    whatsapp_access.execute(insert_sql, (phone, messageToSend))
    config.db_whatsapp.commit()  # Commit the transaction

    print("Message saved in the WhatsApp database for user #" + str(x[0])) 

    # Wait 1 second before processing the next message
    time.sleep(1)

# Close the cursors
access.close()
whatsapp_access.close()