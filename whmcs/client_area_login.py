import config
import datetime
import template_message
import time

# Get the current year
currentDate = datetime.datetime.now().year

# Connect to the first database
access = config.db.cursor()
sql = """
SELECT tblusers.id AS USER_id, tblusers.email, tblusers.last_ip, 
tblclients.id AS client_id, tblclients.firstname, tblclients.lastname, phonenumber, 
date_format(tblusers_clients.last_login, '%d %M %Y %k:%iHs.') as last_login 
FROM tblusers 
INNER JOIN tblusers_clients ON tblusers.id = tblusers_clients.auth_user_id 
INNER JOIN tblclients ON tblusers_clients.client_id = tblclients.id 
WHERE tblusers_clients.last_login >= date_sub(now(), INTERVAL 5 minute) 
and email_preferences like '%general%:%1%'
and tblclients.phonenumber <> '' 
"""

# Execute the query to fetch users
access.execute(sql)
clients = access.fetchall()

# Prepare the connection to the second database
whatsapp_access = config.db_whatsapp.cursor()

# Prepare the data for each client and save the message in the second database
for client in clients:   
    firstName = client[4].split(" ")[0]  # Get the first name
    email = client[1]                     # Get the email
    phone = client[6].replace('.', '9').replace('-', '').replace(' ', '')  # Clean phone number
    lastlogin = client[7]                 # Get last login date
    ip = client[2]                        # Get last IP address

    # Use the existing template for the message
    messageToSend = template_message.client_area_login.format(firstName=firstName, email=email, lastlogin=lastlogin, ip=ip)

    # Insert the message into the `messages` table in the second database
    insert_sql = "INSERT INTO messages (phone, message) VALUES (%s, %s)"
    whatsapp_access.execute(insert_sql, (phone, messageToSend))
    config.db_whatsapp.commit()  # Commit the transaction

    print("Message saved in the WhatsApp database for user #" + str(client[0]))

    # Wait 1 second before processing the next client
    time.sleep(1)

# Close the cursors
access.close()
whatsapp_access.close()
