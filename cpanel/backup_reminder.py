import config
import time
import template_message

# Prepare the cursor to access the main database
access = config.db.cursor()

# Query to fetch hosting accounts with certain domains and status
sql = """
SELECT h.userid, h.domain, c.firstname, c.lastname, c.phonenumber
FROM tblhosting h
JOIN tblclients c ON c.id = h.userid
WHERE 
    (h.domain LIKE '%.com' 
     OR h.domain LIKE '%.net' 
     OR h.domain LIKE '%.com.ar' 
     OR h.domain LIKE '%.ar')
    AND h.domainstatus IN ('Active', 'Suspended')
    AND c.phonenumber <> ''
GROUP BY h.userid, h.domain, c.firstname, c.lastname, c.phonenumber
"""
access.execute(sql)
resultHosting = access.fetchall()

# Prepare the cursor for WhatsApp database
whatsapp_access = config.db_whatsapp.cursor()

# Process each hosting account
for hosting in resultHosting:
    userId = hosting[0]
    domain = hosting[1]
    firstName = hosting[2].split(" ")[0] 
    phone = config.formatNumber(hosting[4]) 

    # Prepare the backup reminder message
    messageToSend = template_message.backup_reminder.format(
        firstName=firstName,
        domain=domain
    )

    # Insert the message into the `messages` table in WhatsApp DB
    insert_sql = "INSERT INTO messages (phone, message) VALUES (%s, %s)"
    whatsapp_access.execute(insert_sql, (phone + "@c.us", messageToSend))
    config.db_whatsapp.commit()

    print(f"Backup reminder saved in WhatsApp DB for user #{userId}, domain {domain}")

    # Wait 1 second before processing the next client
    time.sleep(1)

# Close cursors
access.close()
whatsapp_access.close()
