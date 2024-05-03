
const axios = require('axios');



// Recuperation par page des reservations d'hotel via l'api de Ratehawk
const fetchBookingPerPage = async (postParam) => {
    let response = { data: null, error: null }
    try {
        const res = await axios.post(process.env.API_URL_GET_DATA, JSON.stringify(postParam), {
            headers: {
                'content-type': 'application/json'
            },
            auth: {
                username: process.env.API_USERNAME,
                password: process.env.API_PASSWORD
            }
        })
        console.log('response: => ' + res.data.status + '\n');
        response.data = res.data
        return response
    } catch (error) {
        console.log('error during api call => ' + error);
        response.error = error
        return response;
    }

}

module.exports = fetchBookingPerPage;