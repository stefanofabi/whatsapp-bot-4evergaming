import config
import time
import template_message

# Prepare the cursor to access the main database
access = config.db.cursor()

# Query to fetch users with a phone number
sql = """
SELECT user_id, user_name, DATE_FORMAT(DATE_SUB(last_login, INTERVAL 180 MINUTE), 
'%d %M %Y %k:%i') AS last_login, last_login_ip, first_name, last_name, country, billing_id 
FROM tc_users 
WHERE billing_id <> ''
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

    chats = config.get_forwarded_numbers(user[7])

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
    for chat in chats:
        insert_sql = "INSERT INTO messages (chat, message) VALUES (%s, %s)"
        whatsapp_access.execute(insert_sql, (chat, messageToSend))
        config.db_whatsapp.commit()

        print(f"Message saved for user #{user[0]} -> {chat}")

        # Wait 1 second before processing the next client
        time.sleep(1)

# Close the cursor
access.close()
