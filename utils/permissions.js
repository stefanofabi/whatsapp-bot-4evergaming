const config = require('../config.json');

function isAdmin(message) {
    if (message.fromMe)
        return true;

    if (message.from.endsWith('@g.us')) {
        return config.admins.includes(message.author)
    }

    return config.admins.includes(message.from);
}

module.exports = {
    isAdmin
};