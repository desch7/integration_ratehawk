require('dotenv').config({ path: '../env/.env' });
const http = require('http');
const verifyRequestOrigin = require('./util/verifiy_request_origin');
const getParametersApi = require('./database_traitement/api_call_parameters');
const cancelledOrder = require('./service/cancel_order');
const importationOrders = require('./service/insert_update_order')
//const saveLog = require('./database_traitement/save_log_db')
const getDbParamsPartner = require('./database_traitement/admin/db_partner_params')
const tokenExistance = require('./redis_cache/token_existance')
const getDifferenceBetweenTimestamp = require('./util/diff_between_timestamp')
const loadAdminInfos = require('./redis_cache/load_admin_infos')
const getPartnerInfos = require('./redis_cache/get_partner_infos')
const storeToken = require('./redis_cache/store_token')



// Create a http server
const server = http.createServer((req, res) => {
    let statusCod = null
    let responseBody = { status: null, error: null };
    let dbLogError = '';
    if (req.method === 'POST' && req.url === '/api/ratehawk') {
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
            //Check if there are data in webhook payload
            if (body.signature.timestamp && body.signature.token && body.signature.signature && body.type && body.agreement_number && body.partner_order_id) {
                let diffMinutes = getDifferenceBetweenTimestamp(body.signature.timestamp, Date.now(), 'minutes');
                let noExistToken = await tokenExistance(body.signature.token)
                // check if token already exist
                if (noExistToken === 'ok' && diffMinutes <= process.env.DELAYS_MINUTES_WEBHOOK) {
                    let partnerInfos = await getPartnerInfos(body.agreement_number)
                    //console.log("🚀 ~ req.on ~ partnerInfos:", partnerInfos)
                    let resPartner = JSON.parse(partnerInfos)
                    if (resPartner !== undefined) {
                        // Check if the webhook notification is authenticated
                        if (verifyRequestOrigin(
                            {
                                apiKey: resPartner.apikey,
                                timestamp: body.signature.timestamp,
                                token: body.signature.token,
                                signature: body.signature.signature
                            })) {
                            // Collect api informations
                            getParametersApi(resPartner)
                                .then(async (apiParamRes) => {
                                    console.log('test ', resPartner);
                                    apiParam = apiParamRes
                                    // console.log('Received webhook:', body.signature.timestamp, '-', body.signature.token, '-', body.signature.signature, '-', body.type, '-', body.agreement_number, '-', body.partner_order_id);
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
                                    await storeToken(body.signature.token)
                                    res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                                    res.write(JSON.stringify(responseBody));
                                    res.end();
                                })
                                .catch((errorAPI) => {
                                    console.log('getParametersApi error => ' + JSON.stringify(errorAPI));
                                    statusCod = 500
                                    responseBody.error = 'Retry later'
                                    res.writeHead(statusCod, { 'Content-Type': 'application/json' })
                                    res.write(JSON.stringify(responseBody));
                                    res.end();
                                })
                            return
                        } else {
                            //Webservice response
                            statusCod = 401
                            responseBody.error = 'Webhook unidentified source'
                            dbLogError = 'Webhook unidentified source'
                        }

                    } else {
                        statusCod = 500
                        responseBody.error = 'Retry later'
                    }
                } else {
                    statusCod = 401
                    responseBody.error = 'Webhook unidentified source'
                    dbLogError = 'Webhook unidentified source'
                }
            } else {
                // Webservice response
                statusCod = 500
                responseBody.error = 'Some informations in payload of webhook are unavailable'
                dbLogError = 'Some informations in payload of webhook are unavailable'
            }
            res.writeHead(statusCod, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(responseBody));
            res.end();
            return
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
const PORT = process.env.NODE_SERVER_PORT;
server.listen(PORT, () => {
    //console.log(`Server listening on port ${NODE_SERVER_PORT}`);
    getDbParamsPartner().then(async resDBInfos => {
        //console.log('in ', resDBInfos);
        let loadAdmin = await loadAdminInfos(resDBInfos)
        //console.log("🚀 ~ server.listen ~ loadAdmin:", loadAdmin)
    }).catch(err => {
        //console.log('connection to admin db failed: db params aren\'t good or ' + JSON.stringify(err));
    })
});
