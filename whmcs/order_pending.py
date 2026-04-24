import config
import datetime
import time
import template_message

# Get the current year
currentDate = datetime.datetime.now()
currentDate = currentDate.year

# Prepare the cursor to access the main database
access = config.db.cursor()

# Query to fetch pending orders with unpaid invoices from yesterday
sql = """
SELECT tblorders.* 
FROM tblorders 
INNER JOIN tblinvoices ON tblorders.invoiceid = tblinvoices.id 
WHERE tblorders.status = 'Pending' AND 
tblinvoices.status = 'Unpaid' AND 
DATE_FORMAT(tblorders.date, '%Y-%m-%d') = DATE_FORMAT(date_sub(now(), INTERVAL 1 day), '%Y-%m-%d')
"""
access.execute(sql)
resultOrders = access.fetchall()

# Prepare the cursor for WhatsApp database
whatsapp_access = config.db_whatsapp.cursor()

# Process each pending order
for order in resultOrders:
    # Query to fetch clients related to the order
    sql = """
    SELECT id, firstname, lastname, phonenumber 
    FROM tblclients 
    WHERE id = %s
    """
    access.execute(sql, (order[2],))
    resultClients = access.fetchall()

    # Prepare the message for each client
    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        chats = config.get_forwarded_numbers(client[0])

        # Prepare the message to send
        messageToSend = template_message.order_pending.format(firstName=firstName)

        # Insert the message into the `messages` table in the WhatsApp database
        for chat in chats:
            insert_sql = "INSERT INTO messages (chat, message) VALUES (%s, %s)"
            whatsapp_access.execute(insert_sql, (chat, messageToSend))
            config.db_whatsapp.commit()

            print(f"Message saved for user #{client[0]} -> {chat}")

            # Wait 1 second before processing the next client
            time.sleep(1)

# Close the cursors
access.close()
whatsapp_access.close()