import config
import template_message
import time

# Cursor principal
access = config.db.cursor()

# Obtener servicios con suspensión programada
access.execute("""
SELECT id, userid, domain, DATE_FORMAT(overidesuspenduntil, '%e %M %Y')
FROM tblhosting
WHERE overideautosuspend = 1
AND overidesuspenduntil BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY)
""")

resultServices = access.fetchall()

# Cursor WhatsApp
whatsapp_access = config.db_whatsapp.cursor()

# Procesar cada servicio
for service in resultServices:
    serviceId = service[0]
    userId = service[1]
    domain = service[2]
    suspendDate = service[3]

    # Obtener datos del cliente
    access.execute("""
    SELECT id, firstname, phonenumber, groupid
    FROM tblclients
    WHERE id = %s
    AND groupid <> %s
    """, (userId, config.GRUPO_DEBITO_AUTOMATICO))

    resultClients = access.fetchall()

    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        chats = config.get_forwarded_numbers(client[0])

        # Use the existing template for the message
        messageToSend = template_message.service_comingTerminate.format(
            firstName=firstName,
            domain=domain,
            suspendDate=suspendDate
        )

        # Insert the message into the `messages` table in the second database
        for chat in chats:
            insert_sql = "INSERT INTO messages (chat, message) VALUES (%s, %s)"
            whatsapp_access.execute(insert_sql, (chat, messageToSend))
            config.db_whatsapp.commit()
            
            print(f"Message saved for user #{client[0]} -> {chat}")

            # Wait 1 second before processing the next client
            time.sleep(1)

# Cerrar cursores
access.close()
whatsapp_access.close()