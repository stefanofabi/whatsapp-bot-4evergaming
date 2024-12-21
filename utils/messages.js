async function sendMessage(client, userPhone, message) {
    try {
        await client.sendMessage(userPhone, message);
        console.log(`[200] Message sent to ${userPhone}`);
    } catch (err) {
        console.error('Error sending message:', err);
    }
}

module.exports = { sendMessage };