const { Client } = require('pg')

const client = new Client({
    host: process.env.PG_ADMIN_HOST,
    user: process.env.PG_ADMIN_USERNAME,
    port: process.env.PG_ADMIN_PORT,
    password: process.env.PG_ADMIN_PASSWORD,
    database: process.env.PG_ADMIN_BD
})


client.connect()

module.exports = client;
