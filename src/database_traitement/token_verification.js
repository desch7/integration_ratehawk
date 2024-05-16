const connection = require('../config/pg_db_connection')
const getDifferenceBetweenTimestamp = require('../util/diff_between_timestamp')



// token verification
const tokenVerification = (token, Reqtimestamp) => {
    const minutesDelay = 10
    const daysDelayToDelete = 30
    return new Promise((resolve, reject) => {
        // Perform your database query
        if (connection._connected) {
            connection.query('SELECT * FROM token_log where token = \'' + token + '\'', (error, result) => {
                if (error) {
                    // Reject the Promise if there's an error
                    connection.end;
                    reject({ db_connectionErr: error });
                } else {
                    // Resolve the Promise with the result
                    connection.end;
                    if (result.rows.length === 0) {
                        // verify if the timestamp received in payload webhook is not to far from now
                        let diffMinutes = getDifferenceBetweenTimestamp(Reqtimestamp, Date.now(), 'minutes');
                        if (diffMinutes <= minutesDelay) {
                            resolve({ isOk: true });
                        } else {
                            resolve({ isOk: false });
                        }
                    } else {
                        resolve({ isOk: false });
                    }
                }
            });
        } else {
            reject({ db_connectionErr: 'connection db failed' });
        }
    });

}

module.exports = tokenVerification;