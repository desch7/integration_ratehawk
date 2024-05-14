const crypto = require('crypto')

const verifyRequestOrigin = ({ apiKey, timestamp, token, signature }) => {
    const encodedToken = crypto
        .createHmac('sha256', apiKey)
        .update(timestamp + '' + token)
        .digest('hex')
    return (encodedToken === signature)
}

module.exports = verifyRequestOrigin;