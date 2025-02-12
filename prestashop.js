require('dotenv').config();
const axios = require('axios');
const xml2js = require('xml2js');

const API_KEY = process.env.PRESTASHOP_API_KEY;
const API_URL = process.env.PRESTASHOP_API_URL;

const getOrderStatus = async (orderId) => {
    try {
        console.log(`Fetching order status for order ID: ${orderId}`);
        console.log(`Using API URL: ${API_URL}`);
        const response = await axios.get(`${API_URL}/order_invoices/${orderId}`, {
            auth: {
                username: API_KEY,
                password: ''
            },
            headers: {
                'Accept': 'application/xml'
            }
        });

        console.log('API response:', response.data);

        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);

        if (result.prestashop && result.prestashop.order_invoice) {
            const order = result.prestashop.order_invoice[0];
            return {
                id: order.id[0],
                total_paid_tax_incl: order.total_paid_tax_incl[0],
                date_add: order.date_add[0]
            };
        } else {
            throw new Error('Order not found');
        }
    } catch (error) {
        console.error('Error fetching order status:', error.message);
        throw error;
    }
};

module.exports = { getOrderStatus };