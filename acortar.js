const axios = require('axios');

const BITLY_ACCESS_TOKEN = process.env.BITLY_API_KEY;

const shortenUrl = async (longUrl) => {
    try {
        const response = await axios.post('https://api-ssl.bitly.com/v4/shorten', {
            long_url: longUrl
        }, {
            headers: {
                'Authorization': `Bearer ${BITLY_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                "group_guid": "ventasdaytona"
            }
        });

        return response.data.link;
    } catch (error) {
        console.error('Error acortando la URL:', error.message);
        throw error;
    }
};

module.exports = { shortenUrl };