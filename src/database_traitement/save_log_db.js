const { Client } = require('pg')



// sauvegarde des log dans la table api_log
const saveLog = (resultReq, request, reponseReq, dbParamConn) => {
    let api_name = 'Ratehawk_Integration'
    let response = !reponseReq ? '' : `, '${JSON.stringify(reponseReq)}'`
    let responseColumn = !reponseReq ? '' : ', response'
    let query = `INSERT INTO api_log (api_name, result, request ${responseColumn}) VALUES('${api_name}', '${resultReq}', '${request}' ${response})`
    return new Promise((resolve, reject) => {
        const client = new Client({
            host: dbParamConn.host,
            user: dbParamConn.username,
            port: dbParamConn.port,
            password: dbParamConn.password,
            database: dbParamConn.bd
        })
        client.connect().then(r => {
            // Perform your database query
            client.query(query, (error, result) => {
                if (error) {
                    // Reject the Promise if there's an error
                    client.end;
                    reject(error);
                } else {
                    // Resolve the Promise with the result
                    client.end;
                    resolve(result);
                }
            });
        }).catch(err => {
            reject({ db_connectionErr: 'connection db failed: ' + err })
        })

    })
}

module.exports = saveLog;