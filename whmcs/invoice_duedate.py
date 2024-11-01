import config
import datetime
import time
import math
from decimal import Decimal
import template_message

# Get the current year
currentDate = datetime.datetime.now()
currentDate = currentDate.year

# Prepare the cursor to access the main database
access = config.db.cursor()

# Query to fetch unpaid invoices due today
sql = """
SELECT id, userid, DATE_FORMAT(duedate, '%e %M %Y'), total 
FROM tblinvoices 
WHERE status = 'Unpaid' AND duedate = CURDATE()
"""
access.execute(sql)
resultInvoices = access.fetchall()

# Prepare the cursor for WhatsApp database
whatsapp_access = config.db_whatsapp.cursor()

# Process each invoice
for invoice in resultInvoices:
    invoiceNumber = invoice[0]
    duedate = invoice[2]
    duetotal = Decimal(str(invoice[3]))  # Convert to Decimal for financial precision
    discountAmount = math.ceil(duetotal * Decimal('0.90'))  # Apply discount and round up

    # Query to fetch clients who are supposed to receive an invoice
    sql = """
    SELECT id, firstname, lastname, phonenumber, currency, groupid, defaultgateway 
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
        phone = client[3].replace('.', '9').replace('-', '').replace(' ', '')
        currency_code = client[4]
        currency = config.CURRENCY_CODES.get(currency_code, "ARS")  # "ARS" is the default value if the code is not found
        client_group = client[5]
        payment_option = client[6]

        # Check if the client is part of automatic debit
        if client_group == config.GRUPO_DEBITO_AUTOMATICO:
            messageToSend = template_message.invoice_auto_debit.format(
                firstName=firstName, 
                invoiceNumber=invoiceNumber, 
                duedate=duedate, 
                duetotal=duetotal, 
                currency=currency
            )
        else:
            if payment_option == "transferencia_bancaria":
                messageToSend = template_message.invoice_duedate_transferencia_bancaria.format(
                    firstName=firstName, 
                    invoiceNumber=invoiceNumber, 
                    duedate=duedate, 
                    duetotal=duetotal, 
                    discountAmount=discountAmount, 
                    currency=currency
                )
            else:
                messageToSend = template_message.invoice_duedate.format(
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
