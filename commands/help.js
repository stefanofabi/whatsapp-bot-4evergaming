const help_commands_text = `
🤖 Los comandos disponibles son:
*!estado*: Muestra si estoy en línea.
*!facturas*: Muestra tus facturas pendientes.
*!factura <id>*: Muestra los detalles de la factura
*!servicios*: Muestra tus servicios activos.
*!vencimiento <días>*: Muestra los próximos vencimientos
*!transferencia <factura>*: Pagar factura mediante cbu, cvu o alias
*!mercadopago <factura>*: Pagar factura con dinero disponible en MercadoPago
*!uala <factura>*: Pagar factura con la App de Ualá
*!tarjeta <factura>*: Pagar factura con tarjeta de credito, debito o pago facil
`;

async function getHelpCommands(userPhone, client) {
    await client.sendMessage(userPhone + "@c.us", help_commands_text)
    .then(response => {
        console.log(`[200] Message sent to  ${userPhone}`);
    })
    .catch(error => {
        console.error(`[500] Error sending message to ${userPhone}:`, error);
    });
}

module.exports = { getHelpCommands };