const { sendMessage } = require('../utils/messages');

const help_commands_text = `🤖 Los comandos disponibles son: 

Para consultar por tus servicios:
*!servicios*: Muestra el detalle de los servicios activos
*!vencimiento <días>*: Muestra los próximos vencimientos
*!total*: Calcula la suma total de todos los servicios contratados
*!baja*: Solicita la baja de uno de tus servicios

Para consultar temas de facturación:
*!facturas*: Muestra tus facturas pendientes
*!factura <id>*: Muestra los detalles de la factura
*!detallefactura <id>*: Muestra los items de una factura
*!deuda*: Calcula la deuda de la cuenta cliente 

Para realizar pagos:
*!transferencia <factura>*: Pagar factura mediante cbu, cvu o alias
*!mercadopago <factura>*: Pagar factura con dinero disponible en MercadoPago
*!uala <factura>*: Pagar factura con la App de Ualá
*!tarjeta <factura>*: Pagar factura con tarjeta de credito, debito o pago facil
`;

async function getHelpCommands(chatId, client) {
    try {
        await sendMessage(client, chatId, help_commands_text);
        console.log(`[200] Message sent to ${chatId}`);
    } catch (error) {
        console.error(`[500] Error sending message to ${chatId}:`, error);
    }
}

module.exports = { getHelpCommands };
