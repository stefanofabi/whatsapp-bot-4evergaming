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
    AND phonenumber <> ''
    """, (userId, config.GRUPO_DEBITO_AUTOMATICO))

    resultClients = access.fetchall()

    for client in resultClients:
        clientId = client[0]
        firstName = client[1].split(" ")[0]
        phone = config.get_forwarded_number(config.formatNumber(client[2]))

        # Mensaje único
        messageToSend = template_message.service_comingTerminate.format(
            firstName=firstName,
            domain=domain,
            suspendDate=suspendDate
        )

        # Guardar mensaje en WhatsApp
        insert_sql = "INSERT INTO messages (phone, message) VALUES (%s, %s)"
        whatsapp_access.execute(insert_sql, (phone, messageToSend))
        config.db_whatsapp.commit()

        print(f"Mensaje guardado para cliente #{clientId} – {domain}")

        time.sleep(1)

# Cerrar cursores
access.close()
whatsapp_access.close()