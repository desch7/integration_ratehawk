const redis = require("redis");

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
    url: String(process.env.REDIS_URI)
})

module.exports = redisClient;