const { Client } = require('pg')
require("dotenv").config()

const client = new Client({
    host: process.env.PG_HOST,
    user: process.env.PG_USERNAME,
    port: process.env.PG_PORT,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_BD
})

client.connect()
    .then(() => {
        console.log('DB Connected');
    })
    .catch((err) => {
        //console.log('BD connect err =>' + err);
    })

module.exports = client;
