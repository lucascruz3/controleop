const sql = require('mssql');

const configERP = {
  user: process.env.DB_ERP_USER,
  password: process.env.DB_ERP_PASSWORD,
  server: process.env.DB_ERP_SERVER,
  database: process.env.DB_ERP_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const poolERP = new sql.ConnectionPool(configERP);

module.exports = poolERP;