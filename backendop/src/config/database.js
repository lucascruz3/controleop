const poolERP = require('./dbErp');
const poolLocal = require('./dbLocal');

const connectDatabases = async () => {


  try {
    await poolERP.connect();
    console.log(' Conectado ao Banco ERP!');
  } catch (error) {
    console.error(' Erro no Banco ERP:', error.message);
  }
  

  try {
    await poolLocal.connect();
    console.log(' Conectado ao Banco Local!');
  } catch (error) {
    console.error(' Erro no Banco Local:', error.message);
  }
};

module.exports = { connectDatabases };