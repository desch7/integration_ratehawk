const connection = require('../../config/pg_db_connection')


let params = { host: process.env.PG_HOST, port: parseInt(process.env.PG_PORT), bd: '', username: '', password: '', db_connectionErr: null }

// collect information for database partner 
const getDbParamsPartner = (agreementNumber) => {

    return new Promise((resolve, reject) => {
        // Perform your database query
        if (connection._connected) {
            connection.query(`select customer_id, bd_password, bd_username from agency where ratehawk_agreement_number = '${agreementNumber}'`, (error, result) => {
                if (error) {
                    // Reject the Promise if there's an error
                    console.log('DataBase ' + error);
                    params.db_connectionErr = 'DataBase ' + error
                    connection.end;
                    reject(params);
                } else {
                    // Resolve the Promise with the result
                    result.rows.map((item) => {
                        params.bd = item.customer_id
                        params.username = item.bd_username
                        params.password = item.bd_password
                    })
                    connection.end;
                    resolve(params);
                }
            });
        } else {
            console.log('connection db failed');
            params.db_connectionErr = 'connection db failed'
            reject(params);
        }
    });

}

module.exports = getDbParamsPartner;