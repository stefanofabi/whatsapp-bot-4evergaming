const { connect } = require('../databases/connection');
const { sendMessage } = require('../utils/messages');
const mysql = require('mysql2/promise');

async function activeAllSensors(chatId, client) {
    const webDb = await connect('web');

    try {
        const [nodes] = await webDb.execute(
            'SELECT name, mysql_connection, user_mysql, password_mysql FROM nodes WHERE enable_monitor = 1'
        );

        if (!nodes || nodes.length === 0) {
            await sendMessage(client, chatId, '🤖 No se encontraron nodos configurados.');
            await webDb.end();
            return;
        }

        let totalUpdated = 0;
        const perNodeResults = [];

        for (const node of nodes) {
            const nodeName = node.name;
            const host = `${node.mysql_connection}.4evergaming.com.ar`; 
            const user = node.user_mysql;
            const password = node.password_mysql;
            const database = 'system_monitoring';

            let nodeConn;
            try {
                nodeConn = await mysql.createConnection({
                    host,
                    user,
                    password,
                    database,
                    connectTimeout: 10000
                });

                // Only activate sensors that are currently deactivated
                const [result] = await nodeConn.execute('UPDATE sensors SET active = 1 WHERE active = 0');

                const updated = result?.affectedRows || 0;

                if (updated > 0) {
                    totalUpdated += updated;
                    perNodeResults.push({ nodeName, updated, ok: true });
                }

                await nodeConn.end();
            } catch (errNode) {
                perNodeResults.push({ nodeName, error: errNode.message, ok: false });
                if (nodeConn && nodeConn.end) {
                    try { await nodeConn.end(); } catch (e) { /* ignore */ }
                }
            }
        }

        let message = `🤖 Actualización completada.\nTotal sensores activados: ${totalUpdated}`;

        const successfulNodes = perNodeResults.filter(r => r.ok);
        const failedNodes = perNodeResults.filter(r => !r.ok);

        if (successfulNodes.length > 0) {
            message += `\n\n🟢 Nodos con sensores activados:\n`;
            for (const r of successfulNodes) {
                message += `• ${r.nodeName}: ${r.updated} sensores activados\n`;
            }
        }

        if (failedNodes.length > 0) {
            message += `\n🔴 Errores en los siguientes nodos:\n`;
            for (const r of failedNodes) {
                message += `• ${r.nodeName}: error -> ${r.error}\n`;
            }
        }

        if (totalUpdated === 0 && failedNodes.length === 0) {
            message += `\n\n⚠️ No se activó ningún sensor porque todos ya estaban activos.`;
        }

        await sendMessage(client, chatId, message);
        console.log(`[200] Sensores activados: ${totalUpdated}`, perNodeResults);
    } catch (err) {
        console.error('Error accediendo a tabla nodes o procesando nodos:', err);
        await sendMessage(client, chatId, '🤖 Ocurrió un error al intentar activar los sensores en los nodos.');
    } finally {
        await webDb.end();
    }
}

module.exports = {
    activeAllSensors
};
