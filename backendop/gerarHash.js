const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);
const password = args[0];

if (!password) {
  console.log('Uso: node gerarHash.js <sua_senha>');
  console.log('Exemplo: node gerarHash.js 123456');
  process.exit(1);
}

async function gerarHash() {
  try {
    // 10 é o custo (saltRounds) padrão recomendado para bcrypt
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('\n--- GERADOR DE HASH ---');
    console.log(`Senha Original: ${password}`);
    console.log(`Hash Gerado:    ${hash}`);
    console.log('-----------------------\n');
    console.log('Copie o hash gerado acima e cole no seu banco de dados na coluna de senha para testar o login.');
  } catch (error) {
    console.error('Erro ao gerar hash:', error);
  }
}

gerarHash();
