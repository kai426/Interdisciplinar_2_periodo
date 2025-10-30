const mysql = require('mysql2/promise');

require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("Variável de ambiente DATABASE_URL não definida. Verifique seu arquivo .env");
}

console.log("Conectando ao banco de dados na nuvem...");

const pool = mysql.createPool({
    uri: connectionString,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    ssl: {
        rejectUnauthorized: false
    } 
});

module.exports = pool;