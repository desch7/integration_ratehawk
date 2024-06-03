require('dotenv').config({ path: '../env/.env' });
const http = require('http');
const verifyRequestOrigin = require('./util/verifiy_request_origin');
const getParametersApi = require('./database_traitement/api_call_parameters');
const cancelledOrder = require('./service/cancel_order');
const importationOrders = require('./service/insert_update_order')
const saveLog = require('./database_traitement/save_log_db')
const getDbParamsPartner = require('./database_traitement/admin/db_partner_params')
const tokenExistance = require('./redis_cache/token_existance')
const getDifferenceBetweenTimestamp = require('./util/diff_between_timestamp')



// Create a http server
const server = http.createServer((req, res) => {
    let statusCod = null
    let responseBody = { status: null, error: null };
    let dbLogError = '';
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
        req.on('end', async () => {
            let body = JSON.parse(reqBody)
            let apiParam = {}
            let diffMinutes = getDifferenceBetweenTimestamp(body.signature.timestamp, Date.now(), 'minutes');
            let noExistToken = await tokenExistance(body.signature.token)
            // check if token already exist
            if (noExistToken === 'ok' && diffMinutes <= process.env.DELAYS_MINUTES_WEBHOOK) {
                getDbParamsPartner(body.agreement_number).then(resPartner => {
                    // Collect api informations
                    getParametersApi(resPartner)
                        .then((apiParamRes) => {
                            apiParam = apiParamRes
                            // console.log('Received webhook:', body.signature.timestamp, '-', body.signature.token, '-', body.signature.signature, '-', body.type, '-', body.agreement_number, '-', body.partner_order_id);
                            //Check if there are data in webhook payload
                            if (body.signature.timestamp && body.signature.token && body.signature.signature && body.type && body.agreement_number && body.partner_order_id) {
                                // Check if the webhook notification is authenticated
                                if (verifyRequestOrigin(
                                    {
                                        apiKey: apiParam.api_username,
                                        timestamp: body.signature.timestamp,
                                        token: body.signature.token,
                                        signature: body.signature.signature
                                    })) {
                                    statusCod = 200
                                    responseBody.status = 'ok'
                                    if (body.type === 'cancelled') {
                                        // handle deletion of order
                                        cancelledOrder([{ pnr: body.partner_order_id }], resPartner)
                                    }
                                    if (body.type === 'created' || body.type === 'updated') {
                                        // handle creation or modification of order
                                        let partnerOrderIds = []
                                        partnerOrderIds.push(body.partner_order_id)
                                        importationOrders(apiParam, body.type, partnerOrderIds, resPartner)
                                    }
                                    res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                                    res.write(JSON.stringify(responseBody));
                                    res.end();
                                    return
                                } else {
                                    //Webservice response
                                    statusCod = 401
                                    responseBody.error = 'Webhook unidentified source'
                                    dbLogError = 'Webhook unidentified source'
                                    res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                                    res.write(JSON.stringify(responseBody));
                                    res.end();
                                    return
                                }

                            } else {
                                // Webservice response
                                statusCod = 500
                                responseBody.error = 'Some informations in payload of webhook are unavailable'
                                dbLogError = 'Some informations in payload of webhook are unavailable'
                                // sauvegarde de l'erreur en bd dans la table api_log
                                saveLog('KO_API', 'Webhook request', { error: dbLogError }, resPartner)
                                    .then((resLog) => {
                                        // Webservice response
                                        res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                                        res.write(JSON.stringify(responseBody));
                                        res.end();
                                        console.log('Webhook Log successfully save =>' + resLog);
                                        return
                                    }).catch(errLog2 => {
                                        console.log('Webhook saveLog error => ' + errLog2);
                                    });
                            }
                        })
                        .catch((errorAPI) => {
                            console.log('getParametersApi error => ' + JSON.stringify(errorAPI));
                            statusCod = 500
                            responseBody.error = 'Retry later'
                            res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                            res.write(JSON.stringify(responseBody));
                            res.end();
                            return
                        })
                }).catch(errPartner => {
                    console.log('connection to admin db failed: ' + JSON.stringify(errPartner));
                    statusCod = 500
                    responseBody.error = 'Retry later'
                    res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                    res.write(JSON.stringify(responseBody));
                    res.end();
                    return
                })
            } else {
                statusCod = 401
                responseBody.error = 'Webhook unidentified source'
                dbLogError = 'Webhook unidentified source'
                res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify(responseBody));
                res.end();
                return
            }



        });
    } else {
        // Webservice response
        responseBody.error = 'Endpoint not Found'
        statusCod = 404
        res.writeHead(statusCod, { 'Content-Type': 'application/json' })
        res.write(JSON.stringify(responseBody));
        res.end();
        return
    }
});

// Set the server to listen on a port
const PORT = process.env.PORT;
server.listen(PORT, () => {
    //console.log(`Server listening on port ${PORT}`);
});
