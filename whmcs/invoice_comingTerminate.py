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
    AND email_preferences LIKE '%invoice%:%1%' 
    AND groupid <> %s
    AND phonenumber <> '' 
    """, (invoice[1], config.GRUPO_DEBITO_AUTOMATICO))
    
    resultClients = access.fetchall()

    # Prepare the message for each client
    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        phone = client[3].replace('.', '9').replace('-', '').replace(' ', '')
        currency_code = client[4]
        currency = config.CURRENCY_CODES.get(currency_code, "ARS")  # "ARS" is the default value if the code is not found
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
        insert_sql = "INSERT INTO messages (phone, message) VALUES (%s, %s)"
        whatsapp_access.execute(insert_sql, (phone, messageToSend))
        config.db_whatsapp.commit()  # Commit the transaction

        print("Message saved in the WhatsApp database for user #" + str(clientId))

        # Wait 1 second before processing the next client
        time.sleep(1)

# Close the cursors
access.close()
whatsapp_access.close()