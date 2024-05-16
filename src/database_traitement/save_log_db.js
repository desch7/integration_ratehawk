const connection = require('../config/pg_db_connection')



// sauvegarde des log dans la table api_log
const saveLog = (resultReq, request, reponseReq) => {
    if (connection._connected) {
        let api_name = 'Ratehawk_Integration'
        let response = !reponseReq ? '' : `, '${JSON.stringify(reponseReq)}'`
        let responseColumn = !reponseReq ? '' : ', response'
        let query = `INSERT INTO api_log (api_name, result, request ${responseColumn}) VALUES('${api_name}', '${resultReq}', '${request}' ${response})`
        return new Promise((resolve, reject) => {
            // Perform your database query
            connection.query(query, (error, result) => {
                if (error) {
                    // Reject the Promise if there's an error
                    connection.end;
                    reject(error);
                } else {
                    // Resolve the Promise with the result
                    connection.end;
                    resolve(result);
                }
            });
        });
    } else {
        reject({ db_connectionErr: 'connection db failed' });
    }
}

module.exports = saveLog;