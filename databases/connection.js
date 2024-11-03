const mysql = require('mysql2/promise');
const config = require('../config.json');

// Configure the connection to the WHMCS database
async function connect(database) {
    let connection;

    try {
        switch(database) {
            case 'whmcs': {
                connection = await mysql.createConnection({
                    host: config.databases.whmcs.host,
                    user: config.databases.whmcs.user,
                    password: config.databases.whmcs.password,
                    database: config.databases.whmcs.database
                });

                break;
            }

            case 'tcadmin': {
                connection = await mysql.createConnection({
                    host: config.databases.tcadmin.host,
                    user: config.databases.tcadmin.user,
                    password: config.databases.tcadmin.password,
                    database: config.databases.tcadmin.database
                });

                break;
            }

            case 'whatsapp': {
                connection = await mysql.createConnection({
                    host: config.databases.whatsapp.host,
                    user: config.databases.whatsapp.user,
                    password: config.databases.whatsapp.password,
                    database: config.databases.whatsapp.database
                });

                break;
            }
        }

        return connection;
    } catch (error) {
        console.error('Error connecting to MySQL:', error);

        throw error;
    }
}

module.exports = { connect };
