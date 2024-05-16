const connection = require('../config/pg_db_connection')


let params = { base_endpoint: '', api_username: '', api_password: '', db_connectionErr: null }

// collect information for ratehawk api call
const getParametersApi = () => {

    return new Promise((resolve, reject) => {
        // Perform your database query
        if (connection._connected) {
            connection.query('select api_name, value from custom_setting where api_name LIKE \'CS_ratehawk%\'', (error, result) => {
                if (error) {
                    // Reject the Promise if there's an error
                    console.log('DataBase ' + error);
                    params.db_connectionErr = 'DataBase ' + error
                    connection.end;
                    reject(params);
                } else {
                    // Resolve the Promise with the result
                    result.rows.filter((item) => {
                        if (item.api_name === 'CS_ratehawk_base_endpoint') {
                            params.base_endpoint = item.value
                        } else if (item.api_name === 'CS_ratehawk_api_username') {
                            params.api_username = item.value
                        } else if (item.api_name === 'CS_ratehawk_api_password') {
                            params.api_password = item.value
                        }
                    })
                    connection.end;
                    resolve(params);
                }
            });
        } else {
            params.db_connectionErr = 'connection db failed'
            reject(params);
        }
    });

}

module.exports = getParametersApi;