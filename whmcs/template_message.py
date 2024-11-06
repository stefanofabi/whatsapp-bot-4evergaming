# Nombre: {firstName}
# Apellido: {lastName}
# Telefono: {phone}
# Nro Factura: {invoiceNumber}
# Fecha de vencimiento de la Factura: {duedate}
# Monto adeudado: {duetotal}

invoice_unpaid = """
🤖 Se generó una nueva factura *#{invoiceNumber}*.\n\n

Ingresá a https://clientes.4evergaming.com.ar/viewinvoice.php?id={invoiceNumber} y realizá un pago de *${duetotal} {currency}* antes del *{duedate}*.
""" 

invoice_unpaid_transferencia_bancaria = """
🤖 Se generó una nueva factura *#{invoiceNumber}*.\n\n

Pagá ahora y aprovecha un 10% de descuento por transferencia:\n
*TITULAR:* STEFANO FABI \n
*CVU:* 0000003100090739102124 \n
*Alias:* 4evergaming \n
*Monto (10% descuento):* ~${duetotal}~ ${discountAmount} \n\n

Por favor enviar el comprobante de la transferencia 🙏
""" 


invoice_paid = "🤖 La factura *#{invoiceNumber}* ha sido PAGADA ✅🙌" 

invoice_duedate = """
🤖 La factura *#{invoiceNumber}* se encuentra vencida 😥.\n\n

Para evitar la suspension del servicio, por favor iniciá sesión en https://clientes.4evergaming.com.ar/viewinvoice.php?id={invoiceNumber} y realizá un pago de *${duetotal} {currency}* antes del *{duedate}*. \n\n 
"""

invoice_duedate_transferencia_bancaria = """
🤖 La factura *#{invoiceNumber}* se encuentra vencida 😥.\n\n

Pagá ahora y aprovecha un 10% de descuento por transferencia:\n
*TITULAR:* STEFANO FABI\n
*CVU:* 0000003100090739102124\n
*Alias:* 4evergaming\n
*Monto (10% descuento):* ~${duetotal}~ ${discountAmount} \n\n

Por favor enviar el comprobante de la transferencia 🙏
"""

invoice_comingTerminate = """
🤖 Atención 🚨🚨 la factura *#{invoiceNumber}* todavía se encuentra en estado *NO PAGADA*. \n\n
Para evitar la cancelación del servicio, por favor iniciá sesión en https://clientes.4evergaming.com.ar y realizá un pago de *${duetotal} {currency}* antes de *hoy*.
"""

invoice_comingTerminate_transferencia_bancaria = """
🤖 Atención 🚨🚨 la factura *#{invoiceNumber}* todavía se encuentra en estado *NO PAGADA*. \n\n

Para evitar la cancelación del servicio pagá antes de *hoy*: \n
*TITULAR:* STEFANO FABI \n
*CVU:* 0000003100090739102124 \n
*Alias:* 4evergaming \n
*Monto (10% descuento):* ~${duetotal}~ ${discountAmount} \n\n

Por favor enviar el comprobante de la transferencia 🙏
"""

invoice_auto_debit = """
🤖 Dentro de las próximas horas ⌛ se realizará el débito correspondiente de tu factura *#{invoiceNumber}* \n
Le solicitamos que por favor mantenga un saldo de *${duetotal} {currency}* para evitar inconvenientes 🙏
"""
order_pending = """
Hola *{firstName}* 👋 He notado que generaste un pedido en nuestra tienda y no hiciste el pago correspondiente. \n
¿Hubo algún problema en el proceso de pago que no te permitió finalizarlo? 🤔 \n\n

Por favor, hacemelo saber para ayudarte y así poder ofrecerte el servicio que necesitás. \n
Estoy a tu disposición para cualquier consulta o duda que tengas. \n\n

Saludos!
"""

client_area_login = """
🤖 Nuevo inicio de sesión en el área de clientes \n\n

*Correo:* {email} \n
*Fecha:* {lastlogin}\n
*IP:* {ip}
"""

