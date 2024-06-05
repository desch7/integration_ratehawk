const redisClient = require('../config/redis_connection')

// insert token in redis cache and it will be delete after 30 days
const storeToken = async (newToken) => {
    let result = ''

    // insertion of token and setting of expiration time
    const insertToken = async (key, token, days) => {
        const expirationTimeInSeconds = days * 24 * 60 * 60;

        return await redisClient.set(key, token, { EX: expirationTimeInSeconds })
    };

    await redisClient.connect()
        .then(async (res) => {
            let insertResult = await insertToken(String(Date.now()), newToken, process.env.REDIS_TOKEN_DAYS_EXPIRATION)
            console.log("🚀 ~ .then ~ insertResult:", insertResult)
            await redisClient.quit();
            result = insertResult
        })
        .catch((err) => { console.error('Redis error: ', err); })

    return result
}

module.exports = storeToken;
