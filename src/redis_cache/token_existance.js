const redis = require("redis");

// verify : if token already exist in redis cache else it will be insert in redis cache and will be delete after 30 days
const tokenExistance = async (newToken) => {
    let cachedToken = ''
    let result = ''
    const redisClient = redis.createClient({
        // The client uses reconnectStrategy to decide when to attempt to reconnect.
        //The default strategy is to calculate the delay before each attempt
        socket: {
            reconnectStrategy: function (retries = 10) {
                if (retries > 20) {
                    console.log("Too many attempts to reconnect. Redis connection was terminated");
                    return new Error("Too many retries.");
                } else {
                    return retries * 500;
                }
            }
        },
        url: process.env.REDIS_URI
    })


    // insertion of token and setting of expiration time
    const insertToken = async (key, token, days) => {
        const expirationTimeInSeconds = days * 24 * 60 * 60;

        await redisClient.set(key, token, { EX: expirationTimeInSeconds })
    };

    // scan if the token already exist
    const scanAllTokens = async () => {
        for await (const ke of redisClient.scanIterator()) {
            let tokenInLoop = await redisClient.get(ke);
            cachedToken = tokenInLoop === newToken ? tokenInLoop : ''
            if (cachedToken) {
                return 'ok'
            }
        }
    }

    await redisClient.connect()
        .then(async (res) => {
            let tokenExist = await scanAllTokens()
            if (tokenExist !== 'ok') {
                await insertToken(String(Date.now()), newToken, process.env.REDIS_TOKEN_DAYS_EXPIRATION)
                redisClient.quit();
                result = 'ok'
            } else {
                redisClient.quit();
                result = 'ko'
            }
        })
        .catch((err) => { console.error('Redis error: ', err); })

    return result
}

module.exports = tokenExistance;
