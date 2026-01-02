# Nombre: {firstName}
# Apellido: {lastName}
# Telefono: {phone}
# Nro Factura: {invoiceNumber}
# Fecha de vencimiento de la Factura: {duedate}
# Monto adeudado: {duetotal}

invoice_unpaid = """🤖 Se generó una nueva factura *#{invoiceNumber}*

Ingresá a https://clientes.4evergaming.com.ar/viewinvoice.php?id={invoiceNumber} y realizá un pago de *${duetotal} {currency}* antes del *{duedate}*
""" 

invoice_unpaid_transferencia_bancaria = """
🤖 Se generó una nueva factura *#{invoiceNumber}*

Pagá ahora y aprovecha un 10% de descuento por transferencia:
*TITULAR:* STEFANO FABI 
*CVU:* 0000003100090739102124 
*Alias:* 4evergaming 
*Monto (10% descuento):* ~${duetotal}~ ${discountAmount}

Por favor enviar el comprobante de la transferencia 🙏
""" 


invoice_paid = "🤖 La factura *#{invoiceNumber}* ha sido PAGADA ✅🙌" 

invoice_duedate = """🤖 La factura *#{invoiceNumber}* se encuentra vencida 😥

Para evitar la suspension del servicio, por favor iniciá sesión en https://clientes.4evergaming.com.ar/viewinvoice.php?id={invoiceNumber} y realizá un pago de *${duetotal} {currency}* antes del *{duedate}*
"""

invoice_duedate_transferencia_bancaria = """🤖 La factura *#{invoiceNumber}* se encuentra vencida 😥

Pagá ahora y aprovecha un 10% de descuento por transferencia:
*TITULAR:* STEFANO FABI
*CVU:* 0000003100090739102124
*Alias:* 4evergaming
*Monto (10% descuento):* ~${duetotal}~ ${discountAmount}

Por favor enviar el comprobante de la transferencia 🙏
"""

invoice_comingTerminate = """🤖 Atención 🚨🚨 la factura *#{invoiceNumber}* todavía se encuentra en estado *NO PAGADA*.
Para evitar la cancelación del servicio, por favor iniciá sesión en https://clientes.4evergaming.com.ar y realizá un pago de *${duetotal} {currency}* antes de *hoy*.
"""

invoice_comingTerminate_transferencia_bancaria = """🤖 Atención 🚨🚨 la factura *#{invoiceNumber}* todavía se encuentra en estado *NO PAGADA*.

Para evitar la cancelación del servicio pagá antes de *hoy*:
*TITULAR:* STEFANO FABI 
*CVU:* 0000003100090739102124 
*Alias:* 4evergaming 
*Monto (10% descuento):* ~${duetotal}~ ${discountAmount}

Por favor enviar el comprobante de la transferencia 🙏
"""

invoice_auto_debit = """🤖 Dentro de las próximas horas ⌛ se realizará el débito correspondiente de tu factura *#{invoiceNumber}*
Le solicitamos que por favor mantenga un saldo de *${duetotal} {currency}* para evitar inconvenientes 🙏
"""

order_pending = """Hola *{firstName}* 👋 He notado que generaste un pedido en nuestra tienda y no hiciste el pago correspondiente. \n
¿Hubo algún problema en el proceso de pago que no te permitió finalizarlo? 🤔 

Por favor, hacemelo saber para ayudarte y así poder ofrecerte el servicio que necesitás.
Estoy a tu disposición para cualquier consulta o duda que tengas. 

Saludos!
"""

client_area_login = """🤖 Nuevo inicio de sesión en Clientes

*Correo:* {email} 
*Fecha:* {lastlogin}
*IP:* {ip}
"""

service_comingTerminate = (
    "🤖 Hola {firstName},\n\n"
    "El servicio {domain} tiene una baja programada para el {suspendDate}.\n"
    "Por favor revisá tu cuenta para evitar la interrupción."
)
