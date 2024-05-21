const getDifferenceBetweenTimestamp = require('../util/diff_between_timestamp')
const { Client } = require('pg')



// token verification
const tokenVerification = (token, Reqtimestamp, dbParamConn) => {
    const minutesDelay = 10
    const daysDelayToDelete = 30
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
            client.query('SELECT * FROM token_log where token = \'' + token + '\'', (error, result) => {
                if (error) {
                    // Reject the Promise if there's an error
                    client.end;
                    reject({ db_connectionErr: error });
                } else {
                    // Resolve the Promise with the result
                    client.end;
                    // handle case if the token exist in db
                    if (result.rows.length === 0) {
                        let diffMinutes = getDifferenceBetweenTimestamp(Reqtimestamp, Date.now(), 'minutes');
                        //console.log('diffMinutes=' + diffMinutes);
                        // verify if the timestamp received in payload webhook is not to far from now
                        if (diffMinutes <= minutesDelay) {
                            // delete token that expired
                            client.query(`DELETE FROM token_log WHERE NOW() - insert_time > INTERVAL \'${daysDelayToDelete} days\'`, (error1, result1) => {
                                client.end;
                                if (error1) {
                                    //console.log('error1 in delete token ' + error1);
                                    reject({ db_connectionErr: error1 });
                                } else {
                                    // insertion of the new token
                                    client.query(`insert into token_log (token)  values ('${token}')`, (error2, result2) => {
                                        client.end;
                                        if (error2) {
                                            //console.log('error1 in insertion of token ' + error2);
                                            reject({ db_connectionErr: error1 });
                                        } else {
                                            //console.log('all is ok for token');
                                            resolve({ isOk: true });
                                        }
                                    })
                                }
                            })

                        } else {
                            // webhook occurred to late
                            //console.log('token is bad because webhook occured to late');
                            resolve({ isOk: false });
                        }
                    } else {
                        // token exist in db
                        //console.log('token already exist in db');
                        resolve({ isOk: false });
                    }
                }
            });
        }).catch(err => {
            reject({ db_connectionErr: 'connection db failed: ' + err })
        })

    });

}

module.exports = tokenVerification;