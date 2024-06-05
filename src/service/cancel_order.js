const { Client } = require('pg')
const saveLog = require('../database_traitement/save_log_db')



const cancelledOrder = async (orderToCancel, dbParamConn) => {

    const client = new Client({
        host: dbParamConn.host,
        user: dbParamConn.username,
        port: dbParamConn.port,
        password: dbParamConn.password,
        database: dbParamConn.bd
    })
    client.connect().then(r => {
        // handle cancellation of booking

        // find the booking to void
        client.query(`select id from hotel_booking where pnr = '${orderToCancel[0].pnr}'`, (err1, result1) => {
            if (!err1) {
                if (result1.rows.length === 1) {
                    // cancellation or void of booking
                    client.query(`select ab_void('${result1.rows[0].id}', 'hotel_booking', 2)`, (err, result) => {
                        client.end;

                        if (String(result.rows[0].ab_void) != '') {
                            // sauvegarde de l'erreur en bd dans la table api_log
                            saveLog('KO_AB', `select ab_void('${result1.rows[0].id}', 'hotel_booking', 2)`, { error: String(result.rows[0].ab_void) }, dbParamConn)
                                .then((res) => {
                                    console.log('KO_AB Cancellation Log successfully save =>' + res);
                                }).catch(err => {
                                    console.log('KO_AB Cancellation log error => ' + err);
                                });
                        } else {
                            // sauvegarde du log de reussite en bd dans la table api_log
                            saveLog('OK_ALL', `select ab_void('${result1.rows[0].id}', 'hotel_booking', 2)`, null, dbParamConn)
                                .then((res) => {
                                    console.log('OK_ALL Cancellation Log successfully save =>' + res);
                                }).catch(err => {
                                    console.log('OK_ALL Cancellation log error => ' + err);
                                });
                        }
                    })
                } else {
                    // sauvegarde de l'erreur en bd dans la table api_log
                    saveLog('KO_AB', `select id from hotel_booking where pnr = '${orderToCancel[0].pnr}'`, { error: `hotel booking with pnr ${orderToCancel[0].pnr} does not exist` }, dbParamConn)
                        .then((res) => {
                            console.log('KO_AB Cancellation Log successfully save =>' + res);
                        }).catch(err => {
                            console.log('KO_AB Cancellation log error => ' + err);
                        });
                }
            } else {
                console.log(`select id from hotel_booking where pnr = '${orderToCancel[0].pnr}' : error in this query`);
            }

        })
    }).catch(err => { })
    return resultCancelled
}

module.exports = cancelledOrder;

