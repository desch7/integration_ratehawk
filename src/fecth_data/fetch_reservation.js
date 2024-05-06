const axios = require('axios');



// Recuperation par page des reservations d'hotel via l'api de Ratehawk
const fetchBookingPerPage = async (postParam, apiParam) => {
    let response = { data: null, error: null }
    try {
        let res = await axios.post(String(apiParam.base_endpoint) + 'hotel/order/info/', JSON.stringify(postParam), {
            headers: {
                'content-type': 'application/json'
            },
            auth: {
                username: String(apiParam.api_username),
                password: String(apiParam.api_password)
            }
        })
        console.log('response: => ' + res.data.status + '\n');
        response.data = res.data
        return response
    } catch (error) {
        console.log('error during api call => ' + error);
        response.error = 'this is the' + error
        return response
    }

}

module.exports = fetchBookingPerPage;