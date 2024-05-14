require("dotenv").config();
const http = require('http');
const verifyRequestOrigin = require('./util/verifiy_request_origin');
const getParametersApi = require('./database_traitement/api_call_parameters');
const cancelledOrder = require('./service/cancel_order');
const importationOrders = require('./service/insert_update_order')


// Create a http server
const server = http.createServer((req, res) => {
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
            console.log('Received webhook:', body);
            // Collect api informations
            getParametersApi()
                .then((apiParamRes) => {
                    apiParam = apiParamRes
                    if (verifyRequestOrigin(
                        {
                            apiKey: apiParam.api_username,
                            timestamp: body.signature.timestamp,
                            token: body.signature.token,
                            signature: body.signature.signature
                        })) {
                        if (body.type === 'cancelled') {
                            // handle deletion of order
                            cancelledOrder(JSON.stringify([{ pnr: body.partner_order_id }]))
                        }
                        if (body.type === 'created' || body.type === 'updated') {
                            // handle creation or modification of order
                            let partnerOrderIds = [].push(body.partner_order_id)
                            importationOrders(apiParam, body.type, partnerOrderIds)
                        }
                    } else {
                        if (body.type === 'created' || body.type === 'updated') {
                            // handle creation of order
                            let partnerOrderIds = []
                            partnerOrderIds.push(body.partner_order_id)
                            importationOrders(apiParam, body.type, partnerOrderIds)
                        }
                    }
                })
                .catch((error) => {
                    console.log(' error connection db ' + error.db_connectionErr);
                })
            res.writeHead(200, { 'Content-Type': 'application/json' })
            const responseBody = { retour: 'ok' };
            res.write(JSON.stringify(responseBody));
            res.end();
        });
    } else {
        res.status(404);
        res.end('Not Found');
    }
});

// Set the server to listen on a port
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
