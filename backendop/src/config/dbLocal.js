const sql = require('mssql');

const configLocal = {
  user: process.env.DB_LOCAL_USER,
  password: process.env.DB_LOCAL_PASSWORD,
  server: process.env.DB_LOCAL_SERVER,
  database: process.env.DB_LOCAL_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const poolLocal = new sql.ConnectionPool(configLocal);

module.exports = poolLocal;