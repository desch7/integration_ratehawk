require("dotenv").config();
const http = require('http');
const verifyRequestOrigin = require('./util/verifiy_request_origin');
const getParametersApi = require('./database_traitement/api_call_parameters');
const cancelledOrder = require('./service/cancel_order');
const importationOrders = require('./service/insert_update_order')


// Create a http server
const server = http.createServer((req, res) => {
    let statusCod = null
    let responseBody = { status: null, error: null };
    if (req.method === 'POST' && req.url === '/ab/hotel/ratehawk') {
        let reqBody = '';

        // Handle potential error
        req.on('error', err => {
            console.error(err.stack);
        });

        // Accumulate the request body
        req.on('data', chunk => {
            reqBody += chunk.toString();
        });

        // Handle incoming webhook data
        req.on('end', () => {
            let body = JSON.parse(reqBody)
            let apiParam = {}
            // Collect api informations
            getParametersApi()
                .then((apiParamRes) => {
                    apiParam = apiParamRes
                    // console.log('Received webhook:', body.signature.timestamp, '-', body.signature.token, '-', body.signature.signature, '-', body.type, '-', body.agreement_number, '-', body.partner_order_id);
                    // Check if there are data in webhook payload
                    if (body.signature.timestamp && body.signature.token && body.signature.signature && body.type && body.agreement_number && body.partner_order_id) {
                        // Check if the webhook notification is authenticated
                        // if (verifyRequestOrigin(
                        //     {
                        //         apiKey: apiParam.api_username,
                        //         timestamp: body.signature.timestamp,
                        //         token: body.signature.token,
                        //         signature: body.signature.signature
                        //     })) {
                        statusCod = 200
                        responseBody.status = 'ok'
                        if (body.type === 'cancelled') {
                            // handle deletion of order
                            cancelledOrder([{ pnr: body.partner_order_id }])
                        }
                        if (body.type === 'created' || body.type === 'updated') {
                            // handle creation or modification of order
                            let partnerOrderIds = []
                            partnerOrderIds.push(body.partner_order_id)
                            importationOrders(apiParam, body.type, partnerOrderIds)
                        }
                        // } else {
                        //     statusCod = 401
                        //     responseBody.error = 'Unidentified source'
                        // }

                    } else {
                        statusCod = 500
                        responseBody.error = 'Some informations in payload are unavailable'
                    }
                    // Webservice response
                    res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                    res.write(JSON.stringify(responseBody));
                    res.end();



                })
                .catch((error) => {
                    statusCod = 500
                    responseBody.error = 'Retry later'
                    console.log(error.db_connectionErr);
                    res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                    res.write(JSON.stringify(responseBody));
                    res.end();
                })

        });
    } else {
        // Webservice response
        responseBody.error = 'Endpoint not Found'
        statusCod = 404
        res.writeHead(statusCod, { 'Content-Type': 'application/json' })
        res.write(JSON.stringify(responseBody));
        res.end();
    }
});

// Set the server to listen on a port
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    //console.log(`Server listening on port ${PORT}`);
});
