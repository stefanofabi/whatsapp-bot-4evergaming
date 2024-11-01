const help_commands_text = `
🤖 Los comandos disponibles son:
*!estado*: Muestra si estoy en línea.
*!facturas*: Muestra tus facturas pendientes.
*!factura <id>*: Muestra los detalles de la factura con el ID especificado.
*!servicios*: Muestra tus servicios activos.
*!vencimiento <días>*: Muestra los próximos vencimientos
`;

function getHelpCommands(userPhone, client) {
    client.sendMessage(userPhone + "@c.us", help_commands_text)
    .then(response => {
        console.log(`[200] Message sent to  ${userPhone}`);
    })
    .catch(error => {
        console.error(`[500] Error sending message to ${userPhone}:`, error);
    });
}

module.exports = { getHelpCommands };