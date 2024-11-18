import config
import datetime
import time
import template_message

# Get the current year
currentDate = datetime.datetime.now()
currentDate = currentDate.year

# Prepare the cursor to access the main database
access = config.db.cursor()

# Query to fetch paid invoices in the last 5 minutes
sql = """
SELECT id, userid 
FROM tblinvoices 
WHERE status = 'Paid' AND datepaid >= date_sub(now(), interval 5 minute)
"""
access.execute(sql)
resultInvoices = access.fetchall()

# Prepare the cursor for WhatsApp database
whatsapp_access = config.db_whatsapp.cursor()

# Process each invoice
for invoice in resultInvoices:
    invoiceNumber = invoice[0]

    # Query to fetch clients who are supposed to receive an invoice
    sql = """
    SELECT id, firstname, lastname, phonenumber, currency 
    FROM tblclients 
    WHERE id = %s and email_preferences like '%invoice%:%1%'
    AND phonenumber <> '' 
    """
    access.execute(sql, (invoice[1],))
    resultClients = access.fetchall()

    # Prepare the message for each client
    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        phone = config.formatNumber(client[3])

        # Create the message to send
        messageToSend = template_message.invoice_paid.format(firstName=firstName, invoiceNumber=invoiceNumber)

        # Insert the message into the `messages` table in the WhatsApp database
        insert_sql = "INSERT INTO messages (phone, message) VALUES (%s, %s)"
        whatsapp_access.execute(insert_sql, (phone, messageToSend))
        config.db_whatsapp.commit()  # Commit the transaction

        print("Message saved in the WhatsApp database for user #" + str(clientId))

        # Wait 1 second before processing the next client
        time.sleep(1)

# Close the cursors
access.close()
whatsapp_access.close()