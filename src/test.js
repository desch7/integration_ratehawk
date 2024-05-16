const connection = require('./config/pg_db_connection')
const getDifferenceBetweenTimestamp = require('./util/diff_between_timestamp')



// token verification
const tokenVerification = (token, Reqtimestamp) => {


    connection.query('SELECT * FROM token_log where token = \'' + token + '\'', (error, result) => {
        if (error) {
            // Reject the Promise if there's an error
            connection.end;
        } else {
            // Resolve the Promise with the result
            if (result.rows.length === 0) {
                // verify if the timestamp received in payload webhook is not to far from now
                let diffMinutes = getDifferenceBetweenTimestamp(Reqtimestamp, Date.now(), 'minutes');
                if (diffMinutes <= 10) {
                    console.log('diffMinutes', diffMinutes);
                } else {
                    console.log('diffMinutes', diffMinutes);
                }
            } else {
                console.log('diffMinutes', diffMinutes);
            }
        }
    });

}

tokenVerification('gdci999', 38457)