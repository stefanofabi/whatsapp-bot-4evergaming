import config
import template_message
from datetime import date, timedelta
import math
from decimal import Decimal
import time
import template_message

# Get the number of days for auto termination configuration
access = config.db.cursor()
access.execute("SELECT value FROM tblconfiguration WHERE setting = 'AutoTerminationDays'")
terminateConf = access.fetchall()
dayBeforeTerminate = 1

# Calculate the termination date
today = date.today()
terminateDate = [today - timedelta(days=int(terminateConf[0][0]) - int(dayBeforeTerminate))]

# Query to get unpaid invoices with the calculated due date
access.execute("""
SELECT id, userid, DATE_FORMAT(duedate, '%e %M %Y'), total 
FROM tblinvoices 
WHERE status = 'Unpaid' AND duedate = %s
""", terminateDate)
resultInvoices = access.fetchall()

# Prepare cursor for WhatsApp database
whatsapp_access = config.db_whatsapp.cursor()

# Process each invoice
for invoice in resultInvoices:
    invoiceNumber = invoice[0]
    duedate = invoice[2]
    duetotal = invoice[3]
    discountAmount = math.ceil(invoice[3] * Decimal('0.90'))

    # Query to get clients associated with the unpaid invoice
    access.execute("""
    SELECT id, firstname, lastname, phonenumber, currency, groupid, defaultgateway 
    FROM tblclients 
    WHERE id = %s 
    AND groupid <> %s
    """, (invoice[1], config.GRUPO_DEBITO_AUTOMATICO))
    
    resultClients = access.fetchall()

    # Prepare the message for each client
    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        chats = config.get_forwarded_numbers(client[0])
        currency_code = client[4]
        currency = config.CURRENCY_CODES.get(str(currency_code), "ARS")  # "ARS" is the default value if the code is not found
        payment_option = client[6]

        # Use the existing templates for the messages
        if payment_option == "transferencia_bancaria":
            messageToSend = template_message.invoice_comingTerminate_transferencia_bancaria.format(
                firstName=firstName, 
                invoiceNumber=invoiceNumber, 
                duedate=duedate, 
                duetotal=duetotal, 
                discountAmount=discountAmount, 
                currency=currency
            )
        else:
            messageToSend = template_message.invoice_comingTerminate.format(
                firstName=firstName, 
                invoiceNumber=invoiceNumber, 
                duedate=duedate, 
                duetotal=duetotal, 
                discountAmount=discountAmount, 
                currency=currency
            )

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