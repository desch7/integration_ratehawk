const connection = require('../../config/pg_db_connection')


let paramsFailed = { db_connectionErr: null }
let paramsList = []
// collect information for database partner 
const getDbParamsPartner = () => {

    return new Promise((resolve, reject) => {
        // Perform your database query
        // if (connection._connected) {
        connection.query(`select customer_id, bd_password, bd_username, ratehawk_ratehawk_apikey, ratehawk_agreement_number from agency where ratehawk_agreement_number IS NOT NULL`, (error, result) => {
            if (error) {
                // Reject the Promise if there's an error
                //console.log('DataBase ' + error);
                paramsFailed.db_connectionErr = 'DataBase ' + error
                connection.end;
                reject(paramsFailed);
            } else {
                // Resolve the Promise with the result
                result.rows.map((item) => {
                    let params = { host: process.env.PG_HOST, port: parseInt(process.env.PG_PORT), bd: '', username: '', password: '', apikey: '', agreementNumber: '' }
                    params.bd = item.customer_id
                    params.username = item.bd_username
                    params.password = item.bd_password
                    params.apikey = item.ratehawk_ratehawk_apikey
                    params.agreementNumber = item.ratehawk_agreement_number
                    paramsList.push(params)
                })
                connection.end;
                resolve(paramsList);
            }
        });
        // } else {
        //     console.log('connection db failed');
        //     paramsFailed.db_connectionErr = 'connection db failed'
        //     reject(paramsFailed);
        // }
    });

}

module.exports = getDbParamsPartner;