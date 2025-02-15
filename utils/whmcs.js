const axios = require('axios');
const qs = require('qs');
const config = require('../config.json');

async function addTransaction(invoiceId, transactionId, amount, paymentMethod) {
    let result = false;

    const apiUrl = config.api.whmcs.url;

    if (!apiUrl) {
        console.error('The API URL is not configured in the config.json file');
        return;
    }

    const data = {
        action: 'AddTransaction',
        identifier: config.api.whmcs.identifier,
        secret: config.api.whmcs.secret,
        accesskey: config.api.whmcs.accesskey,
        invoiceid: invoiceId,
        description: 'Bot Payment',
        amountin: amount,
        paymentmethod: paymentMethod
    };

    if (!isNaN(transactionId)) {
        data.transid = transactionId;
    }

    try {
        const response = await axios.post(apiUrl, qs.stringify(data), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.status === 200) {
            console.log('AddTransaction API Response:', response.data);

            result = true;
        }
    } catch (error) {
        console.error('Error making request AddTransaction:', error);
    }

    return result;
}

async function addCancelRequest(serviceId) {
    let result = false;

    const apiUrl = config.api.whmcs.url;

    if (!apiUrl) {
        console.error('The API URL is not configured in the config.json file');
        return;
    }

    const data = {
        action: 'AddCancelRequest',
        identifier: config.api.whmcs.identifier,
        secret: config.api.whmcs.secret,
        accesskey: config.api.whmcs.accesskey,
        serviceid: serviceId,
        type: 'End of Billing Period'
    };

    try {
        const response = await axios.post(apiUrl, qs.stringify(data), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.status === 200) {
            console.log('AddCancelRequest API Response:', response.data);
            result = true;
        }
    } catch (error) {
        console.error('Error making request AddCancelRequest:', error);
    }

    return result;
}

module.exports = { addTransaction, addCancelRequest };