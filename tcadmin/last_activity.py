import config
import time
import template_message

# Prepare the cursor to access the main database
access = config.db.cursor()

# Query to fetch users with a phone number
sql = """
SELECT user_id, user_name, DATE_FORMAT(DATE_SUB(last_login, INTERVAL 180 MINUTE), 
'%d %M %Y %k:%i') AS last_login, last_login_ip, first_name, last_name, country, home_phone 
FROM tc_users 
WHERE home_phone <> ''
"""
access.execute(sql)
resultUsers = access.fetchall()

# Prepare the cursor for WhatsApp database
whatsapp_access = config.db_whatsapp.cursor()

for user in resultUsers:
    # tcadmin stores datetime in UTC
    sql = """
    SELECT * 
    FROM tc_tasks 
    WHERE last_run_time >= DATE_ADD(NOW(), INTERVAL 115 MINUTE) AND 
    status = 3 AND 
    user_id = %s 
    """
    access.execute(sql, (user[0],))
    resultTasks = access.fetchall()

    firstName = user[4].split(" ")[0]
    lastName = user[5]
    phone = user[7].replace('-', '').replace(' ', '')

    if (user[6] == "AR"): 
        phone = "+549" + phone
    elif (user[6] == "CL"): 
        phone = "+56" + phone
    elif (user[6] == "UY"): 
        phone = "+598" + phone
    elif (user[6] == "PE"): 
        phone = "+51" + phone
    elif (user[6] == "EC"): 
        phone = "+593" + phone
    else:
        continue

    tasks = ""
    first_task = True

    for task in resultTasks:
        if first_task:
            tasks = "+ " + task[3]
            first_task = False
        else:
            tasks += "\n + " + task[3]

    # No tasks to send to the user
    if (tasks == ""):
        continue

    messageToSend = template_message.last_activity.format(tasks=tasks)

    # Insert the message into the database
    insert_sql = "INSERT INTO messages (phone, message) VALUES (%s, %s)"
    whatsapp_access.execute(insert_sql, (phone + "@c.us", messageToSend))
    config.db_whatsapp.commit()  # Commit the transaction

    print("Message saved in the database for user #" + str(user[0]))

    # Wait 1 second before processing the next user
    time.sleep(1)

# Close the cursor
access.close()
