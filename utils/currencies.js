const { connect } = require('../databases/connection');

async function getCurrencies() {
    try {
        const db = await connect('whmcs');
        
        const query = `
            SELECT id, code, rate
            FROM tblcurrencies
        `;

        const [rows] = await db.execute(query);
        
        return rows;
    } catch (err) {
        console.error('Error al ejecutar la consulta:', err);
        throw err; 
    }
}

async function convertCurrency(userCurrencyCode, amount, paymentCurrency) {
    if (paymentCurrency !== userCurrencyCode) {
        const currencies = await getCurrencies();

        let currencyRates = {};
        currencies.forEach((currency) => {
            currencyRates[currency.code] = currency.rate;
        });

        if (!currencyRates[userCurrencyCode] || !currencyRates[paymentCurrency]) {
            throw new Error(`Código de moneda no encontrado en las tasas de cambio: ${userCurrencyCode} o ${paymentCurrency}`);
        }

        // Normalize to usd
        const usdConversionRate = currencyRates[userCurrencyCode];
        const amountInUsd = amount / usdConversionRate;

        // Convert to user currency code
        const userConversionRate = currencyRates[paymentCurrency];
        const convertedAmount = amountInUsd * userConversionRate;

        const finalAmount = Math.ceil(convertedAmount * 100) / 100;

        return finalAmount;
    }

    return amount;
}

module.exports = { convertCurrency };