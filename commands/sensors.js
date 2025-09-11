const { connect } = require('../databases/connection');
const { sendMessage } = require('../utils/messages');
const mysql = require('mysql2/promise');

async function activeAllSensors(userPhone, client) {
    const webDb = await connect('web');

    try {
        const [nodes] = await webDb.execute(
            'SELECT name, mysql_connection, user_mysql, password_mysql FROM nodes WHERE enable_monitor = 1'
        );

        if (!nodes || nodes.length === 0) {
            await sendMessage(client, userPhone, '🤖 No se encontraron nodos configurados.');
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

                const [result] = await nodeConn.execute('UPDATE sensors SET active = 1');

                const updated = result?.affectedRows || 0;
                totalUpdated += updated;
                perNodeResults.push({ nodeName, updated, ok: true });

                await nodeConn.end();
            } catch (errNode) {
                perNodeResults.push({ nodeName, error: errNode.message, ok: false });
                if (nodeConn && nodeConn.end) {
                    try { await nodeConn.end(); } catch (e) { /* ignore */ }
                }
            }
        }

        let message = `🤖 Actualización completada.\nTotal sensores activados: ${totalUpdated}\n\nDetalle por nodo:\n`;
        for (const r of perNodeResults) {
            if (r.ok) {
                message += `• ${r.nodeName}: ${r.updated} sensores activados\n`;
            } else {
                message += `• ${r.nodeName}: error -> ${r.error}\n`;
            }
        }

        await sendMessage(client, userPhone, message);
        console.log(`[200] Sensores activados: ${totalUpdated}`, perNodeResults);
    } catch (err) {
        console.error('Error accediendo a tabla nodes o procesando nodos:', err);
        await sendMessage(client, userPhone, '🤖 Ocurrió un error al intentar activar los sensores en los nodos.');
    } finally {
        await webDb.end();
    }
}

module.exports = {
    activeAllSensors
};