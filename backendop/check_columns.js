require('dotenv').config();
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

async function check() {
  try {
    const pool = await sql.connect(configLocal);
    const result = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'usuarios'");
    console.log(JSON.stringify(result.recordset, null, 2));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
